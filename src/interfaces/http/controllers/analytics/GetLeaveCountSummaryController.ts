import { Response } from "express";

import { TimeRange } from "../../../../domain/shared/TimeRange";
import { GetLeaveCountSummaryService } from "../../../../application/services/analytics/GetLeaveCountSummaryService";
import { AuthenticatedRequest } from "../../types/AuthRequest";

export class GetLeaveCountSummaryController {
  constructor(
    private readonly getLeaveCountSummaryService: GetLeaveCountSummaryService
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
      await this.getLeaveCountSummaryService.execute({
        driverId: req.driverId,   // ✅ identity from JWT
        range,
      });

    res.status(200).json(summary);
  }
}
