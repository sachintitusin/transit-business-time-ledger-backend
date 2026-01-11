import { transactionContext } from "../prisma/transactionContext";

import { WorkPeriodRepository } from "../../application/ports/WorkPeriodRepository";
import { WorkPeriod } from "../../domain/work/WorkPeriod";
import {
  WorkPeriodStatus as DomainWorkPeriodStatus,
} from "../../domain/work/WorkPeriodStatus";
import { DriverId, WorkPeriodId } from "../../domain/shared/types";

export class PrismaWorkPeriodRepository implements WorkPeriodRepository {

  async findById(workPeriodId: WorkPeriodId): Promise<WorkPeriod | null> {
    const row = await transactionContext.get().workPeriod.findUnique({
      where: { id: workPeriodId as any },
    });

    if (!row) return null;
    return this.reconstitute(row);
  }

  async findOpenByDriver(driverId: DriverId): Promise<WorkPeriod | null> {
    const row = await transactionContext.get().workPeriod.findFirst({
      where: {
        driverId: driverId as any,
        status: "OPEN",
      },
    });

    if (!row) return null;
    return this.reconstitute(row);
  }

  async findClosedByDriver(driverId: DriverId): Promise<WorkPeriod[]> {
    const rows = await transactionContext.get().workPeriod.findMany({
      where: {
        driverId: driverId as any,
        status: "CLOSED",
      },
      orderBy: { declaredStartTime: "asc" },
    });

    return rows.map((r) => this.reconstitute(r));
  }

  /**
   * Persistence rules:
   * - Create exactly once (OPEN)
   * - Allow transition OPEN → CLOSED
   * - CLOSED is immutable forever
   */
  async save(workPeriod: WorkPeriod): Promise<void> {
    const existing = await transactionContext.get().workPeriod.findUnique({
      where: { id: workPeriod.id as any },
    });

    // 1️⃣ First persistence (OPEN)
    if (!existing) {
      await transactionContext.get().workPeriod.create({
        data: {
          id: workPeriod.id as any,
          driverId: workPeriod.driverId as any,
          declaredStartTime: workPeriod.declaredStartTime,
          status: "OPEN",
          createdAt: workPeriod.createdAt,
        },
      });
      return;
    }

    // 2️⃣ Valid transition: OPEN → CLOSED
    if (
      existing.status === "OPEN" &&
      workPeriod.status === DomainWorkPeriodStatus.CLOSED
    ) {
      await transactionContext.get().workPeriod.update({
        where: {
          id: workPeriod.id as any,
          status: "OPEN", // DB-level guard
        },
        data: {
          declaredEndTime: workPeriod.declaredEndTime,
          status: "CLOSED",
        },
      });
      return;
    }

    // 3️⃣ Everything else is illegal
    throw new Error(
      "Invariant violation: cannot modify a closed work period"
    );
  }

  // ------------------------------------------------------------------
  // Reconstitution (infra-only, trusted historical data)
  // ------------------------------------------------------------------

  private reconstitute(row: {
    id: string;
    driverId: string;
    declaredStartTime: Date;
    declaredEndTime: Date | null;
    status: string;
    createdAt: Date;
  }): WorkPeriod {

    const wp = new (WorkPeriod as any)(
      row.id as any,
      row.driverId as any,
      row.declaredStartTime,
      row.createdAt
    );

    if (row.status === "CLOSED") {
      (wp as any)._declaredEndTime = row.declaredEndTime;
      (wp as any)._status = DomainWorkPeriodStatus.CLOSED;
    } else {
      (wp as any)._status = DomainWorkPeriodStatus.OPEN;
    }

    return wp;
  }
}
