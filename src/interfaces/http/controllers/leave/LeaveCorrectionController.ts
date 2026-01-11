import { Request, Response } from "express";
import { LeaveCorrectionService } from "../../../../application/services/leave/LeaveCorrectionService";
import { asDriverId, asLeaveId } from "../../../../domain/shared/types";


export class LeaveCorrectionController {
  constructor(
    private readonly leaveCorrectionService: LeaveCorrectionService
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const {
        driverId,
        leaveId,
        correctionId,
        correctedStartTime,
        correctedEndTime,
        reason,
      } = req.body;

      await this.leaveCorrectionService.execute({
        driverId: asDriverId(driverId),
        leaveId: asLeaveId(leaveId),
        correctionId,
        correctedStartTime: new Date(correctedStartTime),
        correctedEndTime: new Date(correctedEndTime),
        now: new Date(),
        reason,
      });

      res.status(201).json({ status: "leave_corrected" });
    } catch (err: any) {
      res.status(400).json({
        error: err.code ?? "LEAVE_CORRECTION_FAILED",
        message: err.message,
      });
    }
  }
}
