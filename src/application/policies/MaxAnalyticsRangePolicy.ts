import { TimeRange } from "../../domain/shared/TimeRange";
import { DomainError } from "../../domain/shared/DomainError";

export class MaxAnalyticsRangePolicy {
  constructor(
    private readonly maxDays: number
  ) {}

  assertWithinLimit(range: TimeRange): void {
    const msPerDay = 1000 * 60 * 60 * 24;
    const days =
      (range.end.getTime() - range.start.getTime()) / msPerDay;

    if (days > this.maxDays) {
      throw new DomainError(
        "ANALYTICS_RANGE_TOO_LARGE",
        `Maximum allowed range is ${this.maxDays} days`
      );
    }
  }
}
