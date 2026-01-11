import { describe, it, expect } from 'vitest'
import { RecordLeaveService } from '../../src/application/services/leave/RecordLeaveService'
import { InMemoryLeaveRepository } from '../fakes/InMemoryLeaveRepository'
import { InMemoryWorkPeriodRepository } from '../fakes/InMemoryWorkPeriodRepository'
import { DriverId, LeaveId } from '../../src/domain/shared/types'
import { LeaveCorrectionService } from '../../src/application/services/leave/LeaveCorrectionService'
import { InMemoryLeaveCorrectionRepository } from '../fakes/InMemoryLeaveCorrectionRepository'

describe('Leave lifecycle', () => {
  it('records leave successfully', async () => {
    const leaveRepo = new InMemoryLeaveRepository()
    const workRepo = new InMemoryWorkPeriodRepository()

    const recordLeave = new RecordLeaveService(
      leaveRepo,
      workRepo
    )

    const driverId = 'driver-1' as DriverId
    const leaveId = 'leave-1' as LeaveId

    await recordLeave.execute(
      driverId,
      leaveId,
      new Date('2025-01-01T10:00:00Z'),
      new Date('2025-01-01T12:00:00Z'),
      new Date()
    )

    const leaves = await leaveRepo.findByDriver(driverId)

    expect(leaves.length).toBe(1)
    expect(leaves[0].id).toBe(leaveId)
  })

  it('corrects leave successfully', async () => {
  const leaveRepo = new InMemoryLeaveRepository()
  const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository()
  const workRepo = new InMemoryWorkPeriodRepository()

  const recordLeave = new RecordLeaveService(
    leaveRepo,
    workRepo
  )

  const correctLeave = new LeaveCorrectionService(
    leaveRepo,
    leaveCorrectionRepo,
    workRepo
  )

  const driverId = 'driver-1' as DriverId
  const leaveId = 'leave-1' as LeaveId
  const correctionId = 'corr-1' as any

  await recordLeave.execute(
    driverId,
    leaveId,
    new Date('2025-01-01T10:00:00Z'),
    new Date('2025-01-01T12:00:00Z'),
    new Date()
  )

  await correctLeave.execute(
    driverId,
    leaveId,
    correctionId,
    new Date('2025-01-01T11:00:00Z'),
    new Date('2025-01-01T13:00:00Z'),
    new Date(),
    'Wrong time entered'
  )

  const corrections =
    await leaveCorrectionRepo.findByLeaveId(leaveId)

  expect(corrections.length).toBe(1)
  expect(corrections[0].id).toBe(correctionId)
})
})
