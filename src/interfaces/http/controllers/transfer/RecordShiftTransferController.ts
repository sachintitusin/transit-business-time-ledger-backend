import { Response } from "express";
import { randomUUID } from "crypto";

import { RecordShiftTransferService } from "../../../../application/services/transfer/RecordShiftTransferService";
import {
  asDriverId,
  asWorkPeriodId,
  asShiftTransferId,
} from "../../../../domain/shared/types";
import { AuthenticatedRequest } from "../../types/AuthRequest";
import { DomainError } from "../../../../domain/shared/DomainError";

export class RecordShiftTransferController {
  constructor(
    private readonly recordShiftTransferService: RecordShiftTransferService
  ) {}

  async handle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.driverId) {
        throw new Error(
          "Invariant violation: authenticated request without driverId"
        );
      }

      const { fromDriverId, toDriverId, workPeriodId, reason } = req.body;

      const transferId = asShiftTransferId(randomUUID());

      await this.recordShiftTransferService.execute({
        transferId,
        workPeriodId: asWorkPeriodId(workPeriodId),
        fromDriverId: asDriverId(fromDriverId),
        toDriverId: asDriverId(toDriverId),
        createdAt: new Date(),
        reason,
      });

      res.status(201).json({ transferId });
    } catch (error) {

      if (error instanceof DomainError) {
        res.status(400).json({
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
        return;
      }

      throw error;
    }
  }
}
