import { transactionContext } from "../prisma/transactionContext";
import { ShiftTransferRepository } from "../../application/ports/ShiftTransferRepository";
import { ShiftTransferEvent } from "../../domain/transfer/ShiftTransferEvent";
import { DriverId, WorkPeriodId } from "../../domain/shared/types";
import { TimeRange } from "../../domain/shared/TimeRange";
import { DomainError } from "../../domain/shared/DomainError";
import { Prisma } from "../../generated/prisma/client";

export class PrismaShiftTransferRepository
  implements ShiftTransferRepository
{
  async save(event: ShiftTransferEvent): Promise<void> {
    try {
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
    } catch (error) {
      // Translate Prisma infrastructure errors to DomainErrors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          // Foreign key constraint violation
          throw new DomainError(
            'WORK_PERIOD_NOT_FOUND',
            'Cannot transfer non-existent work period'
          );
        }
        if (error.code === 'P2007') {
          // Invalid input syntax (e.g., malformed UUID)
          throw new DomainError(
            'INVALID_WORK_PERIOD_ID',
            'Invalid work period identifier format'
          );
        }
      }
      // Re-throw unexpected errors
      throw error;
    }
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
