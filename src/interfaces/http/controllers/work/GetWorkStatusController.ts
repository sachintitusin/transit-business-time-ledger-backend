import { Response } from "express";
import { AuthenticatedRequest } from "../../types/AuthRequest";
import { GetWorkStatusService } from "../../../../domain/work/GetWorkStatusService";

export class GetWorkStatusController {
  constructor(
    private readonly service: GetWorkStatusService
  ) {}

  async handle(req: AuthenticatedRequest, res: Response) {
    const driverId = req.driverId!;
    const result = await this.service.execute(driverId);
    res.status(200).json(result);
  }
}
