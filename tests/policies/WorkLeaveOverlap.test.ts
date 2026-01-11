import { describe, it, expect } from 'vitest'
import { InMemoryWorkPeriodRepository } from '../fakes/InMemoryWorkPeriodRepository'
import { InMemoryLeaveRepository } from '../fakes/InMemoryLeaveRepository'
import { InMemoryLeaveCorrectionRepository } from '../fakes/InMemoryLeaveCorrectionRepository'
import { StartWorkService } from '../../src/application/services/work/StartWorkService'
import { CloseWorkService } from '../../src/application/services/work/CloseWorkService'
import { RecordLeaveService } from '../../src/application/services/leave/RecordLeaveService'
import { DriverId, LeaveId, WorkPeriodId } from '../../src/domain/shared/types'
import { CorrectWorkService } from '../../src/application/services/work/CorrectWorkService'
import { InMemoryWorkCorrectionRepository } from '../fakes/InMemoryWorkCorrectionRepository'

describe('Work–Leave overlap policy', () => {
it('rejects closing work that overlaps existing leave', async () => {
    const workRepo = new InMemoryWorkPeriodRepository()
    const leaveRepo = new InMemoryLeaveRepository()
    const leaveCorrectionRepo = new InMemoryLeaveCorrectionRepository()

    const startWork = new StartWorkService(workRepo)
    const closeWork = new CloseWorkService(
      workRepo,
      leaveRepo,
      leaveCorrectionRepo
    )
    const recordLeave = new RecordLeaveService(
      leaveRepo,
      workRepo
    )

    const driverId = 'driver-1' as DriverId
    const workId = 'work-1' as WorkPeriodId
    const leaveId = 'leave-1' as LeaveId

    await recordLeave.execute(
      driverId,
      leaveId,
      new Date('2025-01-01T12:00:00Z'),
      new Date('2025-01-01T14:00:00Z'),
      new Date()
    )

    await startWork.execute(
      driverId,
      workId,
      new Date('2025-01-01T09:00:00Z'),
      new Date()
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

  const startWork = new StartWorkService(workRepo)
  const closeWork = new CloseWorkService(
    workRepo,
    leaveRepo,
    leaveCorrectionRepo
  )
  const correctWork = new CorrectWorkService(
    workRepo,
    workCorrectionRepo,
    leaveRepo,
    leaveCorrectionRepo
  )
  const recordLeave = new RecordLeaveService(
    leaveRepo,
    workRepo
  )

  const driverId = 'driver-1' as DriverId
  const workId = 'work-1' as WorkPeriodId
  const correctionId = 'corr-1' as any
  const leaveId = 'leave-1' as LeaveId

  await startWork.execute(
    driverId,
    workId,
    new Date('2025-01-01T09:00:00Z'),
    new Date()
  )

  await closeWork.execute(driverId, new Date('2025-01-01T12:00:00Z'))

  await recordLeave.execute(
    driverId,
    leaveId,
    new Date('2025-01-01T13:00:00Z'),
    new Date('2025-01-01T14:00:00Z'),
    new Date()
  )

  await expect(
    correctWork.execute(
      driverId,
      workId,
      correctionId,
      new Date('2025-01-01T10:00:00Z'),
      new Date('2025-01-01T15:00:00Z'),
      new Date()
    )
  ).rejects.toThrow()
})

it('uses effective work time for overlap validation after correction', async () => {
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
  const recordLeave = new RecordLeaveService(
    leaveRepo,
    workRepo
  )

  const driverId = 'driver-1' as DriverId
  const workId = 'work-1' as WorkPeriodId
  const correctionId = 'corr-1' as any
  const leaveId = 'leave-1' as LeaveId

  await startWork.execute(
    driverId,
    workId,
    new Date('2025-01-01T09:00:00Z'),
    new Date()
  )

  await closeWork.execute(driverId, new Date('2025-01-01T12:00:00Z'))

  await recordLeave.execute(
    driverId,
    leaveId,
    new Date('2025-01-01T13:00:00Z'),
    new Date('2025-01-01T14:00:00Z'),
    new Date()
  )

  await expect(
    correctWork.execute(
      driverId,
      workId,
      correctionId,
      new Date('2025-01-01T09:00:00Z'),
      new Date('2025-01-01T15:00:00Z'),
      new Date()
    )
  ).rejects.toThrow()
})

})
