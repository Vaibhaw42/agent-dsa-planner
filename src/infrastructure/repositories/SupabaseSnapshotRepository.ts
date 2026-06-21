import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import type { DailySnapshot, TopicProgress } from '@/domain/entities/DailySnapshot'
import { createDailySnapshot } from '@/domain/entities/DailySnapshot'
import type { ISnapshotRepository } from '@/domain/repositories/ISnapshotRepository'
import type { DateRange } from '@/domain/value-objects/DateRange'
import { MasteryScore } from '@/domain/value-objects/MasteryScore'
import type { UserId } from '@/domain/value-objects/UserId'
import type { DrizzleClient } from '../db/client'
import { dailySnapshots, topicSnapshots, topics } from '../db/schema'

export class SupabaseSnapshotRepository implements ISnapshotRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<DailySnapshot | null> {
    const rows = await this.db
      .select()
      .from(dailySnapshots)
      .where(eq(dailySnapshots.id, id))
      .limit(1)

    if (rows.length === 0) return null

    const topicRows = await this.db
      .select()
      .from(topicSnapshots)
      .where(eq(topicSnapshots.snapshotId, id))

    const slugMap = await this.buildSlugMap(topicRows.map((t) => t.topicId))
    return this.toDomain(rows[0]!, topicRows, slugMap)
  }

  async findByUserId(userId: UserId, range?: DateRange): Promise<DailySnapshot[]> {
    const conditions = [eq(dailySnapshots.userId, userId as string)]

    if (range) {
      conditions.push(gte(dailySnapshots.snapshotDate, range.from.toISOString().split('T')[0]!))
      conditions.push(lte(dailySnapshots.snapshotDate, range.to.toISOString().split('T')[0]!))
    }

    const rows = await this.db
      .select()
      .from(dailySnapshots)
      .where(and(...conditions))
      .orderBy(desc(dailySnapshots.snapshotDate))

    if (rows.length === 0) return []

    const snapshotIds = rows.map((r) => r.id)
    const allTopicRows = await this.db
      .select()
      .from(topicSnapshots)
      .where(inArray(topicSnapshots.snapshotId, snapshotIds))

    const slugMap = await this.buildSlugMap(allTopicRows.map((t) => t.topicId))

    return rows.map((row) => {
      const rowTopics = allTopicRows.filter((t) => t.snapshotId === row.id)
      return this.toDomain(row, rowTopics, slugMap)
    })
  }

  async findLatestByUserId(userId: UserId): Promise<DailySnapshot | null> {
    const rows = await this.db
      .select()
      .from(dailySnapshots)
      .where(eq(dailySnapshots.userId, userId as string))
      .orderBy(desc(dailySnapshots.snapshotDate))
      .limit(1)

    if (rows.length === 0) return null

    const topicRows = await this.db
      .select()
      .from(topicSnapshots)
      .where(eq(topicSnapshots.snapshotId, rows[0]!.id))

    const slugMap = await this.buildSlugMap(topicRows.map((t) => t.topicId))
    return this.toDomain(rows[0]!, topicRows, slugMap)
  }

  async save(snapshot: DailySnapshot): Promise<DailySnapshot> {
    await this.db
      .insert(dailySnapshots)
      .values({
        id: snapshot.id,
        userId: snapshot.userId as string,
        leetcodeProfileId: snapshot.leetcodeProfileId,
        snapshotDate: snapshot.snapshotDate.toISOString().split('T')[0]!,
        totalSolved: snapshot.totalSolved,
        easySolved: snapshot.easySolved,
        mediumSolved: snapshot.mediumSolved,
        hardSolved: snapshot.hardSolved,
        totalSubmissions: snapshot.totalSubmissions,
        ranking: snapshot.ranking,
        contestRating: snapshot.contestRating?.toString() ?? null,
      })
      .onConflictDoUpdate({
        target: [dailySnapshots.userId, dailySnapshots.snapshotDate],
        set: {
          totalSolved: snapshot.totalSolved,
          easySolved: snapshot.easySolved,
          mediumSolved: snapshot.mediumSolved,
          hardSolved: snapshot.hardSolved,
          totalSubmissions: snapshot.totalSubmissions,
          ranking: snapshot.ranking,
        },
      })

    if (snapshot.topicProgress.length > 0) {
      const slugs = snapshot.topicProgress.map((tp) => tp.topicSlug)
      const topicRows = await this.db
        .select({ id: topics.id, slug: topics.slug })
        .from(topics)
        .where(inArray(topics.slug, slugs))

      const slugToId = new Map(topicRows.map((t) => [t.slug, t.id]))

      const resolved = snapshot.topicProgress
        .map((tp) => {
          const topicId = slugToId.get(tp.topicSlug)
          if (!topicId) return null
          return {
            snapshotId: snapshot.id,
            topicId,
            solved: tp.solved,
            attempted: tp.attempted,
            masteryScore: MasteryScore.toNumber(tp.masteryScore).toString(),
          }
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)

      if (resolved.length > 0) {
        await this.db.insert(topicSnapshots).values(resolved).onConflictDoNothing()
      }
    }

    return snapshot
  }

  private async buildSlugMap(topicIds: string[]): Promise<Map<string, string>> {
    if (topicIds.length === 0) return new Map()
    const unique = [...new Set(topicIds)]
    const rows = await this.db
      .select({ id: topics.id, slug: topics.slug })
      .from(topics)
      .where(inArray(topics.id, unique))
    return new Map(rows.map((r) => [r.id, r.slug]))
  }

  private toDomain(
    row: typeof dailySnapshots.$inferSelect,
    topicRows: Array<typeof topicSnapshots.$inferSelect>,
    slugMap: Map<string, string>,
  ): DailySnapshot {
    const topicProgress: TopicProgress[] = topicRows.map((t) => ({
      topicId: t.topicId,
      topicSlug: slugMap.get(t.topicId) ?? t.topicId,
      solved: t.solved,
      attempted: t.attempted,
      masteryScore: MasteryScore.of(Number(t.masteryScore)),
    }))

    return createDailySnapshot({
      id: row.id,
      userId: row.userId as UserId,
      leetcodeProfileId: row.leetcodeProfileId,
      snapshotDate: new Date(row.snapshotDate),
      totalSolved: row.totalSolved,
      easySolved: row.easySolved,
      mediumSolved: row.mediumSolved,
      hardSolved: row.hardSolved,
      totalSubmissions: row.totalSubmissions,
      ranking: row.ranking,
      contestRating: row.contestRating ? Number(row.contestRating) : null,
      topicProgress,
    })
  }
}
