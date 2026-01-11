import { describe, it, expect } from 'vitest'

import { AcceptedShiftCountSummary } from '../../src/domain/analytics/AcceptedShiftCountSummary'
import { ShiftTransferEvent } from '../../src/domain/transfer/ShiftTransferEvent'
import { TimeRange } from '../../src/domain/shared/TimeRange'
import { DriverId, WorkPeriodId } from '../../src/domain/shared/types'

describe('AcceptedShiftCountSummary', () => {
  const driverA = 'driver-A' as DriverId
  const driverB = 'driver-B' as DriverId
  const driverC = 'driver-C' as DriverId

  const t1 = new Date('2026-01-10T08:00:00Z')
  const t2 = new Date('2026-01-10T12:00:00Z')
  const t3 = new Date('2026-01-11T09:00:00Z')

  const events = [
    // Accepted by driverA from driverB
    ShiftTransferEvent.create(
      'tr-1',
      'wp-1' as WorkPeriodId,
      driverA,
      driverB,
      t1
    ),

    // Unassigned → driverA (NOT an accepted shift)
    ShiftTransferEvent.create(
      'tr-2',
      'wp-2' as WorkPeriodId,
      driverA,
      null,
      t2
    ),

    // Accepted by driverB from driverC
    ShiftTransferEvent.create(
      'tr-3',
      'wp-3' as WorkPeriodId,
      driverB,
      driverC,
      t2
    ),

    // Accepted by driverA, but outside range
    ShiftTransferEvent.create(
      'tr-4',
      'wp-4' as WorkPeriodId,
      driverA,
      driverC,
      t3
    ),
  ]

  it('counts accepted shifts for a driver within the range', () => {
    const range = TimeRange.create(
      new Date('2026-01-10T00:00:00Z'),
      new Date('2026-01-10T23:59:59Z')
    )

    const result =
      AcceptedShiftCountSummary.calculate(
        range,
        driverA,
        events
      )

    expect(result.acceptedShifts).toBe(1)
  })

  it('returns zero when no accepted shifts match', () => {
    const range = TimeRange.create(
      new Date('2026-01-12T00:00:00Z'),
      new Date('2026-01-13T00:00:00Z')
    )

    const result =
      AcceptedShiftCountSummary.calculate(
        range,
        driverA,
        events
      )

    expect(result.acceptedShifts).toBe(0)
  })

  it('does not count unassigned shifts as accepted', () => {
    const range = TimeRange.create(
      new Date('2026-01-10T00:00:00Z'),
      new Date('2026-01-10T23:59:59Z')
    )

    const result =
      AcceptedShiftCountSummary.calculate(
        range,
        driverA,
        events
      )

    expect(result.acceptedShifts).toBe(1)
  })

  it('counts only shifts accepted by the given driver', () => {
    const range = TimeRange.create(
      new Date('2026-01-10T00:00:00Z'),
      new Date('2026-01-11T23:59:59Z')
    )

    const result =
      AcceptedShiftCountSummary.calculate(
        range,
        driverB,
        events
      )

    expect(result.acceptedShifts).toBe(1)
  })
})
