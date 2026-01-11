import { WorkPeriod } from '../../domain/work/WorkPeriod'
import { DriverId } from '../../domain/shared/types'

export interface WorkPeriodRepository {
  findOpenByDriver(driverId: DriverId): Promise<WorkPeriod | null>
  save(workPeriod: WorkPeriod): Promise<void>
}
