import { LeaveRepository } from '../../ports/LeaveRepository'
import { LeaveCorrectionRepository } from '../../ports/LeaveCorrectionRepository'
import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { LeaveCorrection } from '../../../domain/leave/LeaveCorrection'
import { EffectiveLeaveTime } from '../../../domain/leave/EffectiveLeaveTime'
import { EffectiveWorkTime } from '../../../domain/work/EffectiveWorkTime'
import { WorkLeaveOverlapPolicy } from '../../policies/WorkLeaveOverlapPolicy'
import {
  DriverId,
  LeaveId,
  LeaveCorrectionId,
} from '../../../domain/shared/types'

export class LeaveCorrectionService {
  constructor(
    private readonly leaveRepository: LeaveRepository,
    private readonly leaveCorrectionRepository: LeaveCorrectionRepository,
    private readonly workPeriodRepository: WorkPeriodRepository
  ) {}

  async execute(
    driverId: DriverId,
    leaveId: LeaveId,
    correctionId: LeaveCorrectionId,
    correctedStartTime: Date,
    correctedEndTime: Date,
    now: Date,
    reason?: string
  ): Promise<void> {
    // 1. Load leave
    const leave = await this.leaveRepository.findById(leaveId)

    if (!leave || leave.driverId !== driverId) {
      throw new Error('Leave not found for driver')
    }

    // 2. Create correction (domain validation)
    const correction = LeaveCorrection.create(
      correctionId,
      leave,
      correctedStartTime,
      correctedEndTime,
      now,
      reason
    )

    // 3. Load existing corrections
    const existingCorrections =
      await this.leaveCorrectionRepository.findByLeaveId(leave.id)

    const allCorrections = [...existingCorrections, correction]

    // 4. Compute effective leave
    const effectiveLeave =
      EffectiveLeaveTime.from(leave, allCorrections)

    // 5. Load active work (if any)
    const openWork =
      await this.workPeriodRepository.findOpenByDriver(driverId)

    if (openWork) {
      const effectiveWork =
        EffectiveWorkTime.from(openWork, [])

      // 6. Apply cross-domain policy
      WorkLeaveOverlapPolicy.assertNoOverlap(
        effectiveWork,
        [effectiveLeave]
      )
    }

    // 7. Persist correction
    await this.leaveCorrectionRepository.save(correction)
  }
}
