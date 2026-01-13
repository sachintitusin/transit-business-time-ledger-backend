import { Response } from "express";
import { CloseWorkService } from "../../../../application/services/work/CloseWorkService";
import { AuthenticatedRequest } from "../../types/AuthRequest";
import { DomainError } from "../../../../domain/shared/DomainError";

export class CloseWorkController {
  constructor(
    private readonly closeWorkService: CloseWorkService
  ) {}

  async handle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // 🔒 Auth invariant: this route is protected
      if (!req.driverId) {
        throw new Error(
          "Invariant violation: authenticated request without driverId"
        );
      }

      const { endTime } = req.body;

      await this.closeWorkService.execute(
        req.driverId,          // ✅ identity from JWT
        new Date(endTime)
      );

      res.status(200).json({ status: "closed" });
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
