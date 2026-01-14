import { Router } from "express";
import { StartWorkController } from "../controllers/work/StartWorkController";
import { CloseWorkController } from "../controllers/work/CloseWorkController";
import { CorrectWorkController } from "../controllers/work/CorrectWorkController";
import { validateBody } from "../middlewares/validateBody";
import { StartWorkRequestSchema } from "../dto/work/StartWorkDto";
import { CloseWorkRequestSchema } from "../dto/work/CloseWorkDto";
import { CorrectWorkRequestSchema } from "../dto/work/CorrectWorkDto";

export const createWorkRoutes = (
  startWorkController: StartWorkController,
  closeWorkController: CloseWorkController,
  correctWorkController: CorrectWorkController
) => {
  const router = Router();

  router.post(
    "/start",
    validateBody(StartWorkRequestSchema),
    (req, res) => startWorkController.handle(req, res)
  );

  router.post(
    "/close",
    validateBody(CloseWorkRequestSchema),
    (req, res) => closeWorkController.handle(req, res)
  );

  router.post(
    "/correct",
    validateBody(CorrectWorkRequestSchema),
    (req, res) => correctWorkController.handle(req, res)
  );

  return router;
};
