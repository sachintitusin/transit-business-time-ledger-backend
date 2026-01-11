import { TimeRange } from '../shared/TimeRange'
import { DriverId, LeaveId } from '../shared/types'
import { InvalidLeaveTime } from './LeaveErrors'

export class LeaveEvent {
  readonly id: LeaveId
  readonly driverId: DriverId
  readonly declaredStartTime: Date
  readonly declaredEndTime: Date
  readonly leaveType?: string
  readonly createdAt: Date

  private constructor(
    id: LeaveId,
    driverId: DriverId,
    declaredStartTime: Date,
    declaredEndTime: Date,
    leaveType: string | undefined,
    createdAt: Date
  ) {
    this.id = id
    this.driverId = driverId
    this.declaredStartTime = declaredStartTime
    this.declaredEndTime = declaredEndTime
    this.leaveType = leaveType
    this.createdAt = createdAt
  }

  static create(
    id: LeaveId,
    driverId: DriverId,
    startTime: Date,
    endTime: Date,
    createdAt: Date,
    leaveType?: string
  ): LeaveEvent {
    if (endTime <= startTime) {
      throw InvalidLeaveTime(startTime, endTime)
    }

    // Defensive validation
    TimeRange.create(startTime, endTime)

    return new LeaveEvent(
      id,
      driverId,
      startTime,
      endTime,
      leaveType,
      createdAt
    )
  }

  static reconstitute(
    id: LeaveId,
    driverId: DriverId,
    declaredStartTime: Date,
    declaredEndTime: Date,
    createdAt: Date,
    leaveType?: string
  ): LeaveEvent {
    // Assumes DB integrity
    return new LeaveEvent(
      id,
      driverId,
      declaredStartTime,
      declaredEndTime,
      leaveType,
      createdAt
    )
  }
}
