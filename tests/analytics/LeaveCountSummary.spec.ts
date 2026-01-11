import { describe, it, expect } from 'vitest'

import { LeaveCountSummary } from '../../src/domain/analytics/LeaveCountSummary'
import { TimeRange } from '../../src/domain/shared/TimeRange'
import { LeaveEvent } from '../../src/domain/leave/LeaveEvent'
import { LeaveCorrection } from '../../src/domain/leave/LeaveCorrection'
import { LeaveId } from '../../src/domain/shared/types'

describe('LeaveCountSummary', () => {
  const now = new Date('2026-01-01T05:00:00Z')

  it('counts leave fully inside the range', () => {
    const leave = LeaveEvent.create(
      'leave-1' as LeaveId,
      'driver-1' as any,
      new Date('2026-01-10T08:00:00Z'),
      new Date('2026-01-10T18:00:00Z'),
      now
    )

    const range = TimeRange.create(
      new Date('2026-01-10T00:00:00Z'),
      new Date('2026-01-11T00:00:00Z')
    )

    const result = LeaveCountSummary.calculate(
      range,
      [leave],
      new Map<LeaveId, LeaveCorrection[]>()
    )

    expect(result.totalLeaves).toBe(1)
  })

  it('counts leave partially overlapping the range', () => {
    const leave = LeaveEvent.create(
      'leave-2' as LeaveId,
      'driver-1' as any,
      new Date('2026-01-10T22:00:00Z'),
      new Date('2026-01-11T06:00:00Z'),
      now
    )

    const range = TimeRange.create(
      new Date('2026-01-11T00:00:00Z'),
      new Date('2026-01-12T00:00:00Z')
    )

    const result = LeaveCountSummary.calculate(
      range,
      [leave],
      new Map<LeaveId, LeaveCorrection[]>()
    )

    expect(result.totalLeaves).toBe(1)
  })

  it('uses corrected leave time when corrections exist', () => {
    const leave = LeaveEvent.create(
      'leave-3' as LeaveId,
      'driver-1' as any,
      new Date('2026-01-10T08:00:00Z'),
      new Date('2026-01-10T12:00:00Z'),
      now
    )

    const correction = LeaveCorrection.create(
      'corr-1' as any,
      leave,
      new Date('2026-01-10T10:00:00Z'),
      new Date('2026-01-10T20:00:00Z'),
      now,
      'Extended leave'
    )

    const range = TimeRange.create(
      new Date('2026-01-10T18:00:00Z'),
      new Date('2026-01-11T00:00:00Z')
    )

    const corrections = new Map<LeaveId, LeaveCorrection[]>()
    corrections.set(leave.id, [correction])

    const result = LeaveCountSummary.calculate(
      range,
      [leave],
      corrections
    )

    expect(result.totalLeaves).toBe(1)
  })

  it('does not count leave outside the range', () => {
    const leave = LeaveEvent.create(
      'leave-4' as LeaveId,
      'driver-1' as any,
      new Date('2026-01-08T08:00:00Z'),
      new Date('2026-01-08T18:00:00Z'),
      now
    )

    const range = TimeRange.create(
      new Date('2026-01-10T00:00:00Z'),
      new Date('2026-01-11T00:00:00Z')
    )

    const result = LeaveCountSummary.calculate(
      range,
      [leave],
      new Map<LeaveId, LeaveCorrection[]>()
    )

    expect(result.totalLeaves).toBe(0)
  })
})
