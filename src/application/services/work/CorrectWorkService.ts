import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { WorkCorrectionRepository } from '../../ports/WorkCorrectionRepository'
import { LeaveRepository } from '../../ports/LeaveRepository'
import { LeaveCorrectionRepository } from '../../ports/LeaveCorrectionRepository'
import { TransactionManager } from '../../ports/TransactionManager'

import { WorkCorrection } from '../../../domain/work/WorkCorrection'
import { EffectiveWorkTime } from '../../../domain/work/EffectiveWorkTime'
import { EffectiveLeaveTime } from '../../../domain/leave/EffectiveLeaveTime'
import { WorkLeaveOverlapPolicy } from '../../policies/WorkLeaveOverlapPolicy'
import { DomainError } from '../../../domain/shared/DomainError'
import { TimeRange } from '../../../domain/shared/TimeRange' 
import {
  DriverId,
  WorkCorrectionId,
  WorkPeriodId,
} from '../../../domain/shared/types'
import { MaxShiftDurationPolicy } from '../../policies/MaxShiftDurationPolicy'

export class CorrectWorkService {
  constructor(
    private readonly workPeriodRepository: WorkPeriodRepository,
    private readonly workCorrectionRepository: WorkCorrectionRepository,
    private readonly leaveRepository: LeaveRepository,
    private readonly leaveCorrectionRepository: LeaveCorrectionRepository,
    private readonly transactionManager: TransactionManager,
    private readonly maxShiftPolicy: MaxShiftDurationPolicy = new MaxShiftDurationPolicy()
  ) {}

  async execute(command: {
    driverId: DriverId
    workPeriodId: WorkPeriodId
    correctionId: WorkCorrectionId
    correctedStartTime: Date
    correctedEndTime: Date
    now: Date
    reason?: string
  }): Promise<void> {
    await this.transactionManager.run(async () => {
      const {
        driverId,
        workPeriodId,
        correctionId,
        correctedStartTime,
        correctedEndTime,
        now,
        reason,
      } = command


      // 1. Load work period
      const workPeriod = await this.workPeriodRepository.findById(workPeriodId)
      if (!workPeriod || workPeriod.driverId !== driverId) {
        throw new DomainError(
          'WORK_PERIOD_NOT_FOUND',
          'Work period not found for driver'
        )
      }

      // ✅ NEW I26: CLOSED invariant (explicit)
      if (!workPeriod.isClosed()) {
        throw new DomainError(
          'WORK_NOT_CLOSED',
          'Work period must be closed before correction'
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
        await this.workCorrectionRepository.findByWorkPeriodId(workPeriod.id)
      const allCorrections = [...existingCorrections, correction]

      // ✅ NEW I26: Build corrected range
      const correctedRange = TimeRange.create(
        correction.correctedStartTime,
        correction.correctedEndTime
      )

      // ------------------------------------------------------------  
      // ✅ NEW I26: Intrinsic → External validation ordering
      // ------------------------------------------------------------

      // A. Max duration (intrinsic)
      this.maxShiftPolicy.validate(correctedRange)

      // B. Work-work overlap (external conflict) 
      const overlappingWorks = await this.workPeriodRepository.findEffectiveOverlapping(
        driverId,
        correctedRange,
        workPeriod.id  // Exclude self
      )

      if (overlappingWorks.length > 0) {
        throw new DomainError(
          'WORK_OVERLAPS_EXISTING_WORK',
          `Correction overlaps ${overlappingWorks.length} prior period(s)`,
          {
            overlappingWorkIds: overlappingWorks.map(w => w.id),
            correctedStart: correctedRange.start,
            correctedEnd: correctedRange.end,
          }
        )
      }

      // 4. Compute effective work (now guaranteed valid)
      const effectiveWork = EffectiveWorkTime.from(workPeriod, allCorrections)

      // 5. Load leave data (existing I16)
      const leaves = await this.leaveRepository.findByDriver(driverId)
      const leaveIds = leaves.map(l => l.id)
      const leaveCorrections = await this.leaveCorrectionRepository.findByLeaveIds(leaveIds)
      const effectiveLeaves = leaves.map(leave =>
        EffectiveLeaveTime.from(
          leave,
          leaveCorrections.filter(c => c.leaveId === leave.id)
        )
      )

      // 6. Apply cross-domain policy (existing I16)
      WorkLeaveOverlapPolicy.assertNoOverlap(effectiveWork, effectiveLeaves)

      // 7. Persist correction (existing)
      await this.workCorrectionRepository.save(correction)
    })
  }
}
