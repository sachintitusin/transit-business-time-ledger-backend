import { Response } from "express";
import { AuthenticatedRequest } from "../../types/AuthRequest";
import { GetEntriesService } from "../../../../application/services/entries/GetEntriesService";

export class GetEntriesController {
  constructor(
    private readonly service: GetEntriesService
  ) {}

  async handle(req: AuthenticatedRequest, res: Response) {
    const driverId = req.driverId!;
    const result = await this.service.execute(driverId);
    res.status(200).json(result);
  }
}
