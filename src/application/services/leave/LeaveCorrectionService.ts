import { LeaveRepository } from '../../ports/LeaveRepository'
import { LeaveCorrectionRepository } from '../../ports/LeaveCorrectionRepository'
import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { TransactionManager } from '../../ports/TransactionManager'
import { AppLogger } from '../../ports/Logger'

import { LeaveCorrection } from '../../../domain/leave/LeaveCorrection'
import { EffectiveLeaveTime } from '../../../domain/leave/EffectiveLeaveTime'
import { EffectiveWorkTime } from '../../../domain/work/EffectiveWorkTime'
import { WorkLeaveOverlapPolicy } from '../../policies/WorkLeaveOverlapPolicy'
import { TimeRange } from '../../../domain/shared/TimeRange'
import {
  DriverId,
  LeaveId,
  LeaveCorrectionId,
} from '../../../domain/shared/types'
import { DomainError } from '../../../domain/shared/DomainError'
import { WorkPeriodStatus } from '../../../domain/work/WorkPeriodStatus'

export class LeaveCorrectionService {
  constructor(
    private readonly leaveRepository: LeaveRepository,
    private readonly leaveCorrectionRepository: LeaveCorrectionRepository,
    private readonly workPeriodRepository: WorkPeriodRepository,
    private readonly transactionManager: TransactionManager,
    private readonly logger: AppLogger
  ) {}

  async execute(command: {
    driverId: DriverId
    leaveId: LeaveId
    correctionId: LeaveCorrectionId
    correctedStartTime: Date
    correctedEndTime: Date
    now: Date
    reason?: string
  }): Promise<void> {
    await this.transactionManager.run(async () => {
      const {
        driverId,
        leaveId,
        correctionId,
        correctedStartTime,
        correctedEndTime,
        now,
        reason,
      } = command

      const leave = await this.leaveRepository.findById(leaveId)

      if (!leave || leave.driverId !== driverId) {
        throw new DomainError(
          'LEAVE_NOT_FOUND',
          'Leave not found for driver'
        )
      }

      const correction = LeaveCorrection.create(
        correctionId,
        leave,
        correctedStartTime,
        correctedEndTime,
        now,
        reason
      )

      const existingCorrections =
        await this.leaveCorrectionRepository.findByLeaveId(leave.id)

      const allCorrections = [...existingCorrections, correction]

      const effectiveLeave =
        EffectiveLeaveTime.from(leave, allCorrections)

      const workPeriods =
        await this.workPeriodRepository.findByDriver(driverId)

      for (const work of workPeriods) {
        if (work.status === WorkPeriodStatus.OPEN) {
          const openWorkRange = TimeRange.create(
            work.declaredStartTime,
            now
          )

          if (openWorkRange.overlaps(effectiveLeave.range)) {
            throw new DomainError(
              'WORK_OVERLAPS_LEAVE',
              'Leave correction overlaps with open work period'
            )
          }
        } else {
          const effectiveWork =
            EffectiveWorkTime.from(work, [])

          WorkLeaveOverlapPolicy.assertNoOverlap(
            effectiveWork,
            [effectiveLeave]
          )
        }
      }

      await this.leaveCorrectionRepository.save(correction)
    })
  }
}
