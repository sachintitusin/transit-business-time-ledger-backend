import { v4 as uuidv4 } from 'uuid'
import { WorkPeriod } from '../../../domain/work/WorkPeriod'
import {
  ActiveWorkPeriodAlreadyExists,
} from '../../../domain/work/WorkPeriodErrors'
import { DriverId, WorkPeriodId, asWorkPeriodId } from '../../../domain/shared/types'
import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { TransactionManager } from '../../ports/TransactionManager'
import { AppLogger } from '../../ports/Logger'
import { DomainError } from '../../../domain/shared/DomainError'

export class StartWorkService {
  constructor(
    private readonly workPeriodRepository: WorkPeriodRepository,
    private readonly transactionManager: TransactionManager,
    private readonly logger: AppLogger
  ) {}

  async execute(
    driverId: DriverId,
    startTime: Date,
    now: Date
  ): Promise<WorkPeriodId> {
    this.logger.info('StartWork invoked', {
      driverId,
      startTime,
    })

    try {
      return await this.transactionManager.run(async () => {
        const existing =
          await this.workPeriodRepository.findOpenByDriver(driverId)

        if (existing) {
          throw ActiveWorkPeriodAlreadyExists()
        }

        const rawId = uuidv4()
        const workPeriodId = asWorkPeriodId(rawId)

        const workPeriod =
          WorkPeriod.start(
            workPeriodId,
            driverId,
            startTime,
            now
          )

        await this.workPeriodRepository.save(workPeriod)

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
