// domain/policies/MaxShiftDurationPolicy.ts

import { DomainError } from "../../domain/shared/DomainError"
import { TimeRange } from "../../domain/shared/TimeRange"


export class MaxShiftDurationPolicy {
  private readonly maxHours: number

  constructor(hours: number = 14) {  // OC Transpo HOS default
    this.maxHours = hours
  }

  validate(range: TimeRange): void {
    const durationHours = range.durationHours()
    
    if (durationHours > this.maxHours) {
      throw new DomainError(
        'SHIFT_TOO_LONG',
        `Shift duration ${durationHours.toFixed(1)}h exceeds policy maximum of ${this.maxHours}h`,
        {
          actualHours: durationHours.toFixed(1),
          maxHours: this.maxHours,
          durationMs: range.durationMs(),
          start: range.start.toISOString(),
          end: range.end.toISOString(),
        }
      )
    }
  }

  wouldViolate(range: TimeRange): boolean {
    return range.durationHours() > this.maxHours
  }

  get maxMs(): number {
    return this.maxHours * 60 * 60 * 1000
  }

  get description(): string {
    return `${this.maxHours}h maximum single shift duration (OC Transpo HOS)`
  }
}
