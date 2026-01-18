import { WorkPeriodRepository } from "../../ports/WorkPeriodRepository";
import { WorkCorrectionRepository } from "../../ports/WorkCorrectionRepository";
import { LeaveRepository } from "../../ports/LeaveRepository";
import { LeaveCorrectionRepository } from "../../ports/LeaveCorrectionRepository";
import { DriverId } from "../../../domain/shared/types";
import { EffectiveWorkTime } from "../../../domain/work/EffectiveWorkTime";
import { EffectiveLeaveTime } from "../../../domain/leave/EffectiveLeaveTime";
import { AppLogger } from "../../ports/Logger";
import { DomainError } from "../../../domain/shared/DomainError";

type DayKey = string;

const MAX_RANGE_DAYS = 90;

export class GetDailyAnalyticsService {
  constructor(
    private readonly workRepo: WorkPeriodRepository,
    private readonly workCorrectionRepo: WorkCorrectionRepository,
    private readonly leaveRepo: LeaveRepository,
    private readonly leaveCorrectionRepo: LeaveCorrectionRepository,
    private readonly logger: AppLogger
  ) {}

  async execute(command: {
    driverId: DriverId;
    from: Date;
    to: Date;
  }) {
    const { driverId, from, to } = command;

    this.logger.info("GetDailyAnalytics invoked", {
      driverId,
      from,
      to,
    });

    // ---------------- VALIDATION ----------------
    if (from >= to) {
      throw new DomainError(
        "INVALID_DATE_RANGE",
        "`from` must be before `to`"
      );
    }

    const diffDays =
      (to.getTime() - from.getTime()) /
      (1000 * 60 * 60 * 24);

    if (diffDays > MAX_RANGE_DAYS) {
      throw new DomainError(
        "DATE_RANGE_TOO_LARGE",
        `Maximum allowed range is ${MAX_RANGE_DAYS} days`
      );
    }

    // ---------------- AGGREGATION ----------------
    const days = new Map<
      DayKey,
      { workMinutes: number; leaveMinutes: number }
    >();

    // -------- WORK --------
    const workPeriods =
      await this.workRepo.findByDriver(driverId);

    for (const work of workPeriods) {
      if (!work.declaredEndTime) continue;

      const corrections =
        await this.workCorrectionRepo.findByWorkPeriodId(work.id);

      const effective =
        EffectiveWorkTime.from(work, corrections);

      this.allocateRange(
        effective.range.start,
        effective.range.end,
        from,
        to,
        days,
        "workMinutes"
      );
    }

    // -------- LEAVE --------
    const leaves =
      await this.leaveRepo.findByDriver(driverId);

    for (const leave of leaves) {
      const corrections =
        await this.leaveCorrectionRepo.findByLeaveId(leave.id);

      const effective =
        EffectiveLeaveTime.from(leave, corrections);

      this.allocateRange(
        effective.range.start,
        effective.range.end,
        from,
        to,
        days,
        "leaveMinutes"
      );
    }

    // ---------------- FINAL SHAPE ----------------
    const result = [...days.entries()]
      .map(([date, v]) => ({
        date,
        workMinutes: v.workMinutes,
        leaveMinutes: v.leaveMinutes,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const summary = {
      totalWorkMinutes: result.reduce(
        (sum, d) => sum + d.workMinutes,
        0
      ),
      totalLeaveMinutes: result.reduce(
        (sum, d) => sum + d.leaveMinutes,
        0
      ),
      totalDays: result.length,
    };

    this.logger.info("GetDailyAnalytics succeeded", {
      driverId,
      summary,
    });

    return {
      days: result,
      summary,
    };
  }

  // ---------------- helpers ----------------
  private allocateRange(
    start: Date,
    end: Date,
    from: Date,
    to: Date,
    bucket: Map<DayKey, any>,
    key: "workMinutes" | "leaveMinutes"
  ) {
    let cursor = start < from ? from : start;
    const hardEnd = end > to ? to : end;

    while (cursor < hardEnd) {
      const dayStart = new Date(
        Date.UTC(
          cursor.getUTCFullYear(),
          cursor.getUTCMonth(),
          cursor.getUTCDate()
        )
      );

      const nextDay = new Date(dayStart);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      const segmentEnd =
        hardEnd < nextDay ? hardEnd : nextDay;

      const minutes =
        (segmentEnd.getTime() - cursor.getTime()) / 60000;

      const dateKey =
        dayStart.toISOString().slice(0, 10);

      const entry =
        bucket.get(dateKey) ?? {
          workMinutes: 0,
          leaveMinutes: 0,
        };

      entry[key] += minutes;
      bucket.set(dateKey, entry);

      cursor = segmentEnd;
    }
  }
}
