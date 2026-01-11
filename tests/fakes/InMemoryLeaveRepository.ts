import { LeaveRepository } from '../../src/application/ports/LeaveRepository'
import { LeaveEvent } from '../../src/domain/leave/LeaveEvent'
import { DriverId, LeaveId } from '../../src/domain/shared/types'

export class InMemoryLeaveRepository implements LeaveRepository {
  private store = new Map<LeaveId, LeaveEvent>()

  async findByDriver(driverId: DriverId): Promise<LeaveEvent[]> {
    return [...this.store.values()].filter(l => l.driverId === driverId)
  }

  async findById(leaveId: LeaveId): Promise<LeaveEvent | null> {
    return this.store.get(leaveId) ?? null
  }

  async save(leave: LeaveEvent): Promise<void> {
    this.store.set(leave.id, leave)
  }
}
