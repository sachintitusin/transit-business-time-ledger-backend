import { ShiftTransferRepository } from '../../src/application/ports/ShiftTransferRepository'
import { ShiftTransferEvent } from '../../src/domain/transfer/ShiftTransferEvent'
import { DriverId, WorkPeriodId } from '../../src/domain/shared/types'
import { TimeRange } from '../../src/domain/shared/TimeRange'

export class InMemoryShiftTransferRepository
  implements ShiftTransferRepository
{
  private store: ShiftTransferEvent[] = []

  async save(event: ShiftTransferEvent): Promise<void> {
    this.store.push(event)
  }

  async findByWorkPeriodId(
    workPeriodId: WorkPeriodId
  ): Promise<ShiftTransferEvent[]> {
    return this.store.filter(
      e => e.workPeriodId === workPeriodId
    )
  }

  async findByDriver(
    driverId: DriverId
  ): Promise<ShiftTransferEvent[]> {
    return this.store.filter(
      e =>
        e.toDriverId === driverId ||
        e.fromDriverId === driverId
    )
  }

  async findByDriverAndRange(
    driverId: DriverId,
    range: TimeRange
  ): Promise<ShiftTransferEvent[]> {
    return this.store.filter(e => {
      const involved =
        e.toDriverId === driverId ||
        e.fromDriverId === driverId

      return (
        involved &&
        range.overlaps(
          TimeRange.create(e.createdAt, e.createdAt)
        )
      )
    })
  }
}
