import { transactionContext } from "../prisma/transactionContext";
import { WorkCorrectionRepository } from "../../application/ports/WorkCorrectionRepository";
import { WorkCorrection } from "../../domain/work/WorkCorrection";
import { WorkPeriodId } from "../../domain/shared/types";

export class PrismaWorkCorrectionRepository
  implements WorkCorrectionRepository
{
  async findByWorkPeriodId(
    workPeriodId: WorkPeriodId
  ): Promise<WorkCorrection[]> {
    const rows = await transactionContext.get().workCorrection.findMany({
      where: { workPeriodId: workPeriodId as any },
      orderBy: { createdAt: "desc" }, // latest correction first
    });

    return rows.map((r) =>
      // IMPORTANT:
      // Your domain intentionally does NOT expose reconstitute()
      // for WorkCorrection. Corrections are only ever created via `create()`
      // in application services. Repository only returns historical facts
      // already validated at creation time.
      //
      // Therefore, we must reconstruct using the private constructor path
      // that TypeScript allows via structural typing.
      new (WorkCorrection as any)(
        r.id as any,
        r.workPeriodId as any,
        r.correctedStartTime,
        r.correctedEndTime,
        r.reason ?? undefined,
        r.createdAt
      )
    );
  }

  async save(correction: WorkCorrection): Promise<void> {
    await transactionContext.get().workCorrection.create({
      data: {
        id: correction.id as any,
        workPeriodId: correction.workPeriodId as any,
        correctedStartTime: correction.correctedStartTime,
        correctedEndTime: correction.correctedEndTime,
        reason: correction.reason,
        createdAt: correction.createdAt,
      },
    });
  }
}
