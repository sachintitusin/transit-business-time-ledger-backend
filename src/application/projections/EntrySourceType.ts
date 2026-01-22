// application/projections/EntrySourceType.ts
export const EntrySourceType = {
    WORK_PERIOD: 'work_period',
    LEAVE_EVENT: 'leave_event',
} as const

export type EntrySourceType =
    typeof EntrySourceType[keyof typeof EntrySourceType]
