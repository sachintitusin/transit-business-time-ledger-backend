// src/interfaces/http/routes/me.routes.ts

import { Router } from "express";
import { GetMeController } from "../controllers/me/GetMeController";

export function createMeRoutes(
  controller: GetMeController
): Router {
  const router = Router();

  router.get("/", (req, res) =>
    controller.handle(req as any, res)
  );

  return router;
}
