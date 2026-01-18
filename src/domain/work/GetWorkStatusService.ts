import { WorkPeriodRepository } from "../../application/ports/WorkPeriodRepository";
import { DriverId } from "../shared/types";


export class GetWorkStatusService {
  constructor(
    private readonly workPeriodRepository: WorkPeriodRepository
  ) {}

  async execute(driverId: DriverId) {
    const openWork =
      await this.workPeriodRepository.findOpenByDriver(driverId);

    if (!openWork) {
      return {
        status: "CLOSED",
        activeWorkPeriod: null,
      };
    }

    return {
      status: "OPEN",
      activeWorkPeriod: {
        workPeriodId: openWork.id,
        startedAt: openWork.declaredStartTime,
      },
    };
  }
}
