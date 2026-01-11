import { ShiftTransferEvent } from '../../domain/transfer/ShiftTransferEvent'
import { DriverId, WorkPeriodId } from '../../domain/shared/types'
import { TimeRange } from '../../domain/shared/TimeRange'

export interface ShiftTransferRepository {
  save(event: ShiftTransferEvent): Promise<void>

  findByWorkPeriodId(
    workPeriodId: WorkPeriodId
  ): Promise<ShiftTransferEvent[]>

  findByDriver(
    driverId: DriverId
  ): Promise<ShiftTransferEvent[]>

  findByDriverAndRange(
    driverId: DriverId,
    range: TimeRange
  ): Promise<ShiftTransferEvent[]>
}
