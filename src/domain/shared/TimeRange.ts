import { DomainError } from './DomainError'

export class TimeRange {
  readonly start: Date
  readonly end: Date

  private constructor(start: Date, end: Date) {
    this.start = start
    this.end = end
  }

  static create(start: Date, end: Date): TimeRange {
    if (!(start instanceof Date) || isNaN(start.getTime())) {
      throw new DomainError(
        'INVALID_START_TIME',
        'Start time must be a valid Date'
      )
    }

    if (!(end instanceof Date) || isNaN(end.getTime())) {
      throw new DomainError(
        'INVALID_END_TIME',
        'End time must be a valid Date'
      )
    }

    if (end <= start) {
      throw new DomainError(
        'INVALID_TIME_RANGE',
        'End time must be after start time',
        { start, end }
      )
    }

    return new TimeRange(start, end)
  }

  overlaps(other: TimeRange): boolean {
    return this.start < other.end && other.start < this.end
  }

  durationMs(): number {
    return this.end.getTime() - this.start.getTime()
  }

  durationHours(): number {
    return this.durationMs() / (1000 * 60 * 60)
  }
}
