import { Request, Response } from "express";
import { RecordLeaveService } from "../../../../application/services/leave/RecordLeaveService";
import { asDriverId, asLeaveId } from "../../../../domain/shared/types";


export class RecordLeaveController {
  constructor(
    private readonly recordLeaveService: RecordLeaveService
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const {
        driverId,
        leaveId,
        startTime,
        endTime,
        reason,
      } = req.body;

      await this.recordLeaveService.execute({
        driverId: asDriverId(driverId),
        leaveId: asLeaveId(leaveId),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        now: new Date(),
        reason,
      });

      res.status(201).json({ status: "leave_recorded" });
    } catch (err: any) {
      res.status(400).json({
        error: err.code ?? "RECORD_LEAVE_FAILED",
        message: err.message,
      });
    }
  }
}
