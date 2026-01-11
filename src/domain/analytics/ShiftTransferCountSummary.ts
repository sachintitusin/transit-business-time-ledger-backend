import { ShiftTransferEvent } from '../transfer/ShiftTransferEvent'
import { TimeRange } from '../shared/TimeRange'

export class ShiftTransferCountSummary {
  static calculate(
    range: TimeRange,
    events: ShiftTransferEvent[]
  ): { totalTransfers: number } {
    let count = 0

    for (const event of events) {
      if (
        event.createdAt >= range.start &&
        event.createdAt < range.end
      ) {
        count++
      }
    }

    return {
      totalTransfers: count,
    }
  }
}
