// src/interfaces/http/controllers/leave/RecordLeaveController.ts
import { Response } from "express";
import { randomUUID } from "crypto";
import { RecordLeaveService } from "../../../../application/services/leave/RecordLeaveService";
import { asLeaveId } from "../../../../domain/shared/types";
import { AuthenticatedRequest } from "../../types/AuthRequest";
import { DomainError } from "../../../../domain/shared/DomainError";
import { RecordLeaveRequest } from "../../dto/leave/RecordLeaveDto";

export class RecordLeaveController {
  constructor(private readonly recordLeaveService: RecordLeaveService) {}

  async handle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.driverId) {
        throw new Error("Invariant violation: authenticated request without driverId");
      }

      const { startTime, endTime, reason } = req.body as RecordLeaveRequest;
      
      // Generate the ID here
      const leaveId = asLeaveId(randomUUID());

      await this.recordLeaveService.execute({
        driverId: req.driverId,
        leaveId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        now: new Date(),
        reason,
      });

      // Return the generated ID
      res.status(201).json({ 
        leaveId,
        status: "recorded" 
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