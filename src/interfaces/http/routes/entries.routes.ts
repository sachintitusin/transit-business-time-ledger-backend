import { Router } from "express";
import { GetEntriesController } from "../controllers/entries/GetEntriesController";
import { GetEntryByIdController } from "../controllers/entries/GetEntryByIdController";

export function createEntriesRoutes(
  listController: GetEntriesController,
  byIdController: GetEntryByIdController
): Router {
  const router = Router();

  // GET /entries
  router.get("/", (req, res) =>
    listController.handle(req as any, res)
  );

  // GET /entries/:id
  router.get("/:id", (req, res) =>
    byIdController.handle(req as any, res)
  );

  return router;
}
