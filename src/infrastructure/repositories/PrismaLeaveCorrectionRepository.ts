import { transactionContext } from "../prisma/transactionContext";
import { LeaveCorrectionRepository } from "../../application/ports/LeaveCorrectionRepository";
import { LeaveCorrection } from "../../domain/leave/LeaveCorrection";
import { LeaveId } from "../../domain/shared/types";

export class PrismaLeaveCorrectionRepository
  implements LeaveCorrectionRepository
{
  async findByLeaveId(leaveId: LeaveId): Promise<LeaveCorrection[]> {
    const rows = await transactionContext.get().leaveCorrection.findMany({
      where: { leaveId: leaveId as any },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((r) =>
      LeaveCorrection.reconstitute(
        r.id as any,
        r.leaveId as any,
        r.correctedStartTime,
        r.correctedEndTime,
        r.createdAt,
        r.reason ?? undefined
      )
    );
  }

  async findByLeaveIds(leaveIds: LeaveId[]): Promise<LeaveCorrection[]> {
    if (leaveIds.length === 0) return [];

    const rows = await transactionContext.get().leaveCorrection.findMany({
      where: {
        leaveId: { in: leaveIds as any[] },
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((r) =>
      LeaveCorrection.reconstitute(
        r.id as any,
        r.leaveId as any,
        r.correctedStartTime,
        r.correctedEndTime,
        r.createdAt,
        r.reason ?? undefined
      )
    );
  }

  async save(correction: LeaveCorrection): Promise<void> {
    await transactionContext.get().leaveCorrection.create({
      data: {
        id: correction.id as any,
        leaveId: correction.leaveId as any,
        correctedStartTime: correction.correctedStartTime,
        correctedEndTime: correction.correctedEndTime,
        reason: correction.reason,
        createdAt: correction.createdAt,
      },
    });
  }
}
