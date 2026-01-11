import { WorkCorrectionRepository } from '../../src/application/ports/WorkCorrectionRepository'
import { WorkCorrection } from '../../src/domain/work/WorkCorrection'
import { WorkPeriodId } from '../../src/domain/shared/types'

export class InMemoryWorkCorrectionRepository implements WorkCorrectionRepository {
  private store = new Map<WorkPeriodId, WorkCorrection[]>()

  async findByWorkPeriodId(workPeriodId: WorkPeriodId): Promise<WorkCorrection[]> {
    return this.store.get(workPeriodId) ?? []
  }

  async save(correction: WorkCorrection): Promise<void> {
    const list = this.store.get(correction.workPeriodId) ?? []
    list.push(correction)
    this.store.set(correction.workPeriodId, list)
  }
}
