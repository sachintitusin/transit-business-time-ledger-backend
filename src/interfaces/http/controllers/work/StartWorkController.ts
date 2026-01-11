import { Request, Response } from "express";
import { StartWorkService } from "../../../../application/services/work/StartWorkService";
import { asDriverId, asWorkPeriodId } from "../../../../domain/shared/types";

export class StartWorkController {
  constructor(
    private readonly startWorkService: StartWorkService
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const { driverId, workPeriodId, startTime } = req.body;

      await this.startWorkService.execute(
        asDriverId(driverId),
        asWorkPeriodId(workPeriodId),
        new Date(startTime),
        new Date()
      );

      res.status(201).json({ status: "started" });
    } catch (err: any) {
      res.status(400).json({
        error: err.code ?? "START_WORK_FAILED",
        message: err.message,
      });
    }
  }
}
