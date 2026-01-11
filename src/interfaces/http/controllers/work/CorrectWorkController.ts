import { Request, Response } from "express";
import { CorrectWorkService } from "../../../../application/services/work/CorrectWorkService";
import {
  asDriverId,
  asWorkPeriodId,
} from "../../../../domain/shared/types";

export class CorrectWorkController {
  constructor(
    private readonly correctWorkService: CorrectWorkService
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const {
        driverId,
        workPeriodId,
        correctionId,
        correctedStartTime,
        correctedEndTime,
        reason,
      } = req.body;

      await this.correctWorkService.execute({
        driverId: asDriverId(driverId),
        workPeriodId: asWorkPeriodId(workPeriodId),
        correctionId,
        correctedStartTime: new Date(correctedStartTime),
        correctedEndTime: new Date(correctedEndTime),
        now: new Date(),
        reason,
      });

      res.status(201).json({ status: "corrected" });
    } catch (err: any) {
      res.status(400).json({
        error: err.code ?? "CORRECT_WORK_FAILED",
        message: err.message,
      });
    }
  }
}
