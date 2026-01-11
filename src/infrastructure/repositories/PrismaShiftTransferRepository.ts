import { transactionContext } from "../prisma/transactionContext";
import { ShiftTransferRepository } from "../../application/ports/ShiftTransferRepository";
import { ShiftTransferEvent } from "../../domain/transfer/ShiftTransferEvent";
import { DriverId, WorkPeriodId } from "../../domain/shared/types";
import { TimeRange } from "../../domain/shared/TimeRange";

export class PrismaShiftTransferRepository
  implements ShiftTransferRepository
{
  async save(event: ShiftTransferEvent): Promise<void> {
    await transactionContext.get().shiftTransferEvent.create({
      data: {
        id: event.id,
        driverId: event.toDriverId as any,
        transferredFromDriverId: event.fromDriverId as any,
        workPeriodId: event.workPeriodId as any,
        reason: event.reason,
        createdAt: event.createdAt,
      },
    });
  }

  async findByWorkPeriodId(
    workPeriodId: WorkPeriodId
  ): Promise<ShiftTransferEvent[]> {
    const rows = await transactionContext.get().shiftTransferEvent.findMany({
      where: { workPeriodId: workPeriodId as any },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((r) =>
      ShiftTransferEvent.reconstitute(
        r.id,
        r.workPeriodId as any,
        r.driverId as any,
        r.transferredFromDriverId as any,
        r.createdAt,
        r.reason ?? undefined
      )
    );
  }

  async findByDriver(
    driverId: DriverId
  ): Promise<ShiftTransferEvent[]> {
    const rows = await transactionContext.get().shiftTransferEvent.findMany({
      where: { driverId: driverId as any },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((r) =>
      ShiftTransferEvent.reconstitute(
        r.id,
        r.workPeriodId as any,
        r.driverId as any,
        r.transferredFromDriverId as any,
        r.createdAt,
        r.reason ?? undefined
      )
    );
  }

  async findByDriverAndRange(
    driverId: DriverId,
    range: TimeRange
  ): Promise<ShiftTransferEvent[]> {
    const rows = await transactionContext.get().shiftTransferEvent.findMany({
      where: {
        driverId: driverId as any,
        createdAt: {
          gte: range.start,
          lt: range.end,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((r) =>
      ShiftTransferEvent.reconstitute(
        r.id,
        r.workPeriodId as any,
        r.driverId as any,
        r.transferredFromDriverId as any,
        r.createdAt,
        r.reason ?? undefined
      )
    );
  }
}
