import { Response } from "express";
import { AuthenticatedRequest } from "../../types/AuthRequest";
import { GetEntryByIdService } from "../../../../application/services/entries/GetEntryByIdService";

export class GetEntryByIdController {
  constructor(
    private readonly service: GetEntryByIdService
  ) {}

  async handle(req: AuthenticatedRequest, res: Response) {
    const driverId = req.driverId!;
    const idParam = req.params.id;

    if (typeof idParam !== "string") {
      return res.status(400).json({
        error: {
          code: "INVALID_ENTRY_ID",
          message: "Entry id must be a string",
        },
      });
    }

    const entry = await this.service.execute(
      idParam,
      driverId
    );

    if (!entry) {
      return res.status(404).json({
        error: {
          code: "ENTRY_NOT_FOUND",
          message: "Entry not found",
        },
      });
    }

    res.status(200).json(entry);
  }
}
