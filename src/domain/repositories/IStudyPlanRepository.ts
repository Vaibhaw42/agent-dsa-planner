import type { StudyPlan } from '../entities/StudyPlan'
import type { UserId } from '../value-objects/UserId'

export interface IStudyPlanRepository {
  findById(id: string): Promise<StudyPlan | null>
  findActiveByUserId(userId: UserId): Promise<StudyPlan[]>
  save(plan: StudyPlan): Promise<StudyPlan>
  updateItemCompleted(itemId: string, completedAt: Date): Promise<void>
}
