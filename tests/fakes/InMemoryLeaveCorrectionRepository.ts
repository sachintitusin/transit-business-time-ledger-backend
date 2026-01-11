import { LeaveCorrectionRepository } from '../../src/application/ports/LeaveCorrectionRepository'
import { LeaveCorrection } from '../../src/domain/leave/LeaveCorrection'
import { LeaveId } from '../../src/domain/shared/types'

export class InMemoryLeaveCorrectionRepository implements LeaveCorrectionRepository {
  private store = new Map<LeaveId, LeaveCorrection[]>()

  async findByLeaveId(leaveId: LeaveId): Promise<LeaveCorrection[]> {
    return this.store.get(leaveId) ?? []
  }

  async save(correction: LeaveCorrection): Promise<void> {
    const list = this.store.get(correction.leaveId) ?? []
    list.push(correction)
    this.store.set(correction.leaveId, list)
  }

  async findByLeaveIds(leaveIds: LeaveId[]): Promise<LeaveCorrection[]> {
    return leaveIds.flatMap(
        id => this.store.get(id) ?? []
    )
  }

}
