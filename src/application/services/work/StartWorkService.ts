import { v4 as uuidv4 } from 'uuid';
import { WorkPeriod } from '../../../domain/work/WorkPeriod';
import {
  ActiveWorkPeriodAlreadyExists,
} from '../../../domain/work/WorkPeriodErrors';
import { DriverId, WorkPeriodId, asWorkPeriodId } from '../../../domain/shared/types';
import { WorkPeriodRepository } from '../../ports/WorkPeriodRepository';
import { TransactionManager } from '../../ports/TransactionManager';

export class StartWorkService {
  constructor(
    private readonly workPeriodRepository: WorkPeriodRepository,
    private readonly transactionManager: TransactionManager
  ) {}

  async execute(
    driverId: DriverId,
    startTime: Date,
    now: Date
  ): Promise<WorkPeriodId> {
    return await this.transactionManager.run(async () => {
      const existing = await this.workPeriodRepository.findOpenByDriver(driverId);

      if (existing) {
        throw ActiveWorkPeriodAlreadyExists();
      }

      const rawId = uuidv4();
      const workPeriodId = asWorkPeriodId(rawId);  // ✅ Type-safe casting

      const workPeriod = WorkPeriod.start(
        workPeriodId,
        driverId,
        startTime,
        now
      );

      await this.workPeriodRepository.save(workPeriod);
      return workPeriodId;
    });
  }
}
