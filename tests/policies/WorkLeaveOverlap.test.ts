import { describe, it, expect } from 'vitest'

import { InMemoryWorkPeriodRepository } from '../fakes/InMemoryWorkPeriodRepository'
import { InMemoryLeaveRepository } from '../fakes/InMemoryLeaveRepository'
import { InMemoryLeaveCorrectionRepository } from '../fakes/InMemoryLeaveCorrectionRepository'
import { InMemoryWorkCorrectionRepository } from '../fakes/InMemoryWorkCorrectionRepository'
import { InMemoryEntryProjectionRepository } from '../fakes/InMemoryEntryProjectionRepository'

import { StartWorkService } from '../../src/application/services/work/StartWorkService'
import { CloseWorkService } from '../../src/application/services/work/CloseWorkService'
import { CorrectWorkService } from '../../src/application/services/work/CorrectWorkService'
import { RecordLeaveService } from '../../src/application/services/leave/RecordLeaveService'
import { LeaveCorrectionService } from '../../src/application/services/leave/LeaveCorrectionService'

import { FakeTransactionManager } from '../fakes/FakeTransactionManager'
import { FakeLogger } from '../fakes/FakeLogger'
import { MaxShiftDurationPolicy } from '../../src/application/policies/MaxShiftDurationPolicy'

import { DriverId, LeaveId, WorkPeriodId } from '../../src/domain/shared/types'

