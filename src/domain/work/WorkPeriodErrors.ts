import { DomainError } from '../shared/DomainError'

export const ActiveWorkPeriodAlreadyExists = () =>
  new DomainError(
    'ACTIVE_WORK_PERIOD_ALREADY_EXISTS',
    'An active work period already exists'
  )

export const NoActiveWorkPeriod = () =>
  new DomainError(
    'NO_ACTIVE_WORK_PERIOD',
    'No active work period found'
  )

export const WorkPeriodAlreadyClosed = () =>
  new DomainError(
    'WORK_PERIOD_ALREADY_CLOSED',
    'Work period is already closed'
  )

export const InvalidEndTime = (start: Date, end: Date) =>
  new DomainError(
    'INVALID_END_TIME',
    'End time must be after start time',
    { start, end }
  )
