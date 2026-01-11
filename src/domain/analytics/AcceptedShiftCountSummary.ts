import { ShiftTransferEvent } from '../transfer/ShiftTransferEvent'
import { TimeRange } from '../shared/TimeRange'
import { DriverId } from '../shared/types'

export class AcceptedShiftCountSummary {
  static calculate(
    range: TimeRange,
    driverId: DriverId,
    events: ShiftTransferEvent[]
  ): { acceptedShifts: number } {
    let count = 0

    for (const event of events) {
      const isAccepted =
        event.fromDriverId !== null &&
        event.toDriverId === driverId

      if (
        isAccepted &&
        event.createdAt >= range.start &&
        event.createdAt < range.end
      ) {
        count++
      }
    }

    return {
      acceptedShifts: count,
    }
  }
}
