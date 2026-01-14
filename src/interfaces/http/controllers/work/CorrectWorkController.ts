import { Response } from "express";
import { CorrectWorkService } from "../../../../application/services/work/CorrectWorkService";
import { asWorkPeriodId } from "../../../../domain/shared/types";
import { AuthenticatedRequest } from "../../types/AuthRequest";
import { DomainError } from "../../../../domain/shared/DomainError";

export class CorrectWorkController {
  constructor(
    private readonly correctWorkService: CorrectWorkService
  ) {}

  async handle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // 🔒 Auth invariant: this route is protected
      if (!req.driverId) {
        throw new Error(
          "Invariant violation: authenticated request without driverId"
        );
      }

      const {
        workPeriodId,
        correctionId,
        correctedStartTime,
        correctedEndTime,
        reason,
      } = req.body;

      await this.correctWorkService.execute({
        driverId: req.driverId,                 
        workPeriodId: asWorkPeriodId(workPeriodId),
        correctionId,
        correctedStartTime: new Date(correctedStartTime),
        correctedEndTime: new Date(correctedEndTime),
        now: new Date(),
        reason,
      });

      res.status(201).json({ status: "corrected" });
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
