import { WorkPeriod } from '../../../domain/work/WorkPeriod'
import {
  ActiveWorkPeriodAlreadyExists,
} from '../../../domain/work/WorkPeriodErrors'
import { DriverId, WorkPeriodId } from '../../../domain/shared/types'
import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { TransactionManager } from '../../ports/TransactionManager'

export class StartWorkService {
  constructor(
    private readonly workPeriodRepository: WorkPeriodRepository,
    private readonly transactionManager: TransactionManager
  ) {}

  async execute(
    driverId: DriverId,
    workPeriodId: WorkPeriodId,
    startTime: Date,
    now: Date
  ): Promise<void> {
    await this.transactionManager.run(async () => {
      const existing =
        await this.workPeriodRepository.findOpenByDriver(driverId)

      if (existing) {
        throw ActiveWorkPeriodAlreadyExists()
      }

      const workPeriod = WorkPeriod.start(
        workPeriodId,
        driverId,
        startTime,
        now
      )

      await this.workPeriodRepository.save(workPeriod)
    })
  }
}
