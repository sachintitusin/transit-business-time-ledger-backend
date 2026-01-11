import { TimeRange } from '../shared/TimeRange'
import { WorkPeriod } from './WorkPeriod'
import { WorkPeriodStatus } from './WorkPeriodStatus'
import { InvalidCorrectedTime, WorkPeriodNotClosed } from './WorkCorrectionErrors'
import { WorkCorrectionId, WorkPeriodId } from '../shared/types'

export class WorkCorrection {
  readonly id: WorkCorrectionId
  readonly workPeriodId: WorkPeriodId
  readonly correctedStartTime: Date
  readonly correctedEndTime: Date
  readonly reason?: string
  readonly createdAt: Date

  private constructor(
    id: WorkCorrectionId,
    workPeriodId: WorkPeriodId,
    correctedStartTime: Date,
    correctedEndTime: Date,
    reason: string | undefined,
    createdAt: Date
  ) {
    this.id = id
    this.workPeriodId = workPeriodId
    this.correctedStartTime = correctedStartTime
    this.correctedEndTime = correctedEndTime
    this.reason = reason
    this.createdAt = createdAt
  }

  static create(
    id: WorkCorrectionId,
    workPeriod: WorkPeriod,
    correctedStartTime: Date,
    correctedEndTime: Date,
    createdAt: Date,
    reason?: string
  ): WorkCorrection {
    if (workPeriod.status !== WorkPeriodStatus.CLOSED) {
      throw WorkPeriodNotClosed()
    }

    if (correctedEndTime <= correctedStartTime) {
      throw InvalidCorrectedTime(correctedStartTime, correctedEndTime)
    }

    // Defensive validation
    TimeRange.create(correctedStartTime, correctedEndTime)

    return new WorkCorrection(
      id,
      workPeriod.id, // already WorkPeriodId
      correctedStartTime,
      correctedEndTime,
      reason,
      createdAt
    )
  }
}
