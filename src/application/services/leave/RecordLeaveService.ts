import { LeaveRepository } from '../../ports/LeaveRepository'
import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { EffectiveLeaveTime } from '../../../domain/leave/EffectiveLeaveTime'
import { EffectiveWorkTime } from '../../../domain/work/EffectiveWorkTime'
import { LeaveEvent } from '../../../domain/leave/LeaveEvent'
import { WorkLeaveOverlapPolicy } from '../../policies/WorkLeaveOverlapPolicy'
import {
  DriverId,
  LeaveId,
} from '../../../domain/shared/types'

export class RecordLeaveService {
  constructor(
    private readonly leaveRepository: LeaveRepository,
    private readonly workPeriodRepository: WorkPeriodRepository
  ) {}

  async execute(
    driverId: DriverId,
    leaveId: LeaveId,
    startTime: Date,
    endTime: Date,
    now: Date,
    reason?: string
  ): Promise<void> {
    // 1. Create leave (domain validation)
    const leave = LeaveEvent.create(
      leaveId,
      driverId,
      startTime,
      endTime,
      now,
      reason
    )

    // 2. Compute effective leave
    const effectiveLeave =
      EffectiveLeaveTime.from(leave, [])

    // 3. Load active work (if any)
    const openWork =
      await this.workPeriodRepository.findOpenByDriver(driverId)

    if (openWork) {
      const effectiveWork =
        EffectiveWorkTime.from(openWork, [])

      // 4. Apply cross-domain policy
      WorkLeaveOverlapPolicy.assertNoOverlap(
        effectiveWork,
        [effectiveLeave]
      )
    }

    // 5. Persist leave
    await this.leaveRepository.save(leave)
  }
}
