import { DriverId, WorkPeriodId } from '../shared/types'
import { DomainError } from '../shared/DomainError'

export class ShiftTransferEvent {
  readonly id: string
  readonly workPeriodId: WorkPeriodId
  readonly toDriverId: DriverId
  readonly fromDriverId: DriverId | null
  readonly createdAt: Date
  readonly reason?: string

  private constructor(
    id: string,
    workPeriodId: WorkPeriodId,
    toDriverId: DriverId,
    fromDriverId: DriverId | null,
    createdAt: Date,
    reason?: string
  ) {
    this.id = id
    this.workPeriodId = workPeriodId
    this.toDriverId = toDriverId
    this.fromDriverId = fromDriverId
    this.createdAt = createdAt
    this.reason = reason
  }

  static create(
    id: string,
    workPeriodId: WorkPeriodId,
    toDriverId: DriverId,
    fromDriverId: DriverId | null,
    createdAt: Date,
    reason?: string
  ): ShiftTransferEvent {
    if (!toDriverId) {
      throw new DomainError(
        'INVALID_SHIFT_TRANSFER',
        'Target driver must be specified'
      )
    }

    if (!(createdAt instanceof Date) || isNaN(createdAt.getTime())) {
      throw new DomainError(
        'INVALID_SHIFT_TRANSFER_TIME',
        'createdAt must be a valid Date'
      )
    }

    return new ShiftTransferEvent(
      id,
      workPeriodId,
      toDriverId,
      fromDriverId,
      createdAt,
      reason
    )
  }

  static reconstitute(
    id: string,
    workPeriodId: WorkPeriodId,
    toDriverId: DriverId,
    fromDriverId: DriverId | null,
    createdAt: Date,
    reason?: string
  ): ShiftTransferEvent {
    return new ShiftTransferEvent(
      id,
      workPeriodId,
      toDriverId,
      fromDriverId,
      createdAt,
      reason
    )
  }

  isAcceptedShift(): boolean {
    return this.fromDriverId !== null
  }
}
