import { LeaveCorrection } from '../../domain/leave/LeaveCorrection'
import { LeaveId } from '../../domain/shared/types'

export interface LeaveCorrectionRepository {
    findByLeaveIds(leaveIds: LeaveId[]): Promise<LeaveCorrection[]>
    save(correction: LeaveCorrection): Promise<void>
    findByLeaveId(leaveId: LeaveId): Promise<LeaveCorrection[]>
}
