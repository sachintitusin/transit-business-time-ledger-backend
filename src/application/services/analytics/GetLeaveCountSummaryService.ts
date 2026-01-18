import { TimeRange } from '../../../domain/shared/TimeRange'
import { LeaveCountSummary } from '../../../domain/analytics/LeaveCountSummary'
import { DriverId } from '../../../domain/shared/types'
import { LeaveRepository } from '../../ports/LeaveRepository'
import { LeaveCorrectionRepository } from '../../ports/LeaveCorrectionRepository'
import { AppLogger } from '../../ports/Logger'

export class GetLeaveCountSummaryService {
  constructor(
    private readonly leaveRepository: LeaveRepository,
    private readonly leaveCorrectionRepository: LeaveCorrectionRepository,
    private readonly logger: AppLogger
  ) {}

  async execute(query: {
    driverId: DriverId
    range: TimeRange
  }): Promise<LeaveCountSummary> {
    const { driverId, range } = query

    const leaves =
      await this.leaveRepository.findByDriver(driverId)

    const correctionsMap = new Map()

    for (const leave of leaves) {
      const corrections =
        await this.leaveCorrectionRepository.findByLeaveId(leave.id)

      correctionsMap.set(leave.id, corrections)
    }

    return LeaveCountSummary.calculate(
      range,
      leaves,
      correctionsMap
    )
  }
}
