import { Router } from "express";
import { GetLeaveCountSummaryController } from "../controllers/analytics/GetLeaveCountSummaryController";
import { GetWorkSummaryController } from "../controllers/analytics/GetWorkSummaryController";
import { GetDailyAnalyticsController } from "../controllers/analytics/GetDailyAnalyticsController";
import { validateQueryParams } from "../middlewares/validateQueryParams";
import {
  WorkSummaryQuerySchema,
  LeaveSummaryQuerySchema,
  DailyAnalyticsQuerySchema,
} from "../dto/analytics/QueryParamsDto";

export const createAnalyticsRoutes = (
  getLeaveCountSummaryController: GetLeaveCountSummaryController,
  getWorkSummaryController: GetWorkSummaryController,
  getDailyAnalyticsController: GetDailyAnalyticsController
) => {
  const router = Router();

  router.get(
    "/leaves",
    validateQueryParams(LeaveSummaryQuerySchema),
    (req, res) => getLeaveCountSummaryController.handle(req, res)
  );

  router.get(
    "/work",
    validateQueryParams(WorkSummaryQuerySchema),
    (req, res) => getWorkSummaryController.handle(req, res)
  );

  router.get(
    "/daily",
    validateQueryParams(DailyAnalyticsQuerySchema),
    (req, res) => getDailyAnalyticsController.handle(req as any, res)
  );

  return router;
};
