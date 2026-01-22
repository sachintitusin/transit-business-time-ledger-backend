import { EntryProjectionRepository, EntryType } from "../../ports/EntryProjectionRepository";
import { DriverId } from "../../../domain/shared/types";
import { AppLogger } from "../../ports/Logger";

type EntryResponse = {
  id: string;
  type: EntryType;
  startTime: Date;
  endTime: Date | null;
  status: "OPEN" | "CLOSED";
  createdAt: Date;
};

export class GetEntryByIdService {
  constructor(
    private readonly entryProjectionRepo: EntryProjectionRepository,
    private readonly logger: AppLogger
  ) { }

  async execute(
    entryId: string,
    driverId: DriverId
  ): Promise<EntryResponse | null> {
    this.logger.info("GetEntryById invoked", {
      entryId,
      driverId,
    });

    const record =
      await this.entryProjectionRepo.findById(
        entryId,
        driverId
      );

    if (!record) {
      this.logger.warn("GetEntryById not found", {
        entryId,
        driverId,
      });
      return null;
    }

    const entry: EntryResponse = {
      id: record.id,
      type: record.type,

      startTime: record.effectiveStartTime,
      endTime: record.effectiveEndTime,

      status:
        record.type === "WORK" && record.effectiveEndTime === null
          ? "OPEN"
          : "CLOSED",

      createdAt: record.createdAt,
    };

    this.logger.info("GetEntryById succeeded", {
      entryId,
      driverId,
      type: entry.type,
    });

    return entry;
  }
}
