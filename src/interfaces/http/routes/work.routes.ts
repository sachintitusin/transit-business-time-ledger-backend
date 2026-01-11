import { Router } from "express";
import { StartWorkController } from "../controllers/work/StartWorkController";
import { CloseWorkController } from "../controllers/work/CloseWorkController";
import { CorrectWorkController } from "../controllers/work/CorrectWorkController";


export const createWorkRoutes = (
  startWorkController: StartWorkController,
  closeWorkController: CloseWorkController,
  correctWorkController: CorrectWorkController
) => {
  const router = Router();

  router.post("/start", (req, res) =>
    startWorkController.handle(req, res)
  );

  router.post("/close", (req, res) =>
    closeWorkController.handle(req, res)
  );

  router.post("/correct", (req, res) =>
    correctWorkController.handle(req, res)
    );

  return router;
};
