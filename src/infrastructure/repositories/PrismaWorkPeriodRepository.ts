import { randomUUID } from "crypto";
import { transactionContext } from "../prisma/transactionContext";

import { WorkPeriodRepository } from "../../application/ports/WorkPeriodRepository";
import { WorkPeriod } from "../../domain/work/WorkPeriod";
import {
  WorkPeriodStatus as DomainWorkPeriodStatus,
} from "../../domain/work/WorkPeriodStatus";
import { DriverId, WorkPeriodId } from "../../domain/shared/types";
import { TimeRange } from "../../domain/shared/TimeRange";

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
      orderBy: { declaredStartTime: "asc" },
    });

    if (!row) return null;
    return this.reconstitute(row);
  }

    /**
   * I26 — No overlapping effective work periods
   * Returns CLOSED work periods whose *effective* time overlaps the given range.
   */
  async findEffectiveOverlapping(
    driverId: DriverId,
    range: TimeRange,
    excludeWorkId?: WorkPeriodId
  ): Promise<WorkPeriod[]> {
    const prisma = transactionContext.get();

    // ------------------------------------------------------------
    // 1️⃣ SQL-level prefilter (declared time only, indexed & fast)
    // ------------------------------------------------------------
    const candidates = await prisma.workPeriod.findMany({
      where: {
        driverId: (driverId as any).value ?? driverId, // ✅ primitive extraction
        status: "CLOSED",
        id: excludeWorkId
          ? { not: (excludeWorkId as any).value ?? excludeWorkId }
          : undefined,

        // existing_start < candidate_end
        declaredStartTime: { lt: range.end },

        // existing_end > candidate_start
        declaredEndTime: { gt: range.start },
      },
      include: {
        corrections: {
          orderBy: { createdAt: "desc" },
          take: 1, // ✅ latest correction only (atomic pair)
        },
      },
      take: 100, // safety valve
    });

    // Optional micro-optimization
    if (candidates.length === 0) return [];

    // ------------------------------------------------------------
    // 2️⃣ Effective-time overlap check (authoritative)
    // ------------------------------------------------------------
    return candidates
      .filter((row) => {
        // Defensive infra guard — CLOSED invariant breach
        if (!row.declaredStartTime || !row.declaredEndTime) return false;

        const correction = row.corrections[0];

        const effectiveStart =
          correction?.correctedStartTime ?? row.declaredStartTime;

        const effectiveEnd =
          correction?.correctedEndTime ?? row.declaredEndTime;

        // Defensive: corrupted effective range (fail-soft in infra)
        if (effectiveStart >= effectiveEnd) return false;

        return range.overlaps(
          TimeRange.create(effectiveStart, effectiveEnd)
        );
      })
      .map((row) =>
        this.reconstitute({
          id: row.id,
          driverId: row.driverId,
          declaredStartTime: row.declaredStartTime,
          declaredEndTime: row.declaredEndTime,
          status: row.status,
          createdAt: row.createdAt,
        })
      );
  }

  /**
   * NEW — required for LeaveCorrection overlap checks
   * Returns ALL work periods (OPEN + CLOSED) for a driver
   */
  async findByDriver(driverId: DriverId): Promise<WorkPeriod[]> {
    const rows = await transactionContext.get().workPeriod.findMany({
      where: {
        driverId: driverId as any,
      },
      orderBy: { declaredStartTime: "asc" },
    });

    return rows.map((r) => this.reconstitute(r));
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
    const prisma = transactionContext.get()

    let workPeriodId = workPeriod.id as any

    if (!workPeriodId) {
      workPeriodId = randomUUID()
      ;(workPeriod as any)._id = workPeriodId
    }

    const existing = await prisma.workPeriod.findUnique({
      where: { id: workPeriodId },
    })

    // ------------------------------------------------------------
    // 1️⃣ First persistence (OPEN only)
    // ------------------------------------------------------------
    if (!existing) {
      if (workPeriod.status !== DomainWorkPeriodStatus.OPEN) {
        throw new Error(
          'Invariant violation: initial persistence must be OPEN'
        )
      }

      await prisma.workPeriod.create({
        data: {
          id: workPeriodId,
          driverId: workPeriod.driverId as any,
          declaredStartTime: workPeriod.declaredStartTime,
          status: 'OPEN',
          createdAt: workPeriod.createdAt,
        },
      })
      return
    }

    // ------------------------------------------------------------
    // 2️⃣ OPEN → CLOSED (real transition)
    // ------------------------------------------------------------
    if (
      existing.status === 'OPEN' &&
      workPeriod.status === DomainWorkPeriodStatus.CLOSED
    ) {
      if (!workPeriod.declaredEndTime) {
        throw new Error(
          'Invariant violation: closing work without declaredEndTime'
        )
      }

      const result = await prisma.workPeriod.updateMany({
        where: { id: workPeriodId, status: 'OPEN' },
        data: {
          declaredEndTime: workPeriod.declaredEndTime,
          status: 'CLOSED',
        },
      })

      if (result.count !== 1) {
        throw new Error(
          'Invariant violation: failed OPEN → CLOSED transition'
        )
      }

      return
    }

    // ------------------------------------------------------------
    // 3️⃣ CLOSED → CLOSED (idempotent save, NO mutation)
    // ------------------------------------------------------------
    if (
      existing.status === 'CLOSED' &&
      workPeriod.status === DomainWorkPeriodStatus.CLOSED
    ) {
      return // ✅ allow silently
    }

    // ------------------------------------------------------------
    // 4️⃣ Everything else is illegal
    // ------------------------------------------------------------
    throw new Error(
      'Invariant violation: illegal work period mutation'
    )
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
