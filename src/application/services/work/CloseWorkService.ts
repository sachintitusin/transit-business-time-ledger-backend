import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { LeaveRepository } from '../../ports/LeaveRepository'
import { LeaveCorrectionRepository } from '../../ports/LeaveCorrectionRepository'
import { TransactionManager } from '../../ports/TransactionManager'
import { AppLogger } from '../../ports/Logger'

import { EffectiveLeaveTime } from '../../../domain/leave/EffectiveLeaveTime'
import { NoActiveWorkPeriod } from '../../../domain/work/WorkPeriodErrors'
import { DriverId } from '../../../domain/shared/types'
import { DomainError } from '../../../domain/shared/DomainError'
import { TimeRange } from '../../../domain/shared/TimeRange'
import { MaxShiftDurationPolicy } from '../../policies/MaxShiftDurationPolicy'

export class CloseWorkService {
  constructor(
    private readonly workPeriodRepository: WorkPeriodRepository,
    private readonly leaveRepository: LeaveRepository,
    private readonly leaveCorrectionRepository: LeaveCorrectionRepository,
    private readonly transactionManager: TransactionManager,
    private readonly maxShiftPolicy: MaxShiftDurationPolicy = new MaxShiftDurationPolicy(),
    private readonly logger: AppLogger
  ) {}

  async execute(
    driverId: DriverId,
    endTime: Date
  ): Promise<void> {
    this.logger.info('CloseWork invoked', {
      driverId,
      endTime,
    })

    try {
      await this.transactionManager.run(async () => {
        const workPeriod =
          await this.workPeriodRepository.findOpenByDriver(driverId)

        if (!workPeriod) {
          throw NoActiveWorkPeriod()
        }

        const candidateWorkRange =
          TimeRange.create(
            workPeriod.declaredStartTime,
            endTime
          )

        this.maxShiftPolicy.validate(candidateWorkRange)

        const leaves =
          await this.leaveRepository.findByDriver(driverId)

        const leaveIds = leaves.map(l => l.id)

        const leaveCorrections =
          await this.leaveCorrectionRepository.findByLeaveIds(leaveIds)

        const effectiveLeaves =
          leaves.map(leave =>
            EffectiveLeaveTime.from(
              leave,
              leaveCorrections.filter(c => c.leaveId === leave.id)
            )
          )

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

        const overlappingWorks =
          await this.workPeriodRepository.findEffectiveOverlapping(
            driverId,
            candidateWorkRange,
            workPeriod.id
          )

        if (overlappingWorks.length > 0) {
          throw new DomainError(
            'WORK_OVERLAPS_WORK',
            'Cannot close work period: overlaps with existing effective work time',
            {
              workStart: candidateWorkRange.start,
              workEnd: candidateWorkRange.end,
              overlappingWorkIds: overlappingWorks.map(w => w.id),
            }
          )
        }

        workPeriod.close(endTime)

        await this.workPeriodRepository.save(workPeriod)
      })

      this.logger.info('CloseWork succeeded', {
        driverId,
        endTime,
      })
    } catch (err) {
      if (err instanceof DomainError) {
        this.logger.warn('CloseWork rejected', {
          driverId,
          code: err.code,
          message: err.message,
        })
        throw err
      }

      this.logger.error('CloseWork failed unexpectedly', {
        driverId,
        error: err,
      })

      throw err
    }
  }
}
