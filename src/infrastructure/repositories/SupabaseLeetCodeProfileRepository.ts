import { eq } from 'drizzle-orm'
import type { LeetCodeProfile } from '@/domain/entities/LeetCodeProfile'
import { createLeetCodeProfile } from '@/domain/entities/LeetCodeProfile'
import type { ILeetCodeProfileRepository } from '@/domain/repositories/ILeetCodeProfileRepository'
import type { UserId } from '@/domain/value-objects/UserId'
import type { DrizzleClient } from '../db/client'
import { leetcodeProfiles } from '../db/schema'

export class SupabaseLeetCodeProfileRepository implements ILeetCodeProfileRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findByUserId(userId: UserId): Promise<LeetCodeProfile | null> {
    const rows = await this.db
      .select()
      .from(leetcodeProfiles)
      .where(eq(leetcodeProfiles.userId, userId as string))
      .limit(1)

    if (rows.length === 0) return null
    return this.toDomain(rows[0]!)
  }

  async findByUsername(username: string): Promise<LeetCodeProfile | null> {
    const rows = await this.db
      .select()
      .from(leetcodeProfiles)
      .where(eq(leetcodeProfiles.username, username.toLowerCase()))
      .limit(1)

    if (rows.length === 0) return null
    return this.toDomain(rows[0]!)
  }

  async save(profile: LeetCodeProfile): Promise<LeetCodeProfile> {
    await this.db
      .insert(leetcodeProfiles)
      .values({
        id: profile.id,
        userId: profile.userId as string,
        username: profile.username,
        isVerified: profile.isVerified,
        isPublic: profile.isPublic,
        lastSyncedAt: profile.lastSyncedAt,
      })
      .onConflictDoUpdate({
        target: leetcodeProfiles.id,
        set: {
          isVerified: profile.isVerified,
          isPublic: profile.isPublic,
          lastSyncedAt: profile.lastSyncedAt,
        },
      })

    return profile
  }

  async updateLastSynced(id: string, at: Date): Promise<void> {
    await this.db
      .update(leetcodeProfiles)
      .set({ lastSyncedAt: at })
      .where(eq(leetcodeProfiles.id, id))
  }

  private toDomain(row: typeof leetcodeProfiles.$inferSelect): LeetCodeProfile {
    return createLeetCodeProfile({
      id: row.id,
      userId: row.userId,
      username: row.username,
      isVerified: row.isVerified,
      isPublic: row.isPublic,
      createdAt: row.createdAt,
      lastSyncedAt: row.lastSyncedAt,
    })
  }
}
