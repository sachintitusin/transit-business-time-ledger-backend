import {
  EntryProjectionRepository,
  EntryProjectionRecord,
} from '../../src/application/ports/EntryProjectionRepository'
import { DriverId } from '../../src/domain/shared/types'

export class InMemoryEntryProjectionRepository
  implements EntryProjectionRepository {

  private store = new Map<string, EntryProjectionRecord>()

  async findById(
    entryId: string,
    driverId: DriverId
  ): Promise<EntryProjectionRecord | null> {
    const record = this.store.get(entryId)
    if (!record) return null
    return record.driverId === driverId ? record : null
  }

  async findManyByDriver(
    driverId: DriverId,
    params?: { from?: Date; to?: Date }
  ): Promise<EntryProjectionRecord[]> {
    return Array.from(this.store.values()).filter(r => {
      if (r.driverId !== driverId) return false
      if (params?.from && r.effectiveStartTime < params.from) return false
      if (params?.to && r.effectiveEndTime && r.effectiveEndTime > params.to) return false
      return true
    })
  }

  async save(record: EntryProjectionRecord): Promise<void> {
    this.store.set(record.id, record)
  }
}
