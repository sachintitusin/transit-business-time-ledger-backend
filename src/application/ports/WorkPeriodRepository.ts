import { WorkPeriod } from '../../domain/work/WorkPeriod'
import { DriverId, WorkPeriodId } from '../../domain/shared/types'

export interface WorkPeriodRepository {
    findById(workPeriodId: WorkPeriodId): Promise<WorkPeriod | null>
    findByDriver(driverId: DriverId): Promise<WorkPeriod[]>
    findOpenByDriver(driverId: DriverId): Promise<WorkPeriod | null>
    findClosedByDriver(driverId: DriverId): Promise<WorkPeriod[]>
    save(workPeriod: WorkPeriod): Promise<void>
}
