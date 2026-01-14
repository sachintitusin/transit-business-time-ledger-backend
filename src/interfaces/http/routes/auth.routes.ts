import { Router } from "express";
import { AuthenticateDriverController } from "../controllers/auth/AuthenticateDriverController";
import { validateBody } from "../middlewares/validateBody";
import { AuthenticateRequestSchema } from "../dto/auth/AuthenticateDto";

export function createAuthRoutes(
  authenticateDriverController: AuthenticateDriverController
): Router {
  const router = Router();

  router.post(
    "/google",
    validateBody(AuthenticateRequestSchema),
    (req, res) => authenticateDriverController.handle(req, res)
  );

  return router;
}
