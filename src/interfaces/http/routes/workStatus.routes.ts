import { Router } from "express";
import { GetWorkStatusController } from "../controllers/work/GetWorkStatusController";

export function createWorkStatusRoutes(
  controller: GetWorkStatusController
): Router {
  const router = Router();

  router.get("/status", (req, res) =>
    controller.handle(req as any, res)
  );

  return router;
}
