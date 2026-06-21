import { and, eq, gt } from 'drizzle-orm'
import { createId } from '@/shared/utils/id'
import type { Recommendation, RecommendationType } from '@/domain/entities/Recommendation'
import type { IRecommendationRepository } from '@/domain/repositories/IRecommendationRepository'
import type { UserId } from '@/domain/value-objects/UserId'
import type { DrizzleClient } from '../db/client'
import { recommendations } from '../db/schema'

export class SupabaseRecommendationRepository implements IRecommendationRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findActiveByUserId(userId: UserId): Promise<Recommendation[]> {
    const now = new Date()
    const rows = await this.db
      .select()
      .from(recommendations)
      .where(
        and(
          eq(recommendations.userId, userId as string),
          eq(recommendations.isCompleted, false),
          gt(recommendations.expiresAt, now),
        ),
      )
      .orderBy(recommendations.priority)

    return rows.map((r) => this.toDomain(r))
  }

  async save(rec: Recommendation): Promise<Recommendation> {
    await this.db
      .insert(recommendations)
      .values({
        id: rec.id,
        userId: rec.userId as string,
        type: rec.type,
        title: rec.title,
        description: rec.description,
        reasoning: rec.reasoning,
        priority: rec.priority,
        metadata: rec.metadata,
        isCompleted: rec.isCompleted,
        expiresAt: rec.expiresAt,
      })
      .onConflictDoNothing()
    return rec
  }

  async saveBatch(recs: Recommendation[]): Promise<Recommendation[]> {
    if (recs.length === 0) return []
    await this.db
      .insert(recommendations)
      .values(
        recs.map((rec) => ({
          id: rec.id,
          userId: rec.userId as string,
          type: rec.type,
          title: rec.title,
          description: rec.description,
          reasoning: rec.reasoning,
          priority: rec.priority,
          metadata: rec.metadata,
          isCompleted: rec.isCompleted,
          expiresAt: rec.expiresAt,
        })),
      )
      .onConflictDoNothing()
    return recs
  }

  async markCompleted(id: string): Promise<void> {
    await this.db
      .update(recommendations)
      .set({ isCompleted: true })
      .where(eq(recommendations.id, id))
  }

  private toDomain(row: typeof recommendations.$inferSelect): Recommendation {
    return {
      id: row.id,
      userId: row.userId as UserId,
      type: row.type as RecommendationType,
      title: row.title,
      description: row.description,
      reasoning: row.reasoning,
      priority: row.priority,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      isCompleted: row.isCompleted,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
    }
  }
}
