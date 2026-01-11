import { TimeRange } from '../../../domain/shared/TimeRange'
import { LeaveCountSummary } from '../../../domain/analytics/LeaveCountSummary'
import { DriverId } from '../../../domain/shared/types'
import { LeaveRepository } from '../../ports/LeaveRepository'
import { LeaveCorrectionRepository } from '../../ports/LeaveCorrectionRepository'

export class GetLeaveCountSummaryService {
  constructor(
    private readonly leaveRepo: LeaveRepository,
    private readonly leaveCorrectionRepo: LeaveCorrectionRepository
  ) {}

  async execute(driverId: DriverId, range: TimeRange) {
    const leaves = await this.leaveRepo.findByDriver(driverId)

    const correctionsMap = new Map()

    for (const leave of leaves) {
      const corrections =
        await this.leaveCorrectionRepo.findByLeaveId(leave.id)
      correctionsMap.set(leave.id, corrections)
    }

    return LeaveCountSummary.calculate(
      range,
      leaves,
      correctionsMap
    )
  }
}
