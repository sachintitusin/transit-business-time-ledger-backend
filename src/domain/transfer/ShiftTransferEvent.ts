import { DriverId, WorkPeriodId } from '../shared/types'
import { DomainError } from '../shared/DomainError'

export class ShiftTransferEvent {
  readonly id: string
  readonly workPeriodId: WorkPeriodId
  readonly toDriverId: DriverId
  readonly fromDriverId: DriverId  // ✅ REQUIRED - always has origin
  readonly createdAt: Date
  readonly reason?: string

  private constructor(
    id: string,
    workPeriodId: WorkPeriodId,
    toDriverId: DriverId,
    fromDriverId: DriverId,  // ✅ Not nullable
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
    fromDriverId: DriverId,  // ✅ Required
    createdAt: Date,
    reason?: string
  ): ShiftTransferEvent {
    if (!workPeriodId) {
      throw new DomainError(
        'INVALID_SHIFT_TRANSFER',
        'Work period ID must be specified'
      )
    }

    if (!toDriverId) {
      throw new DomainError(
        'INVALID_SHIFT_TRANSFER',
        'Target driver must be specified'
      )
    }

    // ✅ NEW: fromDriverId is required (every shift must have an origin)
    if (!fromDriverId) {
      throw new DomainError(
        'INVALID_SHIFT_TRANSFER',
        'Origin driver must be specified'
      )
    }

    // ✅ Self-transfer validation
    if (fromDriverId === toDriverId) {
      throw new DomainError(
        'INVALID_SHIFT_TRANSFER',
        'Cannot transfer a shift to the same driver'
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
    fromDriverId: DriverId,  // ✅ Not nullable
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

  // ✅ REMOVED - not needed for your business model
  // No concept of "open shifts" - every transfer has a known origin
}
