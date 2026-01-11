import { Request, Response } from "express";
import { asDriverId, asWorkPeriodId } from "../../../../domain/shared/types";
import { RecordShiftTransferService } from "../../../../application/services/transfer/RecordShiftTransferService";


export class RecordShiftTransferController {
  constructor(
    private readonly recordShiftTransferService: RecordShiftTransferService
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const {
        transferId,
        workPeriodId,
        toDriverId,
        fromDriverId,
        reason,
      } = req.body;

      await this.recordShiftTransferService.execute({
        transferId,
        workPeriodId: asWorkPeriodId(workPeriodId),
        toDriverId: asDriverId(toDriverId),
        fromDriverId: fromDriverId
          ? asDriverId(fromDriverId)
          : null,
        createdAt: new Date(),
        reason,
      });

      res.status(201).json({ status: "transfer_recorded" });
    } catch (err: any) {
      res.status(400).json({
        error: err.code ?? "SHIFT_TRANSFER_FAILED",
        message: err.message,
      });
    }
  }
}
