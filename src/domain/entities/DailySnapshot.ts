import { UserId } from '../value-objects/UserId'
import { MasteryScore } from '../value-objects/MasteryScore'

export interface TopicProgress {
  readonly topicId: string
  readonly topicSlug: string
  readonly solved: number
  readonly attempted: number
  readonly masteryScore: MasteryScore
}

export interface DailySnapshot {
  readonly id: string
  readonly userId: UserId
  readonly leetcodeProfileId: string
  readonly snapshotDate: Date
  readonly totalSolved: number
  readonly easySolved: number
  readonly mediumSolved: number
  readonly hardSolved: number
  readonly totalSubmissions: number
  readonly ranking: number | null
  readonly contestRating: number | null
  readonly topicProgress: ReadonlyArray<TopicProgress>
  readonly createdAt: Date
}

export const createDailySnapshot = (
  params: Omit<DailySnapshot, 'createdAt'> & { createdAt?: Date },
): DailySnapshot => ({
  ...params,
  createdAt: params.createdAt ?? new Date(),
})
