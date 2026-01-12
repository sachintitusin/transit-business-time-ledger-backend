import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { LeaveRepository } from '../../ports/LeaveRepository'
import { LeaveCorrectionRepository } from '../../ports/LeaveCorrectionRepository'
import { TransactionManager } from '../../ports/TransactionManager'

import { EffectiveLeaveTime } from '../../../domain/leave/EffectiveLeaveTime'
import { WorkLeaveOverlapPolicy } from '../../policies/WorkLeaveOverlapPolicy'
import { NoActiveWorkPeriod } from '../../../domain/work/WorkPeriodErrors'
import { DriverId } from '../../../domain/shared/types'
import { DomainError } from '../../../domain/shared/DomainError'
import { TimeRange } from '../../../domain/shared/TimeRange'

export class CloseWorkService {
  constructor(
    private readonly workPeriodRepository: WorkPeriodRepository,
    private readonly leaveRepository: LeaveRepository,
    private readonly leaveCorrectionRepository: LeaveCorrectionRepository,
    private readonly transactionManager: TransactionManager
  ) {}

  async execute(
    driverId: DriverId,
    endTime: Date
  ): Promise<void> {
    await this.transactionManager.run(async () => {
      // 1. Load active work
      const workPeriod =
        await this.workPeriodRepository.findOpenByDriver(driverId)

      if (!workPeriod) {
        throw NoActiveWorkPeriod()
      }

      // 2. Create candidate work range (don't close yet)
      const candidateWorkRange = TimeRange.create(
        workPeriod.declaredStartTime,
        endTime
      )

      // 3. Load leave data
      const leaves =
        await this.leaveRepository.findByDriver(driverId)

      const leaveIds = leaves.map(l => l.id)

      const leaveCorrections =
        await this.leaveCorrectionRepository.findByLeaveIds(leaveIds)

      // 4. Compute effective leaves
      const effectiveLeaves = leaves.map(leave =>
        EffectiveLeaveTime.from(
          leave,
          leaveCorrections.filter(c => c.leaveId === leave.id)
        )
      )

      // 5. Check for overlaps (I16 invariant)
      for (const effectiveLeave of effectiveLeaves) {
        if (candidateWorkRange.overlaps(effectiveLeave.range)) {
          throw new DomainError(
            'WORK_OVERLAPS_LEAVE',
            'Cannot close work period: overlaps with recorded leave',
            {
              workStart: candidateWorkRange.start,
              workEnd: candidateWorkRange.end,
              leaveStart: effectiveLeave.range.start,
              leaveEnd: effectiveLeave.range.end,
            }
          )
        }
      }

      // 6. Now safe to close
      workPeriod.close(endTime)

      // 7. Persist
      await this.workPeriodRepository.save(workPeriod)
    })
  }
}
