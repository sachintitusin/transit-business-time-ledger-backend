import { WorkPeriod } from '../../../domain/work/WorkPeriod'
import {
  ActiveWorkPeriodAlreadyExists,
} from '../../../domain/work/WorkPeriodErrors'
import { DriverId, WorkPeriodId } from '../../../domain/shared/types'
import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { EntryProjectionRepository } from '../../ports/EntryProjectionRepository'
import { TransactionManager } from '../../ports/TransactionManager'
import { AppLogger } from '../../ports/Logger'
import { EntryType } from '../../projections/EntryType'
import { EntrySourceType } from '../../projections/EntrySourceType'
import { DomainError } from '../../../domain/shared/DomainError'


export class StartWorkService {
  constructor(
    private readonly workPeriodRepository: WorkPeriodRepository,
    private readonly entryProjectionRepository: EntryProjectionRepository,
    private readonly transactionManager: TransactionManager,
    private readonly logger: AppLogger
  ) { }


  async execute(
    driverId: DriverId,
    workPeriodId: WorkPeriodId,
    startTime: Date,
    now: Date
  ): Promise<WorkPeriodId> {
    try {
      return await this.transactionManager.run(async () => {
        this.logger.info('StartWork invoked', {
          driverId,
          workPeriodId,
          startTime,
        })


        // Check if this specific ID already exists
        const existingById = await this.workPeriodRepository.findById(workPeriodId)

        if (existingById) {
          // Validate ownership
          if (existingById.driverId !== driverId) {
            throw new DomainError(
              'WORK_PERIOD_UNAUTHORIZED',
              'Work period with this ID belongs to another driver',
              { workPeriodId, requestedBy: driverId, ownedBy: existingById.driverId }
            )
          }

          // Idempotency - return existing ID
          this.logger.info('StartWork idempotent', {
            driverId,
            workPeriodId,
          })

          return existingById.id
        }


        const existing =
          await this.workPeriodRepository.findOpenByDriver(driverId)


        if (existing) {
          throw ActiveWorkPeriodAlreadyExists()
        }


        const workPeriod =
          WorkPeriod.start(
            workPeriodId,
            driverId,
            startTime,
            now
          )


        await this.workPeriodRepository.save(workPeriod)


        this.logger.info('WorkPeriod saved', {
          driverId,
          workPeriodId,
        })


        // CQRS: Update projection
        await this.entryProjectionRepository.save({
          id: workPeriodId,
          driverId: driverId,
          type: EntryType.WORK,
          effectiveStartTime: startTime,
          effectiveEndTime: null,
          sourceId: workPeriodId,
          sourceType: EntrySourceType.WORK_PERIOD,
          createdAt: now,
        })


        this.logger.info('StartWork succeeded', {
          driverId,
          workPeriodId,
        })


        return workPeriodId
      })
    } catch (err) {
      if (err instanceof DomainError) {
        this.logger.warn('StartWork rejected', {
          driverId,
          code: err.code,
          message: err.message,
        })
        throw err
      }


      this.logger.error('StartWork failed unexpectedly', {
        driverId,
        error: err,
      })


      throw err
    }
  }
}
