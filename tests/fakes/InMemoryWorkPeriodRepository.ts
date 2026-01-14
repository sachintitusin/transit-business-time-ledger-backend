import { WorkPeriodRepository } from '../../src/application/ports/WorkPeriodRepository'
import { WorkPeriod } from '../../src/domain/work/WorkPeriod'
import { DriverId, WorkPeriodId } from '../../src/domain/shared/types'
import { TimeRange } from '../../src/domain/shared/TimeRange'

export class InMemoryWorkPeriodRepository
  implements WorkPeriodRepository
{
  private store = new Map<WorkPeriodId, WorkPeriod>()

  async findOpenByDriver(
    driverId: DriverId
  ): Promise<WorkPeriod | null> {
    for (const wp of this.store.values()) {
      if (wp.driverId === driverId && wp.isOpen()) {
        return wp
      }
    }
    return null
  }

  async findClosedByDriver(
    driverId: DriverId
  ): Promise<WorkPeriod[]> {
    const result: WorkPeriod[] = []

    for (const wp of this.store.values()) {
      if (wp.driverId === driverId && wp.isClosed()) {
        result.push(wp)
      }
    }

    return result
  }

  // ✅ Required by repository interface
  async findByDriver(
    driverId: DriverId
  ): Promise<WorkPeriod[]> {
    const result: WorkPeriod[] = []

    for (const wp of this.store.values()) {
      if (wp.driverId === driverId) {
        result.push(wp)
      }
    }

    return result
  }

  async findById(
    id: WorkPeriodId
  ): Promise<WorkPeriod | null> {
    return this.store.get(id) ?? null
  }

  /**
   * I26 — No overlapping effective work periods (in-memory)
   */
  async findEffectiveOverlapping(
    driverId: DriverId,
    range: TimeRange,
    excludeWorkId?: WorkPeriodId
  ): Promise<WorkPeriod[]> {
    const result: WorkPeriod[] = []

    for (const wp of this.store.values()) {
      if (wp.driverId !== driverId) continue
      if (!wp.isClosed()) continue
      if (excludeWorkId && wp.id === excludeWorkId) continue

      const declaredStart = wp.declaredStartTime
      const declaredEnd = wp.declaredEndTime

      // Defensive — CLOSED invariant breach should not happen
      if (!declaredStart || !declaredEnd) continue

      // In-memory repo does NOT know corrections.
      // Effective time === declared time (corrections tested elsewhere).
      const effectiveRange = TimeRange.create(
        declaredStart,
        declaredEnd
      )

      if (range.overlaps(effectiveRange)) {
        result.push(wp)
      }
    }

    return result
  }

  async save(workPeriod: WorkPeriod): Promise<void> {
    this.store.set(workPeriod.id, workPeriod)
  }
}
