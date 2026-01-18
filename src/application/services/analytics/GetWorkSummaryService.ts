import { TimeRange } from '../../../domain/shared/TimeRange'
import { WorkSummary } from '../../../domain/analytics/WorkSummary'
import { DriverId } from '../../../domain/shared/types'
import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { WorkCorrectionRepository } from '../../ports/WorkCorrectionRepository'
import { AppLogger } from '../../ports/Logger'

export class GetWorkSummaryService {
  constructor(
    private readonly workPeriodRepository: WorkPeriodRepository,
    private readonly workCorrectionRepository: WorkCorrectionRepository,
    private readonly logger: AppLogger
  ) {}

  async execute(query: {
    driverId: DriverId
    range: TimeRange
  }): Promise<WorkSummary> {
    const { driverId, range } = query

    const workPeriods =
      await this.workPeriodRepository.findClosedByDriver(driverId)

    const correctionsMap = new Map()

    for (const work of workPeriods) {
      const corrections =
        await this.workCorrectionRepository.findByWorkPeriodId(work.id)

      correctionsMap.set(work.id, corrections)
    }

    return WorkSummary.calculate(
      range,
      workPeriods,
      correctionsMap
    )
  }
}
