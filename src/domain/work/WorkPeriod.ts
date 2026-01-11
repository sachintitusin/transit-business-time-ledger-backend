import { TimeRange } from '../shared/TimeRange'
import { WorkPeriodStatus } from './WorkPeriodStatus'
import {
  InvalidEndTime,
  WorkPeriodAlreadyClosed,
} from './WorkPeriodErrors'
import { DriverId, WorkPeriodId } from '../shared/types'

export class WorkPeriod {
  readonly id: WorkPeriodId
  readonly driverId: DriverId
  readonly declaredStartTime: Date
  readonly createdAt: Date

  private _declaredEndTime: Date | null
  private _status: WorkPeriodStatus

  private constructor(
    id: WorkPeriodId,
    driverId: DriverId,
    declaredStartTime: Date,
    createdAt: Date
  ) {
    this.id = id
    this.driverId = driverId
    this.declaredStartTime = declaredStartTime
    this.createdAt = createdAt
    this._declaredEndTime = null
    this._status = WorkPeriodStatus.OPEN
  }

  // --- Factories ---

  static start(
    id: WorkPeriodId,
    driverId: DriverId,
    startTime: Date,
    createdAt: Date
  ): WorkPeriod {
    return new WorkPeriod(id, driverId, startTime, createdAt)
  }

  // --- State queries ---

  get status(): WorkPeriodStatus {
    return this._status
  }

  get declaredEndTime(): Date | null {
    return this._declaredEndTime
  }

  isOpen(): boolean {
    return this._status === WorkPeriodStatus.OPEN
  }

  isClosed(): boolean {
    return this._status === WorkPeriodStatus.CLOSED
  }

  // --- Behavior ---

  close(endTime: Date): void {
    if (this.isClosed()) {
      throw WorkPeriodAlreadyClosed()
    }

    if (endTime <= this.declaredStartTime) {
      throw InvalidEndTime(this.declaredStartTime, endTime)
    }

    // Validate time range explicitly
    TimeRange.create(this.declaredStartTime, endTime)

    this._declaredEndTime = endTime
    this._status = WorkPeriodStatus.CLOSED
  }
}
