import { Response } from "express";

import { GetWorkSummaryService } from "../../../../application/services/analytics/GetWorkSummaryService";
import { TimeRange } from "../../../../domain/shared/TimeRange";
import { AuthenticatedRequest } from "../../types/AuthRequest";

export class GetWorkSummaryController {
  constructor(
    private readonly getWorkSummaryService: GetWorkSummaryService
  ) {}

  async handle(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 🔒 Auth invariant: this route is protected
    if (!req.driverId) {
      throw new Error(
        "Invariant violation: authenticated request without driverId"
      );
    }

    const { from, to } = req.query;

    const range = TimeRange.create(
      new Date(from as string),
      new Date(to as string)
    );

    const summary =
      await this.getWorkSummaryService.execute({
        driverId: req.driverId,   // ✅ identity from JWT
        range,
      });

    res.status(200).json(summary);
  }
}
