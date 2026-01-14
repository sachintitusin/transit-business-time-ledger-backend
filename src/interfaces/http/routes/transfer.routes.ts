import { Router } from "express";
import { RecordShiftTransferController } from "../controllers/transfer/RecordShiftTransferController";
import { validateBody } from "../middlewares/validateBody";
import { RecordShiftTransferRequestSchema } from "../dto/transfer/RecordShiftTransferDto";

export const createTransferRoutes = (
  recordShiftTransferController: RecordShiftTransferController
) => {
  const router = Router();

  router.post(
    "/record",
    validateBody(RecordShiftTransferRequestSchema),
    (req, res) => recordShiftTransferController.handle(req, res)
  );

  return router;
};
