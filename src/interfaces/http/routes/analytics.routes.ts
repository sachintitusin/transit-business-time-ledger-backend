import { Router } from "express";
import { GetLeaveCountSummaryController } from "../controllers/analytics/GetLeaveCountSummaryController";
import { GetWorkSummaryController } from "../controllers/analytics/GetWorkSummaryController";

export const createAnalyticsRoutes = (
  getLeaveCountSummaryController: GetLeaveCountSummaryController,
  getWorkSummaryController: GetWorkSummaryController
) => {
  const router = Router();

  router.get("/leaves", (req, res) =>
    getLeaveCountSummaryController.handle(req, res)
  );

  router.get("/work", (req, res) =>
    getWorkSummaryController.handle(req, res)
  );

  return router;
};
