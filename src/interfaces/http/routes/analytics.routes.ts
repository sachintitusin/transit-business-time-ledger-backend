import { Router } from "express";
import { GetLeaveCountSummaryController } from "../controllers/analytics/GetLeaveCountSummaryController";
import { GetWorkSummaryController } from "../controllers/analytics/GetWorkSummaryController";
import { validateQueryParams } from "../middlewares/validateQueryParams";
import { WorkSummaryQuerySchema, LeaveSummaryQuerySchema } from "../dto/analytics/QueryParamsDto";

export const createAnalyticsRoutes = (
  getLeaveCountSummaryController: GetLeaveCountSummaryController,
  getWorkSummaryController: GetWorkSummaryController
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

  return router;
};
