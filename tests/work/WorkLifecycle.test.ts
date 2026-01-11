import { describe, it, expect } from 'vitest'
import { StartWorkService } from '../../src/application/services/work/StartWorkService'
import { InMemoryWorkPeriodRepository } from '../fakes/InMemoryWorkPeriodRepository'
import { DriverId, WorkPeriodId } from '../../src/domain/shared/types'
import { InMemoryLeaveRepository } from '../fakes/InMemoryLeaveRepository'
import { InMemoryLeaveCorrectionRepository } from '../fakes/InMemoryLeaveCorrectionRepository'
import { CloseWorkService } from '../../src/application/services/work/CloseWorkService'
import { CorrectWorkService } from '../../src/application/services/work/CorrectWorkService'
import { InMemoryWorkCorrectionRepository } from '../fakes/InMemoryWorkCorrectionRepository'

describe('Work lifecycle', () => {
  it('starts work successfully when no work is active', async () => {
    const workRepo = new InMemoryWorkPeriodRepository()
    const startWork = new StartWorkService(workRepo)

    const driverId = 'driver-1' as DriverId
    const workPeriodId = 'work-1' as WorkPeriodId
    const now = new Date('2025-01-01T09:00:00Z')

    await startWork.execute(driverId, workPeriodId, now, now)

    const openWork = await workRepo.findOpenByDriver(driverId)
    expect(openWork).not.toBeNull()
    expect(openWork!.isOpen()).toBe(true)
  })

  it('rejects starting work when another work period is already open', async () => {
    const workRepo = new InMemoryWorkPeriodRepository()
    const startWork = new StartWorkService(workRepo)

    const driverId = 'driver-1' as DriverId
    const firstWorkId = 'work-1' as WorkPeriodId
    const secondWorkId = 'work-2' as WorkPeriodId
    const now = new Date('2025-01-01T09:00:00Z')

    await startWork.execute(driverId, firstWorkId, now, now)

    await expect(
        startWork.execute(driverId, secondWorkId, now, now)
    ).rejects.toThrow()
    })

    it('rejects closing work when no work period is open', async () => {
    const workRepo = new InMemoryWorkPeriodRepository()
    const leaveRepo = new InMemoryLeaveRepository()
    const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository()

    const closeWork = new CloseWorkService(
        workRepo,
        leaveRepo,
        leaveCorrectionRepo
    )

    const driverId = 'driver-1' as DriverId
    const endTime = new Date('2025-01-01T17:00:00Z')

    await expect(
        closeWork.execute(driverId, endTime)
    ).rejects.toThrow()
    })

    it('closes work successfully', async () => {
  const workRepo = new InMemoryWorkPeriodRepository()
  const leaveRepo = new InMemoryLeaveRepository()
  const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository()

  const startWork = new StartWorkService(workRepo)
  const closeWork = new CloseWorkService(
    workRepo,
    leaveRepo,
    leaveCorrectionRepo
  )

  const driverId = 'driver-1' as DriverId
  const workId = 'work-1' as WorkPeriodId

  const start = new Date('2025-01-01T09:00:00Z')
  const end = new Date('2025-01-01T17:00:00Z')

  await startWork.execute(driverId, workId, start, start)
  await closeWork.execute(driverId, end)

  const work = await workRepo.findById(workId)

  expect(work!.isClosed()).toBe(true)
})

it('preserves original work period after correction', async () => {
  const workRepo = new InMemoryWorkPeriodRepository()
  const correctionRepo = new InMemoryWorkCorrectionRepository()
  const leaveRepo = new InMemoryLeaveRepository()
  const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository()

  const startWork = new StartWorkService(workRepo)
  const closeWork = new CloseWorkService(
    workRepo,
    leaveRepo,
    leaveCorrectionRepo
  )
  const correctWork = new CorrectWorkService(
    workRepo,
    correctionRepo,
    leaveRepo,
    leaveCorrectionRepo
  )

  const driverId = 'driver-1' as DriverId
  const workId = 'work-1' as WorkPeriodId
  const correctionId = 'corr-1' as any

  const originalStart = new Date('2025-01-01T09:00:00Z')
  const originalEnd = new Date('2025-01-01T12:00:00Z')

  await startWork.execute(driverId, workId, originalStart, new Date())
  await closeWork.execute(driverId, originalEnd)

  await correctWork.execute(
    driverId,
    workId,
    correctionId,
    new Date('2025-01-01T10:00:00Z'),
    new Date('2025-01-01T13:00:00Z'),
    new Date()
  )

  const work = await workRepo.findById(workId)

  expect(work!.declaredStartTime).toEqual(originalStart)
  expect(work!.declaredEndTime).toEqual(originalEnd)
})

it('keeps declared work time separate from entry time', async () => {
  const workRepo = new InMemoryWorkPeriodRepository()
  const startWork = new StartWorkService(workRepo)

  const driverId = 'driver-1' as DriverId
  const workId = 'work-1' as WorkPeriodId

  const workTime = new Date('2025-01-01T09:00:00Z')
  const entryTime = new Date('2025-01-03T20:00:00Z')

  await startWork.execute(driverId, workId, workTime, entryTime)

  const work = await workRepo.findById(workId)

  expect(work!.declaredStartTime).toEqual(workTime)
  expect(work!.createdAt).toEqual(entryTime)
})


})
