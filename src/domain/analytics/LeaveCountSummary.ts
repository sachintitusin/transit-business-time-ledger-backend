import { TimeRange } from '../shared/TimeRange'
import { LeaveEvent } from '../leave/LeaveEvent'
import { LeaveCorrection } from '../leave/LeaveCorrection'
import { EffectiveLeaveTime } from '../leave/EffectiveLeaveTime'
import { LeaveId } from '../shared/types'

export class LeaveCountSummary {
  static calculate(
    range: TimeRange,
    leaves: LeaveEvent[],
    correctionsByLeaveId: Map<LeaveId, LeaveCorrection[]>
  ): { totalLeaves: number } {
    let count = 0

    for (const leave of leaves) {
      const corrections =
        correctionsByLeaveId.get(leave.id) ?? []

      const effectiveLeave =
        EffectiveLeaveTime.from(leave, corrections)

      if (range.overlaps(effectiveLeave.range)) {
        count++
      }
    }

    return {
      totalLeaves: count,
    }
  }
}
