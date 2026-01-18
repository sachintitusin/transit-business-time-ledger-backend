import { Response } from "express";
import { AuthenticatedRequest } from "../../types/AuthRequest";
import { GetDailyAnalyticsService } from "../../../../application/services/analytics/GetDailyAnalyticsService";

export class GetDailyAnalyticsController {
  constructor(
    private readonly service: GetDailyAnalyticsService
  ) {}

  async handle(req: AuthenticatedRequest, res: Response) {
    const driverId = req.driverId!;

    const { from, to } = req.query;

    if (typeof from !== "string" || typeof to !== "string") {
      return res.status(400).json({
        error: {
          code: "INVALID_QUERY",
          message: "`from` and `to` query params are required",
        },
      });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({
        error: {
          code: "INVALID_DATE",
          message: "`from` and `to` must be valid ISO dates",
        },
      });
    }

    const result = await this.service.execute({
      driverId,
      from: fromDate,
      to: toDate,
    });

    res.status(200).json(result);
  }
}
