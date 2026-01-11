import { WorkPeriodRepository } from '../../src/application/ports/WorkPeriodRepository'
import { WorkPeriod } from '../../src/domain/work/WorkPeriod'
import { DriverId, WorkPeriodId } from '../../src/domain/shared/types'

export class InMemoryWorkPeriodRepository implements WorkPeriodRepository {
  private store = new Map<WorkPeriodId, WorkPeriod>()

  async findOpenByDriver(driverId: DriverId): Promise<WorkPeriod | null> {
    for (const wp of this.store.values()) {
      if (wp.driverId === driverId && wp.isOpen()) {
        return wp
      }
    }
    return null
  }

  async findById(id: WorkPeriodId): Promise<WorkPeriod | null> {
    return this.store.get(id) ?? null
  }

  async save(workPeriod: WorkPeriod): Promise<void> {
    this.store.set(workPeriod.id, workPeriod)
  }
}
