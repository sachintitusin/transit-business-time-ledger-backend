import { describe, it, expect } from 'vitest'

import { ShiftTransferEvent } from '../../src/domain/transfer/ShiftTransferEvent'
import { DomainError } from '../../src/domain/shared/DomainError'
import { DriverId, WorkPeriodId } from '../../src/domain/shared/types'

describe('ShiftTransferEvent (domain)', () => {
  const now = new Date('2026-01-15T10:00:00Z')

  it('creates a transfer from one driver to another', () => {
    const event = ShiftTransferEvent.create(
      'transfer-1',
      'wp-1' as WorkPeriodId,
      'driver-2' as DriverId,
      'driver-1' as DriverId,
      now,
      'Driver requested swap'
    )

    expect(event.workPeriodId).toBe('wp-1')
    expect(event.toDriverId).toBe('driver-2')
    expect(event.fromDriverId).toBe('driver-1')
    expect(event.reason).toBe('Driver requested swap')
    expect(event.createdAt).toEqual(now)
  })

  it('creates an accepted shift when fromDriverId is null', () => {
    const event = ShiftTransferEvent.create(
      'transfer-2',
      'wp-2' as WorkPeriodId,
      'driver-3' as DriverId,
      null,
      now
    )

    expect(event.fromDriverId).toBeNull()
    expect(event.isAcceptedShift()).toBe(false)
  })

  it('identifies accepted shifts correctly', () => {
    const event = ShiftTransferEvent.create(
      'transfer-3',
      'wp-3' as WorkPeriodId,
      'driver-4' as DriverId,
      'driver-2' as DriverId,
      now
    )

    expect(event.isAcceptedShift()).toBe(true)
  })

  it('throws if target driver is missing', () => {
    expect(() =>
      ShiftTransferEvent.create(
        'transfer-4',
        'wp-4' as WorkPeriodId,
        null as any,
        'driver-1' as DriverId,
        now
      )
    ).toThrow(DomainError)
  })

  it('throws if createdAt is not a valid date', () => {
    expect(() =>
      ShiftTransferEvent.create(
        'transfer-5',
        'wp-5' as WorkPeriodId,
        'driver-2' as DriverId,
        'driver-1' as DriverId,
        new Date('invalid-date')
      )
    ).toThrow(DomainError)
  })

  it('reconstitutes an event without validation', () => {
    const event = ShiftTransferEvent.reconstitute(
      'transfer-6',
      'wp-6' as WorkPeriodId,
      'driver-5' as DriverId,
      null,
      now,
      'Imported from persistence'
    )

    expect(event.id).toBe('transfer-6')
    expect(event.reason).toBe('Imported from persistence')
  })
})
