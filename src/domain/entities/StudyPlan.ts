import { UserId } from '../value-objects/UserId'

export type StudyPlanStatus = 'active' | 'completed' | 'paused'

export interface StudyPlanItem {
  readonly id: string
  readonly studyPlanId: string
  readonly topicSlug: string | null
  readonly problemSlug: string | null
  readonly title: string
  readonly description: string
  readonly orderIndex: number
  readonly isCompleted: boolean
  readonly scheduledDate: Date
  readonly completedAt: Date | null
}

export interface StudyPlan {
  readonly id: string
  readonly userId: UserId
  readonly title: string
  readonly targetCompany: string | null
  readonly targetDate: Date
  readonly status: StudyPlanStatus
  readonly items: ReadonlyArray<StudyPlanItem>
  readonly createdAt: Date
}
