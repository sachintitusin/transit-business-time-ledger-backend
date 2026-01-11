import { TimeRange } from '../shared/TimeRange'
import { LeaveEvent } from './LeaveEvent'
import { LeaveCorrection } from './LeaveCorrection'
import { DomainError } from '../shared/DomainError'

export class EffectiveLeaveTime {
  readonly range: TimeRange

  private constructor(range: TimeRange) {
    this.range = range
  }

  static from(
    leave: LeaveEvent,
    corrections: LeaveCorrection[]
  ): EffectiveLeaveTime {
    const invalidCorrections = corrections.filter(
      c => c.leaveId !== leave.id
    )

    if (invalidCorrections.length > 0) {
      throw new DomainError(
        'INVALID_LEAVE_CORRECTIONS_PROVIDED',
        'Corrections do not belong to the leave event',
        {
          leaveId: leave.id,
          invalidCount: invalidCorrections.length,
        }
      )
    }

    const latestCorrection = corrections
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]

    const start = latestCorrection
      ? latestCorrection.correctedStartTime
      : leave.declaredStartTime

    const end = latestCorrection
      ? latestCorrection.correctedEndTime
      : leave.declaredEndTime

    return new EffectiveLeaveTime(TimeRange.create(start, end))
  }

  durationHours(): number {
    return this.range.durationHours()
  }
}
