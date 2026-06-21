import type { Recommendation } from '../entities/Recommendation'
import type { UserId } from '../value-objects/UserId'

export interface IRecommendationRepository {
  findActiveByUserId(userId: UserId): Promise<Recommendation[]>
  save(rec: Recommendation): Promise<Recommendation>
  saveBatch(recs: Recommendation[]): Promise<Recommendation[]>
  markCompleted(id: string): Promise<void>
}
