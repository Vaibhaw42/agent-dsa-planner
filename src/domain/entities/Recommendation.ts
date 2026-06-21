import { UserId } from '../value-objects/UserId'

export type RecommendationType = 'problem' | 'topic' | 'pattern' | 'revision'

export interface Recommendation {
  readonly id: string
  readonly userId: UserId
  readonly type: RecommendationType
  readonly title: string
  readonly description: string
  readonly reasoning: string
  readonly priority: number
  readonly metadata: Record<string, unknown>
  readonly isCompleted: boolean
  readonly createdAt: Date
  readonly expiresAt: Date
}
