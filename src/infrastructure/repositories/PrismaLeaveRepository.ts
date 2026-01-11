import { transactionContext } from "../prisma/transactionContext";
import { LeaveRepository } from "../../application/ports/LeaveRepository";
import { LeaveEvent } from "../../domain/leave/LeaveEvent";
import { DriverId, LeaveId } from "../../domain/shared/types";

export class PrismaLeaveRepository implements LeaveRepository {

  async findByDriver(driverId: DriverId): Promise<LeaveEvent[]> {
    const rows = await transactionContext.get().leaveEvent.findMany({
      where: { driverId: driverId as any },
      orderBy: { declaredStartTime: "asc" },
    });

    return rows.map((r) =>
      LeaveEvent.reconstitute(
        r.id as any,
        r.driverId as any,
        r.declaredStartTime,
        r.declaredEndTime,
        r.createdAt,
        r.leaveType ?? undefined
      )
    );
  }

  async findById(leaveId: LeaveId): Promise<LeaveEvent | null> {
    const r = await transactionContext.get().leaveEvent.findUnique({
      where: { id: leaveId as any },
    });

    if (!r) return null;

    return LeaveEvent.reconstitute(
      r.id as any,
      r.driverId as any,
      r.declaredStartTime,
      r.declaredEndTime,
      r.createdAt,
      r.leaveType ?? undefined
    );
  }

  async save(leave: LeaveEvent): Promise<void> {
    await transactionContext.get().leaveEvent.create({
      data: {
        id: leave.id as any,
        driverId: leave.driverId as any,
        declaredStartTime: leave.declaredStartTime,
        declaredEndTime: leave.declaredEndTime,
        leaveType: leave.leaveType,
        createdAt: leave.createdAt,
      },
    });
  }
}
