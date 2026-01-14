import { ShiftTransferRepository } from '../../ports/ShiftTransferRepository'
import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository'
import { TransactionManager } from '../../ports/TransactionManager'

import { ShiftTransferEvent } from '../../../domain/transfer/ShiftTransferEvent'
import { DriverId, ShiftTransferId, WorkPeriodId } from '../../../domain/shared/types'
import { DomainError } from '../../../domain/shared/DomainError'

export class RecordShiftTransferService {
  constructor(
    private readonly shiftTransferRepo: ShiftTransferRepository,
    private readonly workPeriodRepo: WorkPeriodRepository,
    private readonly transactionManager: TransactionManager
  ) {}

  async execute(command: {
    transferId: ShiftTransferId
    workPeriodId: WorkPeriodId
    toDriverId: DriverId
    fromDriverId: DriverId
    createdAt: Date
    reason?: string
  }): Promise<void> {
    await this.transactionManager.run(async () => {
      const {
        transferId,
        workPeriodId,
        toDriverId,
        fromDriverId,
        createdAt,
        reason,
      } = command

      const workPeriod = await this.workPeriodRepo.findById(workPeriodId)

      if (!workPeriod) {
        throw new DomainError(
          'WORK_PERIOD_NOT_FOUND',
          'Cannot transfer non-existent work period'
        )
      }

      if (fromDriverId === toDriverId) {
        throw new DomainError(
          'INVALID_SHIFT_TRANSFER',
          'Cannot transfer a shift to the same driver'
        )
      }

      const event = ShiftTransferEvent.create(
        transferId,
        workPeriodId,
        toDriverId,
        fromDriverId,
        createdAt,
        reason
      )

      await this.shiftTransferRepo.save(event)
    })
  }
}
