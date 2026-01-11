import { WorkPeriod } from '../../../domain/work/WorkPeriod'
import {
  ActiveWorkPeriodAlreadyExists,
} from '../../../domain/work/WorkPeriodErrors'
import { DriverId, WorkPeriodId } from '../../../domain/shared/types'
import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'

export class StartWorkService {
  constructor(
    private readonly workPeriodRepository: WorkPeriodRepository
  ) {}

  async execute(
    driverId: DriverId,
    workPeriodId: WorkPeriodId,
    startTime: Date,
    now: Date
  ): Promise<void> {
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
  }
}
