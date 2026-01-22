import { EntryProjectionRepository, EntryProjectionRecord } from "../../application/ports/EntryProjectionRepository";
import { DriverId, asDriverId } from "../../domain/shared/types";
import { transactionContext } from "../prisma/transactionContext";
import { EntryType } from "../../application/projections/EntryType";
import { EntrySourceType } from "../../application/projections/EntrySourceType";

export class PrismaEntryProjectionRepository
  implements EntryProjectionRepository {
  async findById(
    entryId: string,
    driverId: DriverId
  ): Promise<EntryProjectionRecord | null> {
    const db = transactionContext.get();

    const row = await db.entryProjection.findFirst({
      where: {
        id: entryId,
        driverId: driverId,
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      driverId: asDriverId(row.driverId),
      type: row.type as EntryType,

      effectiveStartTime: row.effectiveStartTime,
      effectiveEndTime: row.effectiveEndTime,

      sourceId: row.sourceId,
      sourceType: row.sourceType as EntrySourceType,

      createdAt: row.createdAt,
    };
  }

  async findManyByDriver(
    driverId: DriverId,
    params?: {
      from?: Date;
      to?: Date;
    }
  ): Promise<EntryProjectionRecord[]> {
    const db = transactionContext.get();

    const rows = await db.entryProjection.findMany({
      where: {
        driverId: driverId,
        ...(params?.from && {
          effectiveStartTime: { gte: params.from },
        }),
        ...(params?.to && {
          effectiveEndTime: { lte: params.to },
        }),
      },
      orderBy: {
        effectiveStartTime: "desc",
      },
    });

    return rows.map((row) => ({
      id: row.id,
      driverId: asDriverId(row.driverId),
      type: row.type as EntryType,

      effectiveStartTime: row.effectiveStartTime,
      effectiveEndTime: row.effectiveEndTime,

      sourceId: row.sourceId,
      sourceType: row.sourceType as EntrySourceType,

      createdAt: row.createdAt,
    }));
  }

  async save(record: EntryProjectionRecord): Promise<void> {
    const db = transactionContext.get();

    await db.entryProjection.upsert({
      where: { id: record.id },
      update: {
        driverId: record.driverId,
        type: record.type,
        effectiveStartTime: record.effectiveStartTime,
        effectiveEndTime: record.effectiveEndTime,
        sourceId: record.sourceId,
        sourceType: record.sourceType,
      },
      create: {
        id: record.id,
        driverId: record.driverId,
        type: record.type,
        effectiveStartTime: record.effectiveStartTime,
        effectiveEndTime: record.effectiveEndTime,
        sourceId: record.sourceId,
        sourceType: record.sourceType,
        createdAt: record.createdAt,
      },
    });
  }
}
