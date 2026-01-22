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

export class GetEntriesService {
  constructor(
    private readonly entryProjectionRepo: EntryProjectionRepository,
    private readonly logger: AppLogger
  ) { }

  async execute(input: {
    driverId: DriverId;
    range?: { from: Date; to: Date };
  }): Promise<{ entries: EntryResponse[] }> {
    const { driverId, range } = input;

    this.logger.info("GetEntries invoked", {
      driverId,
      range,
    });

    const records =
      await this.entryProjectionRepo.findManyByDriver(
        driverId,
        range
      );

    const entries: EntryResponse[] = records.map((r) => ({
      id: r.id,
      type: r.type,

      startTime: r.effectiveStartTime,
      endTime: r.effectiveEndTime,

      status:
        r.type === "WORK" && r.effectiveEndTime === null
          ? ("OPEN" as const)
          : ("CLOSED" as const),

      createdAt: r.createdAt,
    }));


    this.logger.info("GetEntries succeeded", {
      driverId,
      count: entries.length,
    });

    return { entries };
  }
}
