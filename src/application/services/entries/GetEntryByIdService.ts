import { WorkPeriodRepository } from "../../ports/WorkPeriodRepository";
import { LeaveRepository } from "../../ports/LeaveRepository";
import { DriverId } from "../../../domain/shared/types";
import { AppLogger } from "../../ports/Logger";

export class GetEntryByIdService {
  constructor(
    private readonly workRepo: WorkPeriodRepository,
    private readonly leaveRepo: LeaveRepository,
    private readonly logger: AppLogger
  ) {}

  async execute(entryId: string, driverId: DriverId) {
    this.logger.info('GetEntryById invoked', {
      driverId,
      entryId,
    });

    try {
      // ---- Try WORK lookup ----
      const work =
        await this.workRepo.findById(entryId as any);

      if (work && work.driverId === driverId) {
        this.logger.info('GetEntryById found WORK', {
          driverId,
          entryId,
        });

        return {
          id: work.id,
          type: "WORK",
          startTime: work.declaredStartTime,
          endTime: work.declaredEndTime,
          createdAt: work.createdAt,
        };
      }

      // ---- Try LEAVE lookup ----
      const leave =
        await this.leaveRepo.findById(entryId as any);

      if (leave && leave.driverId === driverId) {
        this.logger.info('GetEntryById found LEAVE', {
          driverId,
          entryId,
        });

        return {
          id: leave.id,
          type: "LEAVE",
          startTime: leave.declaredStartTime,
          endTime: leave.declaredEndTime,
          createdAt: leave.createdAt,
        };
      }

      this.logger.warn('GetEntryById not found', {
        driverId,
        entryId,
      });

      return null;
    } catch (err) {
      this.logger.error('GetEntryById failed unexpectedly', {
        driverId,
        entryId,
        error: err,
      });
      throw err;
    }
  }
}
