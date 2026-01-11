import { Router } from "express";
import { RecordLeaveController } from "../controllers/leave/RecordLeaveController";
import { LeaveCorrectionController } from "../controllers/leave/LeaveCorrectionController";

export const createLeaveRoutes = (
  recordLeaveController: RecordLeaveController,
  leaveCorrectionController: LeaveCorrectionController
) => {
  const router = Router();

  router.post("/record", (req, res) =>
    recordLeaveController.handle(req, res)
  );

  router.post("/correct", (req, res) =>
    leaveCorrectionController.handle(req, res)
  );

  return router;
};
