import { describe, it, expect } from 'vitest'

import { WorkSummary } from '../../src/domain/analytics/WorkSummary'
import { TimeRange } from '../../src/domain/shared/TimeRange'
import { WorkCorrection } from '../../src/domain/work/WorkCorrection'
import { WorkPeriod } from '../../src/domain/work/WorkPeriod'
import { WorkPeriodId } from '../../src/domain/shared/types'

describe('WorkSummary', () => {
  const now = new Date('2026-01-10T05:00:00Z')

  it('counts work fully inside the range', () => {
    const work = WorkPeriod.start(
      'wp-1' as WorkPeriodId,
      'driver-1' as any,
      new Date('2026-01-10T08:00:00Z'),
      now
    )

    work.close(new Date('2026-01-10T16:00:00Z'))

    const range = TimeRange.create(
      new Date('2026-01-10T00:00:00Z'),
      new Date('2026-01-11T00:00:00Z')
    )

    const result = WorkSummary.calculate(
      range,
      [work],
      new Map<WorkPeriodId, WorkCorrection[]>()
    )

    expect(result.totalHours).toBe(8)
  })

  it('counts only the overlapping portion of work', () => {
    const work = WorkPeriod.start(
      'wp-2' as WorkPeriodId,
      'driver-1' as any,
      new Date('2026-01-10T06:00:00Z'),
      now
    )

    work.close(new Date('2026-01-10T14:00:00Z'))

    const range = TimeRange.create(
      new Date('2026-01-10T10:00:00Z'),
      new Date('2026-01-10T18:00:00Z')
    )

    const result = WorkSummary.calculate(
      range,
      [work],
      new Map<WorkPeriodId, WorkCorrection[]>()
    )

    expect(result.totalHours).toBe(4)
  })

  it('uses corrected work time when corrections exist', () => {
    const work = WorkPeriod.start(
      'wp-3' as WorkPeriodId,
      'driver-1' as any,
      new Date('2026-01-10T08:00:00Z'),
      now
    )

    work.close(new Date('2026-01-10T16:00:00Z'))

    const correction = WorkCorrection.create(
      'wc-1' as any,
      work, // ✅ aggregate, not ID
      new Date('2026-01-10T09:00:00Z'),
      new Date('2026-01-10T15:00:00Z'),
      now
    )

    const range = TimeRange.create(
      new Date('2026-01-10T00:00:00Z'),
      new Date('2026-01-11T00:00:00Z')
    )

    const corrections = new Map<WorkPeriodId, WorkCorrection[]>()
    corrections.set(work.id, [correction])

    const result = WorkSummary.calculate(
      range,
      [work],
      corrections
    )

    expect(result.totalHours).toBe(6)
  })

  it('ignores open work periods', () => {
    const work = WorkPeriod.start(
      'wp-4' as WorkPeriodId,
      'driver-1' as any,
      new Date('2026-01-10T08:00:00Z'),
      now
    )

    const range = TimeRange.create(
      new Date('2026-01-10T00:00:00Z'),
      new Date('2026-01-11T00:00:00Z')
    )

    const result = WorkSummary.calculate(
      range,
      [work],
      new Map<WorkPeriodId, WorkCorrection[]>()
    )

    expect(result.totalHours).toBe(0)
  })
})
