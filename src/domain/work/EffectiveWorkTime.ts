import { TimeRange } from '../shared/TimeRange'
import { WorkPeriod } from './WorkPeriod'
import { WorkCorrection } from './WorkCorrection'
import { WorkPeriodStatus } from './WorkPeriodStatus'
import { DomainError } from '../shared/DomainError'

export class EffectiveWorkTime {
  readonly range: TimeRange

  private constructor(range: TimeRange) {
    this.range = range
  }

  /**
   * Used ONLY for validation during work close.
   * Does NOT require work to be CLOSED.
   */
  static fromClosing(
    workPeriod: WorkPeriod,
    endTime: Date
  ): EffectiveWorkTime {
    const range = TimeRange.create(
      workPeriod.declaredStartTime,
      endTime
    )

    return new EffectiveWorkTime(range)
  }

  /**
   * Used ONLY for finalized work (analytics, reporting)
   */
  static from(
    workPeriod: WorkPeriod,
    corrections: WorkCorrection[]
  ): EffectiveWorkTime {
    if (workPeriod.status !== WorkPeriodStatus.CLOSED) {
      throw new DomainError(
        'WORK_PERIOD_NOT_CLOSED',
        'Effective work time can only be computed for closed work periods'
      )
    }

    const latestCorrection = corrections
      .filter(c => c.workPeriodId === workPeriod.id)
      .sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )[0]

    const start = latestCorrection
      ? latestCorrection.correctedStartTime
      : workPeriod.declaredStartTime

    const end = latestCorrection
      ? latestCorrection.correctedEndTime
      : workPeriod.declaredEndTime!

    return new EffectiveWorkTime(TimeRange.create(start, end))
  }

  durationHours(): number {
    return this.range.durationHours()
  }
}
