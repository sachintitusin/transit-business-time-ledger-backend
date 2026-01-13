import { Router } from "express";
import { AuthenticateDriverController } from "../controllers/auth/AuthenticateDriverController";

export function createAuthRoutes(
  authenticateDriverController: AuthenticateDriverController
): Router {
  const router = Router();

  router.post(
    "/google",
    (req, res) => authenticateDriverController.handle(req, res)
  );

  return router;
}
