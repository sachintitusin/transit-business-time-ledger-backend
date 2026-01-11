import { Router } from "express";
import { RecordShiftTransferController } from "../controllers/transfer/RecordShiftTransferController";

export const createTransferRoutes = (
  recordShiftTransferController: RecordShiftTransferController
) => {
  const router = Router();

  router.post("/record", (req, res) =>
    recordShiftTransferController.handle(req, res)
  );

  return router;
};
