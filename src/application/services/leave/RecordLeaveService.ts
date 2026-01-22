import { LeaveRepository } from '../../ports/LeaveRepository'
import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { WorkCorrectionRepository } from '../../ports/WorkCorrectionRepository'
import { EntryProjectionRepository } from '../../ports/EntryProjectionRepository'
import { TransactionManager } from '../../ports/TransactionManager'
import { AppLogger } from '../../ports/Logger'

import { EffectiveLeaveTime } from '../../../domain/leave/EffectiveLeaveTime'
import { EntryType } from '../../projections/EntryType'
import { EntrySourceType } from '../../projections/EntrySourceType'
import { EffectiveWorkTime } from '../../../domain/work/EffectiveWorkTime'
import { LeaveEvent } from '../../../domain/leave/LeaveEvent'
import { DomainError } from '../../../domain/shared/DomainError'
import { TimeRange } from '../../../domain/shared/TimeRange'
import {
  DriverId,
  LeaveId,
} from '../../../domain/shared/types'

export class RecordLeaveService {
  constructor(
    private readonly leaveRepository: LeaveRepository,
    private readonly workPeriodRepository: WorkPeriodRepository,
    private readonly workCorrectionRepository: WorkCorrectionRepository,
    private readonly entryProjectionRepository: EntryProjectionRepository,
    private readonly transactionManager: TransactionManager,
    private readonly logger: AppLogger
  ) { }

  async execute(command: {
    driverId: DriverId
    leaveId: LeaveId
    startTime: Date
    endTime: Date
    now: Date
    reason?: string
  }): Promise<void> {
    const { driverId, leaveId, startTime, endTime } = command

    this.logger.info('RecordLeave invoked', {
      driverId,
      leaveId,
      startTime,
      endTime,
    })

    try {
      await this.transactionManager.run(async () => {
        const {
          now,
          reason,
        } = command

        const leave =
          LeaveEvent.create(
            leaveId,
            driverId,
            startTime,
            endTime,
            now,
            reason
          )

        const effectiveLeave =
          EffectiveLeaveTime.from(leave, [])

        const openWork =
          await this.workPeriodRepository.findOpenByDriver(driverId)

        if (openWork) {
          const openWorkRange =
            TimeRange.create(
              openWork.declaredStartTime,
              effectiveLeave.range.end
            )

          if (openWorkRange.overlaps(effectiveLeave.range)) {
            throw new DomainError(
              'WORK_OVERLAPS_LEAVE',
              'Cannot record leave overlapping an open work period'
            )
          }
        }

        const allWork =
          await this.workPeriodRepository.findByDriver(driverId)

        for (const work of allWork) {
          if (work.isOpen()) continue

          const corrections =
            await this.workCorrectionRepository.findByWorkPeriodId(work.id)

          const effectiveWork =
            EffectiveWorkTime.from(work, corrections)

          if (effectiveWork.range.overlaps(effectiveLeave.range)) {
            throw new DomainError(
              'LEAVE_OVERLAPS_WORK',
              'Leave period overlaps with existing work period',
              { workPeriodId: work.id }
            )
          }
        }

        await this.leaveRepository.save(leave)

        // CQRS: Update projection
        await this.entryProjectionRepository.save({
          id: leave.id,
          driverId: leave.driverId,
          type: EntryType.LEAVE,
          effectiveStartTime: leave.declaredStartTime,
          effectiveEndTime: leave.declaredEndTime,
          sourceId: leave.id,
          sourceType: EntrySourceType.LEAVE_EVENT,
          createdAt: leave.createdAt,
        })
      })
      this.logger.info('RecordLeave succeeded', {
        driverId,
        leaveId,
      })
    } catch (err) {
      if (err instanceof DomainError) {
        this.logger.warn('RecordLeave rejected', {
          driverId,
          leaveId,
          code: err.code,
          message: err.message,
        })
        throw err
      }

      this.logger.error('RecordLeave failed unexpectedly', {
        driverId,
        leaveId,
        error: err,
      })

      throw err
    }
  }
}
