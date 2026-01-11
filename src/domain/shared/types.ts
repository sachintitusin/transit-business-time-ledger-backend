// Nominal typing to avoid mixing IDs accidentally
type Brand<K, T> = K & { __brand: T }

export type DriverId = Brand<string, 'DriverId'>
export type WorkPeriodId = Brand<string, 'WorkPeriodId'>
export type WorkCorrectionId = Brand<string, 'WorkCorrectionId'>
export type LeaveId = Brand<string, 'LeaveId'>
export type LeaveCorrectionId = Brand<string, 'LeaveCorrectionId'>
export type ShiftTransferId = Brand<string, 'ShiftTransferId'>
export type WorkNoteId = Brand<string, 'WorkNoteId'>
export type AttachmentId = Brand<string, 'AttachmentId'>
export type PlannedShiftId = Brand<string, 'PlannedShiftId'>

// Helper to cast safely at boundaries (HTTP / DB only)
export const asDriverId = (id: string) => id as DriverId
export const asWorkPeriodId = (id: string) => id as WorkPeriodId
export const asLeaveId = (id: string) => id as LeaveId
