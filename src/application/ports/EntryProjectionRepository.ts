import { DriverId } from "../../domain/shared/types";
import { EntryType } from "../projections/EntryType";
import { EntrySourceType } from "../projections/EntrySourceType";

export type { EntryType };

export type EntryProjectionRecord = {
  id: string;                    // Entry ID (WorkPeriod.id or LeaveEvent.id)
  driverId: DriverId;
  type: EntryType;

  effectiveStartTime: Date;
  effectiveEndTime: Date | null;

  sourceId: string;
  sourceType: EntrySourceType;

  createdAt: Date;
};

export interface EntryProjectionRepository {
  findById(
    entryId: string,
    driverId: DriverId
  ): Promise<EntryProjectionRecord | null>;

  findManyByDriver(
    driverId: DriverId,
    params?: {
      from?: Date;
      to?: Date;
    }
  ): Promise<EntryProjectionRecord[]>;

  save(record: EntryProjectionRecord): Promise<void>;
}
