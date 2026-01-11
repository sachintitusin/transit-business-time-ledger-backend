import { TimeRange } from "../shared/TimeRange";
import { WorkPeriod } from "../work/WorkPeriod";
import { WorkCorrection } from "../work/WorkCorrection";
import { EffectiveWorkTime } from "../work/EffectiveWorkTime";
import { WorkPeriodId } from "../shared/types";

export class WorkSummary {
  static calculate(
    range: TimeRange,
    workPeriods: WorkPeriod[],
    correctionsByWorkPeriod: Map<WorkPeriodId, WorkCorrection[]>
  ): { totalHours: number } {
    let totalMs = 0;

    for (const workPeriod of workPeriods) {
      if (!workPeriod.isClosed()) {
        continue; // OPEN work never counts
      }

      const corrections =
        correctionsByWorkPeriod.get(workPeriod.id) ?? [];

      const effectiveWork =
        EffectiveWorkTime.from(workPeriod, corrections);

      if (!range.overlaps(effectiveWork.range)) {
        continue;
      }

      const overlap = range.intersect(effectiveWork.range);
      totalMs += overlap.durationMs();
    }

    return {
      totalHours: totalMs / (1000 * 60 * 60),
    };
  }
}
