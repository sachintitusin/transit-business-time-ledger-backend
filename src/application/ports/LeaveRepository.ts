import { LeaveEvent } from '../../domain/leave/LeaveEvent'
import { DriverId, LeaveId } from '../../domain/shared/types'

export interface LeaveRepository {
  findByDriver(driverId: DriverId): Promise<LeaveEvent[]>
  findById(leaveId: LeaveId): Promise<LeaveEvent | null>
  save(leave: LeaveEvent): Promise<void>
}
