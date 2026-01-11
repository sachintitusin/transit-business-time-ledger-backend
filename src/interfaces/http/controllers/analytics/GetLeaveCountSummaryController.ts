import { Request, Response } from "express";
import { TimeRange } from "../../../../domain/shared/TimeRange";
import { GetLeaveCountSummaryService } from "../../../../application/services/analytics/GetLeaveCountSummaryService";
import { asDriverId } from "../../../../domain/shared/types";


export class GetLeaveCountSummaryController {
  constructor(
    private readonly getLeaveCountSummaryService: GetLeaveCountSummaryService
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const { driverId, from, to } = req.query;

      const range = TimeRange.create(
        new Date(from as string),
        new Date(to as string)
      );

      const summary =
        await this.getLeaveCountSummaryService.execute({
          driverId: asDriverId(driverId as string),
          range,
        });

      res.status(200).json(summary);
    } catch (err: any) {
      res.status(400).json({
        error: err.code ?? "LEAVE_SUMMARY_FAILED",
        message: err.message,
      });
    }
  }
}
