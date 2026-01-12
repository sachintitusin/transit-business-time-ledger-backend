import { describe, it, expect } from 'vitest'

import { ShiftTransferCountSummary } from '../../src/domain/analytics/ShiftTransferCountSummary'
import { ShiftTransferEvent } from '../../src/domain/transfer/ShiftTransferEvent'
import { TimeRange } from '../../src/domain/shared/TimeRange'
import { DriverId, WorkPeriodId } from '../../src/domain/shared/types'

describe('ShiftTransferCountSummary', () => {
  const t1 = new Date('2026-01-10T08:00:00Z')
  const t2 = new Date('2026-01-10T12:00:00Z')
  const t3 = new Date('2026-01-11T09:00:00Z')

  const events = [
    ShiftTransferEvent.create(
      'tr-1',
      'wp-1' as WorkPeriodId,
      'driver-2' as DriverId,
      'driver-1' as DriverId,
      t1
    ),
    ShiftTransferEvent.create(
      'tr-2',
      'wp-2' as WorkPeriodId,
      'driver-3' as DriverId,
      'driver-2' as DriverId, // ✅ Origin required
      t2
    ),
    ShiftTransferEvent.create(
      'tr-3',
      'wp-3' as WorkPeriodId,
      'driver-4' as DriverId,
      'driver-2' as DriverId,
      t3
    ),
  ]

  it('counts transfers inside the range', () => {
    const range = TimeRange.create(
      new Date('2026-01-10T00:00:00Z'),
      new Date('2026-01-10T23:59:59Z')
    )

    const result = ShiftTransferCountSummary.calculate(range, events)

    expect(result.totalTransfers).toBe(2)
  })

  it('returns zero when no transfers fall in range', () => {
    const range = TimeRange.create(
      new Date('2026-01-12T00:00:00Z'),
      new Date('2026-01-13T00:00:00Z')
    )

    const result = ShiftTransferCountSummary.calculate(range, events)

    expect(result.totalTransfers).toBe(0)
  })

  it('counts all transfers when range covers all events', () => {
    const range = TimeRange.create(
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-31T23:59:59Z')
    )

    const result = ShiftTransferCountSummary.calculate(range, events)

    expect(result.totalTransfers).toBe(3)
  })
})
