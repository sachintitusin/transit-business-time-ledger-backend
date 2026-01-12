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

  it('throws if origin driver is missing', () => {
    expect(() =>
      ShiftTransferEvent.create(
        'transfer-5',
        'wp-5' as WorkPeriodId,
        'driver-2' as DriverId,
        null as any, // ❌ Origin required
        now
      )
    ).toThrow('Origin driver must be specified')
  })

  it('throws if createdAt is not a valid date', () => {
    expect(() =>
      ShiftTransferEvent.create(
        'transfer-6',
        'wp-6' as WorkPeriodId,
        'driver-2' as DriverId,
        'driver-1' as DriverId,
        new Date('invalid-date')
      )
    ).toThrow(DomainError)
  })

  it('throws when transferring to the same driver', () => {
    expect(() =>
      ShiftTransferEvent.create(
        'transfer-7',
        'wp-7' as WorkPeriodId,
        'driver-1' as DriverId,
        'driver-1' as DriverId, // ❌ Same driver
        now
      )
    ).toThrow('Cannot transfer a shift to the same driver')
  })

  it('throws when workPeriodId is missing', () => {
    expect(() =>
      ShiftTransferEvent.create(
        'transfer-8',
        null as any,
        'driver-1' as DriverId,
        'driver-2' as DriverId,
        now
      )
    ).toThrow(DomainError)
  })

  it('reconstitutes an event without validation', () => {
    const event = ShiftTransferEvent.reconstitute(
      'transfer-9',
      'wp-9' as WorkPeriodId,
      'driver-5' as DriverId,
      'driver-4' as DriverId,
      now,
      'Imported from persistence'
    )

    expect(event.id).toBe('transfer-9')
    expect(event.fromDriverId).toBe('driver-4')
    expect(event.reason).toBe('Imported from persistence')
  })
})
