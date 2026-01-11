import { DomainError } from '../shared/DomainError'

export const InvalidLeaveTime = (start: Date, end: Date) =>
  new DomainError(
    'INVALID_LEAVE_TIME',
    'Leave end time must be after start time',
    { start, end }
  )

export const LeaveNotCorrectable = () =>
  new DomainError(
    'LEAVE_NOT_CORRECTABLE',
    'Leave event cannot be corrected'
  )
