import { Response } from "express";
import { AuthenticatedRequest } from "../../types/AuthRequest";
import { GetEntriesService } from "../../../../application/services/entries/GetEntriesService";

export class GetEntriesController {
  constructor(
    private readonly service: GetEntriesService
  ) {}

    async handle(req: AuthenticatedRequest, res: Response) {
    const driverId = req.driverId!;
    const { from, to } = req.query;

    let range;
    if (typeof from === "string" && typeof to === "string") {
        range = {
        from: new Date(from),
        to: new Date(to),
        };
    }

    const result = await this.service.execute({
        driverId,
        range,
    });

    res.status(200).json(result);
    }

}