describe('Work–Leave overlap invariants', () => {

  const workId = 'work-1' as WorkPeriodId
  const now = new Date()

  it('rejects recording leave that overlaps an OPEN work period', async () => {
    const workRepo = new InMemoryWorkPeriodRepository()
    const workCorrectionRepo = new InMemoryWorkCorrectionRepository()
    const leaveRepo = new InMemoryLeaveRepository()
    const tx = new FakeTransactionManager()
    const logger = new FakeLogger()
    const entryProjectionRepo = new InMemoryEntryProjectionRepository()

    const startWork = new StartWorkService(workRepo, entryProjectionRepo, tx, logger)
    const recordLeave = new RecordLeaveService(
      leaveRepo,
      workRepo,
      workCorrectionRepo,
      entryProjectionRepo,
      tx,
      logger
    )

    const driverId = 'driver-1' as DriverId
    const leaveId = 'leave-1' as LeaveId

    await startWork.execute(
      driverId,
      workId,
      new Date('2025-01-01T09:00:00Z'),
      now
    )

    await expect(
      recordLeave.execute({
        driverId,
        leaveId,
        startTime: new Date('2025-01-01T10:00:00Z'),
        endTime: new Date('2025-01-01T11:00:00Z'),
        now,
      })
    ).rejects.toThrow()
  })

  it('rejects recording leave that overlaps CLOSED work', async () => {
    const workRepo = new InMemoryWorkPeriodRepository()
    const workCorrectionRepo = new InMemoryWorkCorrectionRepository()
    const leaveRepo = new InMemoryLeaveRepository()
    const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository()
    const tx = new FakeTransactionManager()
    const logger = new FakeLogger()
    const policy = new MaxShiftDurationPolicy()

    const entryProjectionRepo = new InMemoryEntryProjectionRepository()
    const startWork = new StartWorkService(workRepo, entryProjectionRepo, tx, logger)
    const closeWork = new CloseWorkService(
      workRepo,
      leaveRepo,
      leaveCorrectionRepo,
      entryProjectionRepo,
      tx,
      policy,
      logger
    )
    const recordLeave = new RecordLeaveService(
      leaveRepo,
      workRepo,
      workCorrectionRepo,
      entryProjectionRepo,
      tx,
      logger
    )

    const driverId = 'driver-1' as DriverId
    const leaveId = 'leave-1' as LeaveId

    await startWork.execute(
      driverId,
      workId,
      new Date('2025-01-01T09:00:00Z'),
      now
    )

    await closeWork.execute(driverId, new Date('2025-01-01T12:00:00Z'))

    await expect(
      recordLeave.execute({
        driverId,
        leaveId,
        startTime: new Date('2025-01-01T11:00:00Z'),
        endTime: new Date('2025-01-01T13:00:00Z'),
        now,
      })
    ).rejects.toThrow()
  })

  it('rejects closing work that overlaps existing leave', async () => {
    const workRepo = new InMemoryWorkPeriodRepository()
    const workCorrectionRepo = new InMemoryWorkCorrectionRepository()
    const leaveRepo = new InMemoryLeaveRepository()
    const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository()
    const tx = new FakeTransactionManager()
    const logger = new FakeLogger()
    const policy = new MaxShiftDurationPolicy()

    const entryProjectionRepo = new InMemoryEntryProjectionRepository()
    const startWork = new StartWorkService(workRepo, entryProjectionRepo, tx, logger)
    const closeWork = new CloseWorkService(
      workRepo,
      leaveRepo,
      leaveCorrectionRepo,
      entryProjectionRepo,
      tx,
      policy,
      logger
    )
    const recordLeave = new RecordLeaveService(
      leaveRepo,
      workRepo,
      workCorrectionRepo,
      entryProjectionRepo,
      tx,
      logger
    )

    const driverId = 'driver-1' as DriverId
    const leaveId = 'leave-1' as LeaveId

    await recordLeave.execute({
      driverId,
      leaveId,
      startTime: new Date('2025-01-01T12:00:00Z'),
      endTime: new Date('2025-01-01T14:00:00Z'),
      now,
    })

    await startWork.execute(
      driverId,
      workId,
      new Date('2025-01-01T09:00:00Z'),
      now
    )

    await expect(
      closeWork.execute(driverId, new Date('2025-01-01T17:00:00Z'))
    ).rejects.toThrow()
  })

  it('rejects work correction that causes overlap with leave', async () => {
    const workRepo = new InMemoryWorkPeriodRepository()
    const workCorrectionRepo = new InMemoryWorkCorrectionRepository()
    const leaveRepo = new InMemoryLeaveRepository()
    const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository()
    const tx = new FakeTransactionManager()
    const logger = new FakeLogger()
    const policy = new MaxShiftDurationPolicy()

    const entryProjectionRepo = new InMemoryEntryProjectionRepository()
    const startWork = new StartWorkService(workRepo, entryProjectionRepo, tx, logger)
    const closeWork = new CloseWorkService(
      workRepo,
      leaveRepo,
      leaveCorrectionRepo,
      entryProjectionRepo,
      tx,
      policy,
      logger
    )
    const correctWork = new CorrectWorkService(
      workRepo,
      workCorrectionRepo,
      leaveRepo,
      leaveCorrectionRepo,
      entryProjectionRepo,
      tx,
      policy,
      logger
    )
    const recordLeave = new RecordLeaveService(
      leaveRepo,
      workRepo,
      workCorrectionRepo,
      entryProjectionRepo,
      tx,
      logger
    )

    const driverId = 'driver-1' as DriverId
    const correctionId = 'corr-1' as any
    const leaveId = 'leave-1' as LeaveId

    await startWork.execute(
      driverId,
      workId,
      new Date('2025-01-01T09:00:00Z'),
      now
    )

    await closeWork.execute(driverId, new Date('2025-01-01T12:00:00Z'))

    await recordLeave.execute({
      driverId,
      leaveId,
      startTime: new Date('2025-01-01T13:00:00Z'),
      endTime: new Date('2025-01-01T14:00:00Z'),
      now,
    })

    await expect(
      correctWork.execute({
        driverId,
        workPeriodId: workId,
        correctionId,
        correctedStartTime: new Date('2025-01-01T10:00:00Z'),
        correctedEndTime: new Date('2025-01-01T15:00:00Z'),
        now,
      })
    ).rejects.toThrow()
  })

  it('rejects leave correction that overlaps work time', async () => {
    const workRepo = new InMemoryWorkPeriodRepository()
    const workCorrectionRepo = new InMemoryWorkCorrectionRepository()
    const leaveRepo = new InMemoryLeaveRepository()
    const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository()
    const tx = new FakeTransactionManager()
    const logger = new FakeLogger()
    const policy = new MaxShiftDurationPolicy()

    const entryProjectionRepo = new InMemoryEntryProjectionRepository()
    const startWork = new StartWorkService(workRepo, entryProjectionRepo, tx, logger)
    const closeWork = new CloseWorkService(
      workRepo,
      leaveRepo,
      leaveCorrectionRepo,
      entryProjectionRepo,
      tx,
      policy,
      logger
    )
    const recordLeave = new RecordLeaveService(
      leaveRepo,
      workRepo,
      workCorrectionRepo,
      entryProjectionRepo,
      tx,
      logger
    )
    const correctLeave = new LeaveCorrectionService(
      leaveRepo,
      leaveCorrectionRepo,
      workRepo,
      entryProjectionRepo,
      tx,
      logger
    )

    const driverId = 'driver-1' as DriverId
    const leaveId = 'leave-1' as LeaveId
    const correctionId = 'leave-corr-1' as any

    await startWork.execute(
      driverId,
      workId,
      new Date('2025-01-01T09:00:00Z'),
      now
    )

    await closeWork.execute(driverId, new Date('2025-01-01T12:00:00Z'))

    await recordLeave.execute({
      driverId,
      leaveId,
      startTime: new Date('2025-01-01T13:00:00Z'),
      endTime: new Date('2025-01-01T14:00:00Z'),
      now,
    })

    await expect(
      correctLeave.execute({
        driverId,
        leaveId,
        correctionId,
        correctedStartTime: new Date('2025-01-01T10:30:00Z'),
        correctedEndTime: new Date('2025-01-01T13:30:00Z'),
        now,
      })
    ).rejects.toThrow()
  })

  it('allows leave that starts exactly when work ends', async () => {
    const workRepo = new InMemoryWorkPeriodRepository()
    const workCorrectionRepo = new InMemoryWorkCorrectionRepository()
    const leaveRepo = new InMemoryLeaveRepository()
    const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository()
    const tx = new FakeTransactionManager()
    const logger = new FakeLogger()
    const policy = new MaxShiftDurationPolicy()

    const entryProjectionRepo = new InMemoryEntryProjectionRepository()
    const startWork = new StartWorkService(workRepo, entryProjectionRepo, tx, logger)
    const closeWork = new CloseWorkService(
      workRepo,
      leaveRepo,
      leaveCorrectionRepo,
      entryProjectionRepo,
      tx,
      policy,
      logger
    )
    const recordLeave = new RecordLeaveService(
      leaveRepo,
      workRepo,
      workCorrectionRepo,
      entryProjectionRepo,
      tx,
      logger
    )

    const driverId = 'driver-1' as DriverId
    const leaveId = 'leave-1' as LeaveId

    await startWork.execute(
      driverId,
      workId,
      new Date('2025-01-01T09:00:00Z'),
      now
    )

    await closeWork.execute(driverId, new Date('2025-01-01T12:00:00Z'))

    await recordLeave.execute({
      driverId,
      leaveId,
      startTime: new Date('2025-01-01T12:00:00Z'),
      endTime: new Date('2025-01-01T13:00:00Z'),
      now,
    })
  })

  it('allows leave that ends exactly when work starts', async () => {
    const workRepo = new InMemoryWorkPeriodRepository()
    const workCorrectionRepo = new InMemoryWorkCorrectionRepository()
    const leaveRepo = new InMemoryLeaveRepository()
    const tx = new FakeTransactionManager()
    const logger = new FakeLogger()

    const entryProjectionRepo = new InMemoryEntryProjectionRepository()
    const startWork = new StartWorkService(workRepo, entryProjectionRepo, tx, logger)
    const recordLeave = new RecordLeaveService(
      leaveRepo,
      workRepo,
      workCorrectionRepo,
      entryProjectionRepo,
      tx,
      logger
    )

    const driverId = 'driver-1' as DriverId
    const leaveId = 'leave-1' as LeaveId

    await recordLeave.execute({
      driverId,
      leaveId,
      startTime: new Date('2025-01-01T08:00:00Z'),
      endTime: new Date('2025-01-01T09:00:00Z'),
      now,
    })

    await startWork.execute(
      driverId,
      workId,
      new Date('2025-01-01T09:00:00Z'),
      now
    )
  })
})
