import { Response } from "express";
import { randomUUID } from "crypto";
import { LeaveCorrectionService } from "../../../../application/services/leave/LeaveCorrectionService";
import { asLeaveId, asLeaveCorrectionId } from "../../../../domain/shared/types";
import { AuthenticatedRequest } from "../../types/AuthRequest";
import { DomainError } from "../../../../domain/shared/DomainError";
import { CorrectLeaveRequest } from "../../dto/leave/CorrectLeaveDto";

export class LeaveCorrectionController {
  constructor(private readonly leaveCorrectionService: LeaveCorrectionService) {}

  async handle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.driverId) {
        throw new Error("Invariant violation: authenticated request without driverId");
      }

      // ✅ Only get these from body (validated by middleware)
      const { leaveId, correctedStartTime, correctedEndTime, reason } = 
        req.body as CorrectLeaveRequest;
      
      // ✅ Generate the correction ID here
      const leaveCorrectionId = asLeaveCorrectionId(randomUUID());

      await this.leaveCorrectionService.execute({
        driverId: req.driverId,  // ✅ From JWT (secure)
        leaveId: asLeaveId(leaveId),
        correctionId: leaveCorrectionId,  // ✅ Generated here
        correctedStartTime: new Date(correctedStartTime),
        correctedEndTime: new Date(correctedEndTime),
        now: new Date(),
        reason,
      });

      res.status(201).json({ 
        leaveCorrectionId,
        status: "corrected" 
      });
    } catch (error) {
      if (error instanceof DomainError) {
        res.status(400).json({
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
        return;
      }
      throw error;
    }
  }
}