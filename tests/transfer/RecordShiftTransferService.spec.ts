import { describe, it, expect } from 'vitest'

import { RecordShiftTransferService } from '../../src/application/services/transfer/RecordShiftTransferService'
import { InMemoryShiftTransferRepository } from '../fakes/InMemoryShiftTransferRepository'
import { DomainError } from '../../src/domain/shared/DomainError'
import { DriverId, WorkPeriodId } from '../../src/domain/shared/types'
import { FakeTransactionManager } from '../fakes/FakeTransactionManager'

describe('RecordShiftTransferService', () => {
  const now = new Date('2026-01-15T12:00:00Z')

  it('records a shift transfer successfully', async () => {
    const repo = new InMemoryShiftTransferRepository()
    const service = new RecordShiftTransferService(repo, new FakeTransactionManager())

    await service.execute({
      transferId: 'transfer-1',
      workPeriodId: 'wp-1' as WorkPeriodId,
      toDriverId: 'driver-2' as DriverId,
      fromDriverId: 'driver-1' as DriverId,
      createdAt: now,
      reason: 'Swap requested',
    });

    const events = await repo.findByWorkPeriodId('wp-1' as WorkPeriodId)

    expect(events.length).toBe(1)
    expect(events[0].toDriverId).toBe('driver-2')
    expect(events[0].fromDriverId).toBe('driver-1')
    expect(events[0].reason).toBe('Swap requested')
  })

  it('throws when transferring to the same driver', async () => {
    const repo = new InMemoryShiftTransferRepository()
    const service = new RecordShiftTransferService(repo, new FakeTransactionManager())

    await expect(
      service.execute({
        transferId: 'transfer-2',
        workPeriodId: 'wp-2' as WorkPeriodId,
        toDriverId: 'driver-1' as DriverId,
        fromDriverId: 'driver-1' as DriverId,
        createdAt: now,
      })
    ).rejects.toBeInstanceOf(DomainError);
  })

  it('appends multiple transfer events', async () => {
    const repo = new InMemoryShiftTransferRepository()
    const service = new RecordShiftTransferService(repo, new FakeTransactionManager())

    await service.execute({
      transferId: 'transfer-3',
      workPeriodId: 'wp-3' as WorkPeriodId,
      toDriverId: 'driver-2' as DriverId,
      fromDriverId: 'driver-1' as DriverId,
      createdAt: now,
    });

    await service.execute({
      transferId: 'transfer-4',
      workPeriodId: 'wp-3' as WorkPeriodId,
      toDriverId: 'driver-3' as DriverId,
      fromDriverId: 'driver-2' as DriverId,
      createdAt: now,
    });

    const events = await repo.findByWorkPeriodId('wp-3' as WorkPeriodId)

    expect(events.length).toBe(2)
  })

  it('throws when origin driver is missing', async () => {
    const repo = new InMemoryShiftTransferRepository()
    const service = new RecordShiftTransferService(repo, new FakeTransactionManager())

    await expect(
      service.execute({
        transferId: 'transfer-5',
        workPeriodId: 'wp-5' as WorkPeriodId,
        toDriverId: 'driver-2' as DriverId,
        fromDriverId: null as any, // ❌ Required
        createdAt: now,
      })
    ).rejects.toThrow('Origin driver must be specified');
  })
})
