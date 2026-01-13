import { ShiftTransferRepository } from '../../ports/ShiftTransferRepository'
import { TransactionManager } from '../../ports/TransactionManager'

import { ShiftTransferEvent } from '../../../domain/transfer/ShiftTransferEvent'
import { DriverId, WorkPeriodId } from '../../../domain/shared/types'
import { DomainError } from '../../../domain/shared/DomainError'

export class RecordShiftTransferService {
  constructor(
    private readonly shiftTransferRepo: ShiftTransferRepository,
    private readonly transactionManager: TransactionManager
  ) {}

  async execute(command: {
    transferId: string
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

      // Invariant: cannot transfer to self
      if (fromDriverId === toDriverId) {
        throw new DomainError(
          'INVALID_SHIFT_TRANSFER',
          'Cannot transfer a shift to the same driver'
        )
      }

      // Create domain event
      const event = ShiftTransferEvent.create(
        transferId,
        workPeriodId,
        toDriverId,
        fromDriverId,
        createdAt,
        reason
      )

      // Persist atomically
      await this.shiftTransferRepo.save(event)
    })
  }
}
