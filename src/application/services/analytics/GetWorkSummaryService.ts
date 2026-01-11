import { TimeRange } from '../../../domain/shared/TimeRange'
import { WorkSummary } from '../../../domain/analytics/WorkSummary'
import { DriverId } from '../../../domain/shared/types'
import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { WorkCorrectionRepository } from '../../ports/WorkCorrectionRepository'

export class GetWorkSummaryService {
  constructor(
    private readonly workPeriodRepo: WorkPeriodRepository,
    private readonly workCorrectionRepo: WorkCorrectionRepository
  ) {}

  async execute(driverId: DriverId, range: TimeRange) {
    const workPeriods =
      await this.workPeriodRepo.findClosedByDriver(driverId)

    const correctionsMap = new Map()

    for (const work of workPeriods) {
      const corrections =
        await this.workCorrectionRepo.findByWorkPeriodId(work.id)
      correctionsMap.set(work.id, corrections)
    }

    return WorkSummary.calculate(
      range,
      workPeriods,
      correctionsMap
    )
  }
}
