import { DomainError } from '../shared/DomainError'

export const WorkPeriodNotClosed = () =>
  new DomainError(
    'WORK_PERIOD_NOT_CLOSED',
    'Work period must be closed before it can be corrected'
  )

export const InvalidCorrectedTime = (start: Date, end: Date) =>
  new DomainError(
    'INVALID_CORRECTED_TIME',
    'Corrected end time must be after corrected start time',
    { start, end }
  )
