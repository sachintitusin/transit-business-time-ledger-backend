import { Request, Response } from "express";
import { CloseWorkService } from "../../../../application/services/work/CloseWorkService";
import { asDriverId } from "../../../../domain/shared/types";

export class CloseWorkController {
  constructor(
    private readonly closeWorkService: CloseWorkService
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const { driverId, endTime } = req.body;

      await this.closeWorkService.execute(
        asDriverId(driverId),
        new Date(endTime)
      );

      res.status(200).json({ status: "closed" });
    } catch (err: any) {
      res.status(400).json({
        error: err.code ?? "CLOSE_WORK_FAILED",
        message: err.message,
      });
    }
  }
}
