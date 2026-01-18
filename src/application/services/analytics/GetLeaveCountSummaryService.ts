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

    this.logger.info('GetLeaveCountSummary invoked', {
      driverId,
      rangeStart: range.start,
      rangeEnd: range.end,
    })

    try {
      const leaves =
        await this.leaveRepository.findByDriver(driverId)

      const correctionsMap = new Map()

      for (const leave of leaves) {
        const corrections =
          await this.leaveCorrectionRepository.findByLeaveId(leave.id)

        correctionsMap.set(leave.id, corrections)
      }

      const summary =
        LeaveCountSummary.calculate(
          range,
          leaves,
          correctionsMap
        )

      this.logger.info('GetLeaveCountSummary succeeded', {
        driverId,
        totalLeaves: summary.totalLeaves,
      })


      return summary
    } catch (err) {
      this.logger.error('GetLeaveCountSummary failed unexpectedly', {
        driverId,
        error: err,
      })
      throw err
    }
  }
}
