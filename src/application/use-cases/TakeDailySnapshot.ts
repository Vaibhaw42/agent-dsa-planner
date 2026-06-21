import { randomUUID } from 'crypto'
import { createDailySnapshot } from '@/domain/entities/DailySnapshot'
import type { TopicProgress } from '@/domain/entities/DailySnapshot'
import type { ILeetCodeProfileRepository } from '@/domain/repositories/ILeetCodeProfileRepository'
import type { ISnapshotRepository } from '@/domain/repositories/ISnapshotRepository'
import { AppError } from '@/shared/errors/AppError'
import { MasteryScore } from '@/domain/value-objects/MasteryScore'
import type { LeetCodeGraphQLClient } from '@/infrastructure/leetcode/LeetCodeGraphQLClient'
import type { UserId } from '@/domain/value-objects/UserId'

const SYNC_COOLDOWN_MS = (Number(process.env['LEETCODE_SYNC_COOLDOWN_SECONDS'] ?? 300)) * 1000

export interface TakeDailySnapshotInput {
  userId: string
}

export interface TakeDailySnapshotResult {
  snapshotId: string
  totalSolved: number
  snapshotDate: Date
}

export class TakeDailySnapshot {
  constructor(
    private readonly profileRepo: ILeetCodeProfileRepository,
    private readonly snapshotRepo: ISnapshotRepository,
    private readonly leetcodeClient: LeetCodeGraphQLClient,
  ) {}

  async execute(input: TakeDailySnapshotInput): Promise<TakeDailySnapshotResult> {
    const userId = input.userId as UserId

    const profile = await this.profileRepo.findByUserId(userId)
    if (!profile) throw AppError.notFound('LeetCode profile')

    if (profile.lastSyncedAt) {
      const elapsed = Date.now() - profile.lastSyncedAt.getTime()
      if (elapsed < SYNC_COOLDOWN_MS) {
        const remaining = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000)
        throw new AppError(
          'SYNC_COOLDOWN_ACTIVE',
          `Sync cooldown active. Try again in ${remaining}s.`,
          429,
        )
      }
    }

    const [stats, topicStats, contestInfo] = await Promise.all([
      this.leetcodeClient.getUserStats(profile.username),
      this.leetcodeClient.getTopicStats(profile.username),
      this.leetcodeClient.getContestInfo(profile.username),
    ])

    if (!stats) {
      throw new AppError('LEETCODE_FETCH_ERROR', 'Failed to fetch LeetCode data. Profile may be private.', 502)
    }

    const topicProgress: TopicProgress[] = topicStats.map((t) => ({
      topicId: t.tagSlug,
      topicSlug: t.tagSlug,
      solved: t.problemsSolved,
      attempted: t.problemsSolved,
      masteryScore: MasteryScore.of(Math.min(100, Math.round((t.problemsSolved / 50) * 100))),
    }))

    const snapshot = createDailySnapshot({
      id: randomUUID(),
      userId,
      leetcodeProfileId: profile.id,
      snapshotDate: new Date(),
      totalSolved: stats.totalSolved,
      easySolved: stats.easySolved,
      mediumSolved: stats.mediumSolved,
      hardSolved: stats.hardSolved,
      totalSubmissions: stats.totalSubmissions,
      ranking: stats.ranking,
      contestRating: contestInfo?.rating ?? null,
      topicProgress,
    })

    await this.snapshotRepo.save(snapshot)
    await this.profileRepo.updateLastSynced(profile.id, new Date())

    return {
      snapshotId: snapshot.id,
      totalSolved: snapshot.totalSolved,
      snapshotDate: snapshot.snapshotDate,
    }
  }
}
