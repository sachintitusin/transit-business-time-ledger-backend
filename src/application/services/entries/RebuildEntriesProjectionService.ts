import { DbClient } from "../../../infrastructure/prisma/dbClient";

type EntryType = "WORK" | "LEAVE";
type SourceType = "work_period" | "leave_event";

/**
 * Rebuilds the entries_projection table from immutable source tables.
 *
 * IMPORTANT:
 * - This service MUST be executed inside a transaction.
 * - Caller is responsible for transaction boundary.
 */
export class RebuildEntriesProjectionService {
  async execute(db: DbClient): Promise<void> {
    await this.clearProjection(db);
    await this.rebuildWorkEntries(db);
    await this.rebuildLeaveEntries(db);
  }

  /**
   * Step 0: Clear projection
   * Safe because projection is fully rebuildable.
   */
  private async clearProjection(db: DbClient): Promise<void> {
    await db.entryProjection.deleteMany();
  }

  /**
   * Step 1: Rebuild WORK entries
   */
  private async rebuildWorkEntries(db: DbClient): Promise<void> {
    const workPeriods = await db.workPeriod.findMany({
      include: {
        corrections: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const projections = workPeriods.map((wp) => {
      const latestCorrection = wp.corrections[0];

      const effectiveStartTime =
        latestCorrection?.correctedStartTime ?? wp.declaredStartTime;

      const effectiveEndTime =
        latestCorrection?.correctedEndTime ?? wp.declaredEndTime;

      // Domain invariant safety check
      if (
        effectiveEndTime &&
        effectiveEndTime <= effectiveStartTime
      ) {
        throw new Error(
          `Invariant violation in WORK ${wp.id}: effectiveEndTime <= effectiveStartTime`
        );
      }

      return {
        id: wp.id,
        driverId: wp.driverId,
        type: "WORK" as EntryType,

        effectiveStartTime,
        effectiveEndTime,

        sourceId: wp.id,
        sourceType: "work_period" as SourceType,

        createdAt: wp.createdAt,
        updatedAt: latestCorrection?.createdAt ?? wp.createdAt,
      };
    });

    if (projections.length > 0) {
      await db.entryProjection.createMany({
        data: projections,
      });
    }
  }

  /**
   * Step 2: Rebuild LEAVE entries
   */
  private async rebuildLeaveEntries(db: DbClient): Promise<void> {
    const leaveEvents = await db.leaveEvent.findMany({
      include: {
        corrections: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const projections = leaveEvents.map((le) => {
      const latestCorrection = le.corrections[0];

      const effectiveStartTime =
        latestCorrection?.correctedStartTime ?? le.declaredStartTime;

      const effectiveEndTime =
        latestCorrection?.correctedEndTime ?? le.declaredEndTime;

      // Domain invariant safety check
      if (effectiveEndTime <= effectiveStartTime) {
        throw new Error(
          `Invariant violation in LEAVE ${le.id}: effectiveEndTime <= effectiveStartTime`
        );
      }

      return {
        id: le.id,
        driverId: le.driverId,
        type: "LEAVE" as EntryType,

        effectiveStartTime,
        effectiveEndTime,

        sourceId: le.id,
        sourceType: "leave_event" as SourceType,

        createdAt: le.createdAt,
        updatedAt: latestCorrection?.createdAt ?? le.createdAt,
      };
    });

    if (projections.length > 0) {
      await db.entryProjection.createMany({
        data: projections,
      });
    }
  }
}
