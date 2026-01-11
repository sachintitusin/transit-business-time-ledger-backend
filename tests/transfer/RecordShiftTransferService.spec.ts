import { describe, it, expect } from 'vitest'

import { RecordShiftTransferService } from '../../src/application/services/transfer/RecordShiftTransferService'
import { InMemoryShiftTransferRepository } from '../fakes/InMemoryShiftTransferRepository'
import { DomainError } from '../../src/domain/shared/DomainError'
import { DriverId, WorkPeriodId } from '../../src/domain/shared/types'

describe('RecordShiftTransferService', () => {
  const now = new Date('2026-01-15T12:00:00Z')

  it('records a shift transfer successfully', async () => {
    const repo = new InMemoryShiftTransferRepository()
    const service = new RecordShiftTransferService(repo)

    await service.execute(
      'transfer-1',
      'wp-1' as WorkPeriodId,
      'driver-2' as DriverId,
      'driver-1' as DriverId,
      now,
      'Swap requested'
    )

    const events = await repo.findByWorkPeriodId(
      'wp-1' as WorkPeriodId
    )

    expect(events.length).toBe(1)
    expect(events[0].toDriverId).toBe('driver-2')
    expect(events[0].fromDriverId).toBe('driver-1')
    expect(events[0].reason).toBe('Swap requested')
  })

  it('records an accepted shift when fromDriverId is null', async () => {
    const repo = new InMemoryShiftTransferRepository()
    const service = new RecordShiftTransferService(repo)

    await service.execute(
      'transfer-2',
      'wp-2' as WorkPeriodId,
      'driver-3' as DriverId,
      null,
      now
    )

    const events = await repo.findByWorkPeriodId(
      'wp-2' as WorkPeriodId
    )

    expect(events.length).toBe(1)
    expect(events[0].fromDriverId).toBeNull()
    expect(events[0].isAcceptedShift()).toBe(false)
  })

  it('throws when transferring to the same driver', async () => {
    const repo = new InMemoryShiftTransferRepository()
    const service = new RecordShiftTransferService(repo)

    await expect(() =>
      service.execute(
        'transfer-3',
        'wp-3' as WorkPeriodId,
        'driver-1' as DriverId,
        'driver-1' as DriverId,
        now
      )
    ).rejects.toBeInstanceOf(DomainError)
  })

  it('appends multiple transfer events', async () => {
    const repo = new InMemoryShiftTransferRepository()
    const service = new RecordShiftTransferService(repo)

    await service.execute(
      'transfer-4',
      'wp-4' as WorkPeriodId,
      'driver-2' as DriverId,
      'driver-1' as DriverId,
      now
    )

    await service.execute(
      'transfer-5',
      'wp-4' as WorkPeriodId,
      'driver-3' as DriverId,
      'driver-2' as DriverId,
      now
    )

    const events = await repo.findByWorkPeriodId(
      'wp-4' as WorkPeriodId
    )

    expect(events.length).toBe(2)
  })
})
