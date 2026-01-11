import { TimeRange } from '../shared/TimeRange'
import { LeaveEvent } from './LeaveEvent'
import { LeaveCorrectionId } from '../shared/types'
import { InvalidLeaveTime } from './LeaveErrors'

export class LeaveCorrection {
  readonly id: LeaveCorrectionId
  readonly leaveId: LeaveEvent['id']
  readonly correctedStartTime: Date
  readonly correctedEndTime: Date
  readonly reason?: string
  readonly createdAt: Date

  private constructor(
    id: LeaveCorrectionId,
    leaveId: LeaveEvent['id'],
    correctedStartTime: Date,
    correctedEndTime: Date,
    reason: string | undefined,
    createdAt: Date
  ) {
    this.id = id
    this.leaveId = leaveId
    this.correctedStartTime = correctedStartTime
    this.correctedEndTime = correctedEndTime
    this.reason = reason
    this.createdAt = createdAt
  }

  static create(
    id: LeaveCorrectionId,
    leave: LeaveEvent,
    correctedStartTime: Date,
    correctedEndTime: Date,
    createdAt: Date,
    reason?: string
  ): LeaveCorrection {
    if (correctedEndTime <= correctedStartTime) {
      throw InvalidLeaveTime(correctedStartTime, correctedEndTime)
    }

    TimeRange.create(correctedStartTime, correctedEndTime)

    return new LeaveCorrection(
      id,
      leave.id,
      correctedStartTime,
      correctedEndTime,
      reason,
      createdAt
    )
  }

  static reconstitute(
    id: LeaveCorrectionId,
    leaveId: LeaveEvent['id'],
    correctedStartTime: Date,
    correctedEndTime: Date,
    createdAt: Date,
    reason?: string
  ): LeaveCorrection {
    return new LeaveCorrection(
      id,
      leaveId,
      correctedStartTime,
      correctedEndTime,
      reason,
      createdAt
    )
  }
}
