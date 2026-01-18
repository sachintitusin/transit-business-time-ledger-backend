import { describe, it, expect } from 'vitest'

import { RecordShiftTransferService } from '../../src/application/services/transfer/RecordShiftTransferService'

import { InMemoryShiftTransferRepository } from '../fakes/InMemoryShiftTransferRepository'
import { InMemoryWorkPeriodRepository } from '../fakes/InMemoryWorkPeriodRepository'
import { FakeTransactionManager } from '../fakes/FakeTransactionManager'
import { FakeLogger } from '../fakes/FakeLogger'

import { DomainError } from '../../src/domain/shared/DomainError'
import { asDriverId, asWorkPeriodId, asShiftTransferId } from '../../src/domain/shared/types'
import { WorkPeriod } from '../../src/domain/work/WorkPeriod'

describe('RecordShiftTransferService', () => {
  const now = new Date('2026-01-15T12:00:00Z')

  it('records a shift transfer successfully', async () => {
    const shiftRepo = new InMemoryShiftTransferRepository()
    const workRepo = new InMemoryWorkPeriodRepository()
    const tx = new FakeTransactionManager()
    const logger = new FakeLogger()

    const service =
      new RecordShiftTransferService(
        shiftRepo,
        workRepo,
        tx,
        logger
      )

    const wpId = asWorkPeriodId('wp-1')
    const driver1 = asDriverId('driver-1')
    const driver2 = asDriverId('driver-2')
    const transferId = asShiftTransferId('transfer-1')

    const wp =
      WorkPeriod.start(
        wpId,
        driver1,
        new Date('2026-01-15T08:00:00Z'),
        now
      )

    wp.close(new Date('2026-01-15T10:00:00Z'))
    await workRepo.save(wp)

    await service.execute({
      transferId,
      workPeriodId: wpId,
      toDriverId: driver2,
      fromDriverId: driver1,
      createdAt: now,
      reason: 'Swap requested',
    })

    const events = await shiftRepo.findByWorkPeriodId(wpId)
    expect(events.length).toBe(1)
    expect(events[0].toDriverId).toBe('driver-2')
    expect(events[0].fromDriverId).toBe('driver-1')
    expect(events[0].reason).toBe('Swap requested')
  })

  it('throws when transferring to the same driver', async () => {
    const shiftRepo = new InMemoryShiftTransferRepository()
    const workRepo = new InMemoryWorkPeriodRepository()
    const tx = new FakeTransactionManager()
    const logger = new FakeLogger()

    const service =
      new RecordShiftTransferService(
        shiftRepo,
        workRepo,
        tx,
        logger
      )

    const wpId = asWorkPeriodId('wp-2')
    const driverId = asDriverId('driver-1')
    const transferId = asShiftTransferId('transfer-2')

    const wp =
      WorkPeriod.start(
        wpId,
        driverId,
        new Date('2026-01-15T08:00:00Z'),
        now
      )

    wp.close(new Date('2026-01-15T10:00:00Z'))
    await workRepo.save(wp)

    await expect(
      service.execute({
        transferId,
        workPeriodId: wpId,
        toDriverId: driverId,
        fromDriverId: driverId,
        createdAt: now,
      })
    ).rejects.toBeInstanceOf(DomainError)
  })

  it('appends multiple transfer events', async () => {
    const shiftRepo = new InMemoryShiftTransferRepository()
    const workRepo = new InMemoryWorkPeriodRepository()
    const tx = new FakeTransactionManager()
    const logger = new FakeLogger()

    const service =
      new RecordShiftTransferService(
        shiftRepo,
        workRepo,
        tx,
        logger
      )

    const wpId = asWorkPeriodId('wp-3')
    const driver1 = asDriverId('driver-1')
    const driver2 = asDriverId('driver-2')
    const driver3 = asDriverId('driver-3')

    const wp =
      WorkPeriod.start(
        wpId,
        driver1,
        new Date('2026-01-15T08:00:00Z'),
        now
      )

    wp.close(new Date('2026-01-15T10:00:00Z'))
    await workRepo.save(wp)

    await service.execute({
      transferId: asShiftTransferId('transfer-3'),
      workPeriodId: wpId,
      toDriverId: driver2,
      fromDriverId: driver1,
      createdAt: now,
    })

    await service.execute({
      transferId: asShiftTransferId('transfer-4'),
      workPeriodId: wpId,
      toDriverId: driver3,
      fromDriverId: driver2,
      createdAt: now,
    })

    const events = await shiftRepo.findByWorkPeriodId(wpId)
    expect(events.length).toBe(2)
  })

  it('throws when origin driver is missing', async () => {
    const shiftRepo = new InMemoryShiftTransferRepository()
    const workRepo = new InMemoryWorkPeriodRepository()
    const tx = new FakeTransactionManager()
    const logger = new FakeLogger()

    const service =
      new RecordShiftTransferService(
        shiftRepo,
        workRepo,
        tx,
        logger
      )

    const wpId = asWorkPeriodId('wp-5')
    const driverId = asDriverId('driver-2')
    const transferId = asShiftTransferId('transfer-5')

    const wp =
      WorkPeriod.start(
        wpId,
        driverId,
        new Date('2026-01-15T08:00:00Z'),
        now
      )

    wp.close(new Date('2026-01-15T10:00:00Z'))
    await workRepo.save(wp)

    await expect(
      service.execute({
        transferId,
        workPeriodId: wpId,
        toDriverId: driverId,
        fromDriverId: null as any,
        createdAt: now,
      })
    ).rejects.toThrow('Origin driver must be specified')
  })
})
