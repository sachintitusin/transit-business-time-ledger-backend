import { WorkPeriod } from '../../domain/work/WorkPeriod'
import { DriverId, WorkPeriodId } from '../../domain/shared/types'

export interface WorkPeriodRepository {
    findById(workPeriodId: WorkPeriodId): Promise<WorkPeriod | null>
    findOpenByDriver(driverId: DriverId): Promise<WorkPeriod | null>
    save(workPeriod: WorkPeriod): Promise<void>
}
