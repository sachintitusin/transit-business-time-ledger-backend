import { WorkPeriodRepository } from "../../ports/WorkPeriodRepository";
import { WorkCorrectionRepository } from "../../ports/WorkCorrectionRepository";
import { LeaveRepository } from "../../ports/LeaveRepository";
import { LeaveCorrectionRepository } from "../../ports/LeaveCorrectionRepository";
import { ShiftTransferRepository } from "../../ports/ShiftTransferRepository";
import { DriverId } from "../../../domain/shared/types";
import { AppLogger } from "../../ports/Logger";

export class GetEntriesService {
  constructor(
    private readonly workRepo: WorkPeriodRepository,
    private readonly workCorrectionRepo: WorkCorrectionRepository,
    private readonly leaveRepo: LeaveRepository,
    private readonly leaveCorrectionRepo: LeaveCorrectionRepository,
    private readonly transferRepo: ShiftTransferRepository,
    private readonly logger: AppLogger
  ) {}

  async execute(command: {
    driverId: DriverId;
    range?: {
      from: Date;
      to: Date;
    };
  }) {
    const { driverId, range } = command;

    this.logger.info("GetEntries invoked", {
      driverId,
      range,
    });

    try {
      // ---------------------------
      // WORK ENTRIES
      // ---------------------------
      const workPeriods =
        await this.workRepo.findByDriver(driverId);

      const workEntries = [];

      for (const work of workPeriods) {
        const corrections =
          await this.workCorrectionRepo.findByWorkPeriodId(work.id);

        const latestCorrection =
          corrections.length > 0
            ? corrections[corrections.length - 1]
            : null;

        workEntries.push({
          type: "WORK",
          id: work.id,
          startTime:
            latestCorrection?.correctedStartTime ??
            work.declaredStartTime,
          endTime:
            latestCorrection?.correctedEndTime ??
            work.declaredEndTime,
          status: work.status,
          createdAt: work.createdAt,
        });
      }

      // ---------------------------
      // LEAVE ENTRIES
      // ---------------------------
      const leaves =
        await this.leaveRepo.findByDriver(driverId);

      const leaveEntries = [];

      for (const leave of leaves) {
        const corrections =
          await this.leaveCorrectionRepo.findByLeaveId(leave.id);

        const latestCorrection =
          corrections.length > 0
            ? corrections[corrections.length - 1]
            : null;

        leaveEntries.push({
          type: "LEAVE",
          id: leave.id,
          startTime:
            latestCorrection?.correctedStartTime ??
            leave.declaredStartTime,
          endTime:
            latestCorrection?.correctedEndTime ??
            leave.declaredEndTime,
          createdAt: leave.createdAt,
        });
      }

      // ---------------------------
      // TRANSFER ENTRIES
      // ---------------------------
      const transfers =
        await this.transferRepo.findByDriver(driverId);

      const transferEntries = transfers.map(t => ({
        type: "TRANSFER",
        id: t.id,
        createdAt: t.createdAt,
        reason: t.reason ?? null,
      }));

      // ---------------------------
      // MERGE
      // ---------------------------
      let all = [
        ...workEntries,
        ...leaveEntries,
        ...transferEntries,
      ];

      // ---------------------------
      // OPTIONAL RANGE FILTER
      // ---------------------------
      if (range) {
        all = all.filter((e: any) => {
          const time = e.startTime ?? e.createdAt;
          const t = new Date(time).getTime();
          return (
            t >= range.from.getTime() &&
            t <= range.to.getTime()
          );
        });
      }

      // ---------------------------
      // SORT TIMELINE
      // ---------------------------
      all.sort((a: any, b: any) => {
        const ta = a.startTime ?? a.createdAt;
        const tb = b.startTime ?? b.createdAt;
        return new Date(ta).getTime() - new Date(tb).getTime();
      });

      this.logger.info("GetEntries succeeded", {
        driverId,
        totalEntries: all.length,
        workCount: workEntries.length,
        leaveCount: leaveEntries.length,
        transferCount: transferEntries.length,
      });

      return { entries: all };
    } catch (err) {
      this.logger.error("GetEntries failed unexpectedly", {
        driverId,
        error: err,
      });
      throw err;
    }
  }
}
