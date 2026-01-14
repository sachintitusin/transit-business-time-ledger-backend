import { Router } from "express";
import { RecordLeaveController } from "../controllers/leave/RecordLeaveController";
import { LeaveCorrectionController } from "../controllers/leave/LeaveCorrectionController";
import { validateBody } from "../middlewares/validateBody";
import { RecordLeaveRequestSchema } from "../dto/leave/RecordLeaveDto";
import { CorrectLeaveRequestSchema } from "../dto/leave/CorrectLeaveDto";

export const createLeaveRoutes = (
  recordLeaveController: RecordLeaveController,
  leaveCorrectionController: LeaveCorrectionController
) => {
  const router = Router();

  router.post(
    "/record",
    validateBody(RecordLeaveRequestSchema),
    (req, res) => recordLeaveController.handle(req, res)
  );

  router.post(
    "/correct",
    validateBody(CorrectLeaveRequestSchema),
    (req, res) => leaveCorrectionController.handle(req, res)
  );

  return router;
};
