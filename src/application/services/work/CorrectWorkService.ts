import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { WorkCorrectionRepository } from '../../ports/WorkCorrectionRepository'
import { LeaveRepository } from '../../ports/LeaveRepository'
import { LeaveCorrectionRepository } from '../../ports/LeaveCorrectionRepository'
import { WorkCorrection } from '../../../domain/work/WorkCorrection'
import { EffectiveWorkTime } from '../../../domain/work/EffectiveWorkTime'
import { EffectiveLeaveTime } from '../../../domain/leave/EffectiveLeaveTime'
import { WorkLeaveOverlapPolicy } from '../../policies/WorkLeaveOverlapPolicy'
import { DomainError } from '../../../domain/shared/DomainError'
import {
  DriverId,
  WorkCorrectionId,
  WorkPeriodId,
} from '../../../domain/shared/types'

export class CorrectWorkService {
  constructor(
    private readonly workPeriodRepository: WorkPeriodRepository,
    private readonly workCorrectionRepository: WorkCorrectionRepository,
    private readonly leaveRepository: LeaveRepository,
    private readonly leaveCorrectionRepository: LeaveCorrectionRepository
  ) {}

  async execute(
    driverId: DriverId,
    workPeriodId: WorkPeriodId,
    correctionId: WorkCorrectionId,
    correctedStartTime: Date,
    correctedEndTime: Date,
    now: Date,
    reason?: string
  ): Promise<void> {
    // 1. Load work period
    const workPeriod =
      await this.workPeriodRepository.findById(workPeriodId)

    if (!workPeriod || workPeriod.driverId !== driverId) {
      throw new DomainError(
        'WORK_PERIOD_NOT_FOUND',
        'Work period not found for driver'
      )
    }

    // 2. Create correction (domain validation)
    const correction = WorkCorrection.create(
      correctionId,
      workPeriod,
      correctedStartTime,
      correctedEndTime,
      now,
      reason
    )

    // 3. Load existing corrections
    const existingCorrections =
      await this.workCorrectionRepository.findByWorkPeriodId(
        workPeriod.id
      )

    const allCorrections = [...existingCorrections, correction]

    // 4. Compute effective work
    const effectiveWork =
      EffectiveWorkTime.from(workPeriod, allCorrections)

    // 5. Load leave data
    const leaves = await this.leaveRepository.findByDriver(driverId)
    const leaveIds = leaves.map(l => l.id)

    const leaveCorrections =
      await this.leaveCorrectionRepository.findByLeaveIds(leaveIds)

    const effectiveLeaves = leaves.map(leave =>
      EffectiveLeaveTime.from(
        leave,
        leaveCorrections.filter(c => c.leaveId === leave.id)
      )
    )

    // 6. Apply cross-domain policy
    WorkLeaveOverlapPolicy.assertNoOverlap(
      effectiveWork,
      effectiveLeaves
    )

    // 7. Persist correction
    await this.workCorrectionRepository.save(correction)
  }
}
