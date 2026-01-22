import { Response } from "express";
import { StartWorkService } from "../../../../application/services/work/StartWorkService";
import { asWorkPeriodId } from "../../../../domain/shared/types";
import { AuthenticatedRequest } from "../../types/AuthRequest";
import { DomainError } from "../../../../domain/shared/DomainError";


export class StartWorkController {
  constructor(
    private readonly startWorkService: StartWorkService
  ) { }


  async handle(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log("start work controller called")
    try {
      // 🔒 Auth invariant: this route is protected
      if (!req.driverId) {
        throw new Error(
          "Invariant violation: authenticated request without driverId"
        );
      }


      const { workPeriodId: clientWorkPeriodId, startTime } = req.body;
      const workPeriodId = asWorkPeriodId(clientWorkPeriodId);


      await this.startWorkService.execute(
        req.driverId,
        workPeriodId,
        new Date(startTime),
        new Date()
      );


      res.status(201).json({ workPeriodId });


    } catch (error) {
      // Handle domain errors with 400 Bad Request
      if (error instanceof DomainError) {
        const statusCode = this.mapErrorToHttpStatus(error.code);
        res.status(statusCode).json({
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

  private mapErrorToHttpStatus(errorCode: string): number {
    switch (errorCode) {
      case 'WORK_PERIOD_UNAUTHORIZED':
        return 403;
      case 'ACTIVE_WORK_PERIOD_ALREADY_EXISTS':
        return 400;
      default:
        return 400;
    }
  }
}
