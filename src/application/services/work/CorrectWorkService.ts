import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { WorkCorrectionRepository } from '../../ports/WorkCorrectionRepository'
import { LeaveRepository } from '../../ports/LeaveRepository'
import { LeaveCorrectionRepository } from '../../ports/LeaveCorrectionRepository'
import { TransactionManager } from '../../ports/TransactionManager'
import { AppLogger } from '../../ports/Logger'

import { WorkCorrection } from '../../../domain/work/WorkCorrection'
import { EffectiveWorkTime } from '../../../domain/work/EffectiveWorkTime'
import { EffectiveLeaveTime } from '../../../domain/leave/EffectiveLeaveTime'
import { WorkLeaveOverlapPolicy } from '../../policies/WorkLeaveOverlapPolicy'
import { DomainError } from '../../../domain/shared/DomainError'
import { TimeRange } from '../../../domain/shared/TimeRange'
import {
  DriverId,
  WorkCorrectionId,
  WorkPeriodId,
} from '../../../domain/shared/types'
import { MaxShiftDurationPolicy } from '../../policies/MaxShiftDurationPolicy'

export class CorrectWorkService {
  constructor(
    private readonly workPeriodRepository: WorkPeriodRepository,
    private readonly workCorrectionRepository: WorkCorrectionRepository,
    private readonly leaveRepository: LeaveRepository,
    private readonly leaveCorrectionRepository: LeaveCorrectionRepository,
    private readonly transactionManager: TransactionManager,
    private readonly maxShiftPolicy: MaxShiftDurationPolicy = new MaxShiftDurationPolicy(),
    private readonly logger: AppLogger
  ) {}

  async execute(command: {
    driverId: DriverId
    workPeriodId: WorkPeriodId
    correctionId: WorkCorrectionId
    correctedStartTime: Date
    correctedEndTime: Date
    now: Date
    reason?: string
  }): Promise<void> {
    await this.transactionManager.run(async () => {
      const {
        driverId,
        workPeriodId,
        correctionId,
        correctedStartTime,
        correctedEndTime,
        now,
        reason,
      } = command

      const workPeriod = await this.workPeriodRepository.findById(workPeriodId)
      if (!workPeriod || workPeriod.driverId !== driverId) {
        throw new DomainError(
          'WORK_PERIOD_NOT_FOUND',
          'Work period not found for driver'
        )
      }

      if (!workPeriod.isClosed()) {
        throw new DomainError(
          'WORK_NOT_CLOSED',
          'Work period must be closed before correction'
        )
      }

      const correction = WorkCorrection.create(
        correctionId,
        workPeriod,
        correctedStartTime,
        correctedEndTime,
        now,
        reason
      )

      const existingCorrections =
        await this.workCorrectionRepository.findByWorkPeriodId(workPeriod.id)
      const allCorrections = [...existingCorrections, correction]

      const correctedRange = TimeRange.create(
        correction.correctedStartTime,
        correction.correctedEndTime
      )

      this.maxShiftPolicy.validate(correctedRange)

      const overlappingWorks =
        await this.workPeriodRepository.findEffectiveOverlapping(
          driverId,
          correctedRange,
          workPeriod.id
        )

      if (overlappingWorks.length > 0) {
        throw new DomainError(
          'WORK_OVERLAPS_EXISTING_WORK',
          `Correction overlaps ${overlappingWorks.length} prior period(s)`,
          {
            overlappingWorkIds: overlappingWorks.map(w => w.id),
            correctedStart: correctedRange.start,
            correctedEnd: correctedRange.end,
          }
        )
      }

      const effectiveWork = EffectiveWorkTime.from(workPeriod, allCorrections)

      const leaves = await this.leaveRepository.findByDriver(driverId)
      const leaveIds = leaves.map(l => l.id)
      const leaveCorrections =
        await this.leaveCorrectionRepository.findByLeaveIds(leaveIds)
      const effectiveLeaves = leaves.map(leave =>
        EffectiveLeaveTime.from(
          leave,
          leaveCorrections.filter(c => c.leaveId === leave.id)
        )
      )

      WorkLeaveOverlapPolicy.assertNoOverlap(effectiveWork, effectiveLeaves)

      await this.workCorrectionRepository.save(correction)
    })
  }
}
