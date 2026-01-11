import { WorkCorrection } from '../../domain/work/WorkCorrection'
import { WorkPeriodId } from '../../domain/shared/types'

export interface WorkCorrectionRepository {
  findByWorkPeriodId(
    workPeriodId: WorkPeriodId
  ): Promise<WorkCorrection[]>

  save(correction: WorkCorrection): Promise<void>
}
