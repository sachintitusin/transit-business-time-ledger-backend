import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { LeaveRepository } from '../../ports/LeaveRepository'
import { LeaveCorrectionRepository } from '../../ports/LeaveCorrectionRepository'
import { EffectiveWorkTime } from '../../../domain/work/EffectiveWorkTime'
import { EffectiveLeaveTime } from '../../../domain/leave/EffectiveLeaveTime'
import { WorkLeaveOverlapPolicy } from '../../policies/WorkLeaveOverlapPolicy'
import { NoActiveWorkPeriod } from '../../../domain/work/WorkPeriodErrors'
import { DriverId } from '../../../domain/shared/types'

export class CloseWorkService {
  constructor(
    private readonly workPeriodRepository: WorkPeriodRepository,
    private readonly leaveRepository: LeaveRepository,
    private readonly leaveCorrectionRepository: LeaveCorrectionRepository
  ) {}

  async execute(
    driverId: DriverId,
    endTime: Date
  ): Promise<void> {
    // 1. Load active work
    const workPeriod =
      await this.workPeriodRepository.findOpenByDriver(driverId)

    if (!workPeriod) {
      throw NoActiveWorkPeriod()
    }

    // 2. Close work (domain validation)
    workPeriod.close(endTime)

    // 3. Load leave data
    const leaves = await this.leaveRepository.findByDriver(driverId)
    const leaveIds = leaves.map(l => l.id)
    const leaveCorrections =
      await this.leaveCorrectionRepository.findByLeaveIds(leaveIds)

    // 4. Compute effective times
    const effectiveWork =
      EffectiveWorkTime.from(workPeriod, [])

    const effectiveLeaves = leaves.map(leave =>
      EffectiveLeaveTime.from(
        leave,
        leaveCorrections.filter(c => c.leaveId === leave.id)
      )
    )

    // 5. Apply cross-domain policy
    WorkLeaveOverlapPolicy.assertNoOverlap(
      effectiveWork,
      effectiveLeaves
    )

    // 6. Persist
    await this.workPeriodRepository.save(workPeriod)
  }
}
