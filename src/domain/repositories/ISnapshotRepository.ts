import type { DailySnapshot } from '../entities/DailySnapshot'
import type { UserId } from '../value-objects/UserId'
import type { DateRange } from '../value-objects/DateRange'

export interface ISnapshotRepository {
  findById(id: string): Promise<DailySnapshot | null>
  findByUserId(userId: UserId, range?: DateRange): Promise<DailySnapshot[]>
  findLatestByUserId(userId: UserId): Promise<DailySnapshot | null>
  save(snapshot: DailySnapshot): Promise<DailySnapshot>
}
