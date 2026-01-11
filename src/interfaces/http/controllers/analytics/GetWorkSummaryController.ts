import { Request, Response } from "express";
import { GetWorkSummaryService } from "../../../../application/services/analytics/GetWorkSummaryService";
import { TimeRange } from "../../../../domain/shared/TimeRange";
import { asDriverId } from "../../../../domain/shared/types";

export class GetWorkSummaryController {
  constructor(
    private readonly getWorkSummaryService: GetWorkSummaryService
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const { driverId, from, to } = req.query;

      const range = TimeRange.create(
        new Date(from as string),
        new Date(to as string)
      );

      const summary =
        await this.getWorkSummaryService.execute({
          driverId: asDriverId(driverId as string),
          range,
        });

      res.status(200).json(summary);
    } catch (err: any) {
      res.status(400).json({
        error: err.code ?? "WORK_SUMMARY_FAILED",
        message: err.message,
      });
    }
  }
}
