import { Response } from "express";
import { StartWorkService } from "../../../../application/services/work/StartWorkService";
import { asWorkPeriodId } from "../../../../domain/shared/types";
import { AuthenticatedRequest } from "../../types/AuthRequest";
import { DomainError } from "../../../../domain/shared/DomainError";

export class StartWorkController {
  constructor(
    private readonly startWorkService: StartWorkService
  ) {}

  async handle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // 🔒 Auth invariant: this route is protected
      if (!req.driverId) {
        throw new Error(
          "Invariant violation: authenticated request without driverId"
        );
      }

      const { workPeriodId, startTime } = req.body;

      await this.startWorkService.execute(
        req.driverId,                     // ✅ identity from JWT
        asWorkPeriodId(workPeriodId),
        new Date(startTime),
        new Date()
      );

      res.status(201).json({ status: "started" });
    } catch (error) {
      // Handle domain errors with 400 Bad Request
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
      // Let unexpected errors bubble up to global error handler
      throw error;
    }
  }
}
