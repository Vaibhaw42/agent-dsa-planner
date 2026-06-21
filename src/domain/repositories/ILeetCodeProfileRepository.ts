import type { LeetCodeProfile } from '../entities/LeetCodeProfile'
import type { UserId } from '../value-objects/UserId'

export interface ILeetCodeProfileRepository {
  findByUserId(userId: UserId): Promise<LeetCodeProfile | null>
  findByUsername(username: string): Promise<LeetCodeProfile | null>
  save(profile: LeetCodeProfile): Promise<LeetCodeProfile>
  updateLastSynced(id: string, at: Date): Promise<void>
}
