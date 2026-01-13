import { Response } from "express";
import { randomUUID } from "crypto";

import { RecordShiftTransferService } from "../../../../application/services/transfer/RecordShiftTransferService";
import { asDriverId, asWorkPeriodId } from "../../../../domain/shared/types";
import { AuthenticatedRequest } from "../../types/AuthRequest";
import { DomainError } from "../../../../domain/shared/DomainError";

export class RecordShiftTransferController {
  constructor(
    private readonly recordShiftTransferService: RecordShiftTransferService
  ) {}

  async handle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // 🔒 This route is protected — driverId MUST exist
      if (!req.driverId) {
        throw new Error(
          "Invariant violation: authenticated request without driverId"
        );
      }

      const { workPeriodId, toDriverId, reason } = req.body;

      await this.recordShiftTransferService.execute({
        transferId: randomUUID(),
        workPeriodId: asWorkPeriodId(workPeriodId),
        toDriverId: asDriverId(toDriverId),
        fromDriverId: req.driverId,
        createdAt: new Date(),
        reason,
      });

      res.status(201).json({ status: "transfer_recorded" });
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
