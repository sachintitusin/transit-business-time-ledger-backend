import { EffectiveWorkTime } from '../../domain/work/EffectiveWorkTime'
import { EffectiveLeaveTime } from '../../domain/leave/EffectiveLeaveTime'
import { DomainError } from '../../domain/shared/DomainError'

export class WorkLeaveOverlapPolicy {
  static assertNoOverlap(
    work: EffectiveWorkTime,
    leaves: EffectiveLeaveTime[]
  ): void {
    for (const leave of leaves) {
      if (work.range.overlaps(leave.range)) {
        throw new DomainError(
          'WORK_OVERLAPS_LEAVE',
          'Work time overlaps with recorded leave time',
          {
            workStart: work.range.start,
            workEnd: work.range.end,
            leaveStart: leave.range.start,
            leaveEnd: leave.range.end,
          }
        )
      }
    }
  }
}
