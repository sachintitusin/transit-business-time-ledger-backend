// application/projections/EntryType.ts
export const EntryType = {
    WORK: 'WORK',
    LEAVE: 'LEAVE',
} as const

export type EntryType =
    typeof EntryType[keyof typeof EntryType]
