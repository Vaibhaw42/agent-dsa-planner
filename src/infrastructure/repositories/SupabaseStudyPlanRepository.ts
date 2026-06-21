import { and, eq, inArray, sql } from 'drizzle-orm'
import type { StudyPlan, StudyPlanItem, StudyPlanStatus } from '@/domain/entities/StudyPlan'
import type { IStudyPlanRepository } from '@/domain/repositories/IStudyPlanRepository'
import type { UserId } from '@/domain/value-objects/UserId'
import type { DrizzleClient } from '../db/client'
import { studyPlanItems, studyPlans } from '../db/schema'

export class SupabaseStudyPlanRepository implements IStudyPlanRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<StudyPlan | null> {
    const rows = await this.db.select().from(studyPlans).where(eq(studyPlans.id, id)).limit(1)
    if (rows.length === 0) return null

    const items = await this.db
      .select()
      .from(studyPlanItems)
      .where(eq(studyPlanItems.studyPlanId, id))
      .orderBy(studyPlanItems.orderIndex)

    return this.toDomain(rows[0]!, items)
  }

  async findActiveByUserId(userId: UserId): Promise<StudyPlan[]> {
    const rows = await this.db
      .select()
      .from(studyPlans)
      .where(and(eq(studyPlans.userId, userId as string), eq(studyPlans.status, 'active')))
      .orderBy(studyPlans.createdAt)

    if (rows.length === 0) return []

    const planIds = rows.map((r) => r.id)
    const allItems = await this.db
      .select()
      .from(studyPlanItems)
      .where(inArray(studyPlanItems.studyPlanId, planIds))
      .orderBy(studyPlanItems.orderIndex)

    return rows.map((row) => {
      const items = allItems.filter((i) => i.studyPlanId === row.id)
      return this.toDomain(row, items)
    })
  }

  async save(plan: StudyPlan): Promise<StudyPlan> {
    await this.db.transaction(async (tx) => {
      await tx
        .insert(studyPlans)
        .values({
          id: plan.id,
          userId: plan.userId as string,
          title: plan.title,
          targetCompany: plan.targetCompany,
          targetDate: plan.targetDate.toISOString().split('T')[0]!,
          status: plan.status,
        })
        .onConflictDoUpdate({
          target: studyPlans.id,
          set: {
            title: plan.title,
            targetCompany: plan.targetCompany,
            status: plan.status,
            targetDate: plan.targetDate.toISOString().split('T')[0]!,
          },
        })

      if (plan.items.length > 0) {
        await tx
          .insert(studyPlanItems)
          .values(
            plan.items.map((item) => ({
              id: item.id,
              studyPlanId: plan.id,
              topicSlug: item.topicSlug,
              problemSlug: item.problemSlug,
              title: item.title,
              description: item.description,
              orderIndex: item.orderIndex,
              isCompleted: item.isCompleted,
              scheduledDate: item.scheduledDate.toISOString().split('T')[0]!,
              completedAt: item.completedAt,
            })),
          )
          .onConflictDoUpdate({
            target: studyPlanItems.id,
            set: {
              topicSlug: sql`excluded.topic_slug`,
              problemSlug: sql`excluded.problem_slug`,
              title: sql`excluded.title`,
              description: sql`excluded.description`,
              orderIndex: sql`excluded.order_index`,
              isCompleted: sql`excluded.is_completed`,
              scheduledDate: sql`excluded.scheduled_date`,
              completedAt: sql`excluded.completed_at`,
            },
          })
      }
    })

    return plan
  }

  async updateItemCompleted(itemId: string, completedAt: Date): Promise<void> {
    await this.db
      .update(studyPlanItems)
      .set({ isCompleted: true, completedAt })
      .where(eq(studyPlanItems.id, itemId))
  }

  private toDomain(
    row: typeof studyPlans.$inferSelect,
    itemRows: Array<typeof studyPlanItems.$inferSelect>,
  ): StudyPlan {
    const items: StudyPlanItem[] = itemRows.map((i) => ({
      id: i.id,
      studyPlanId: i.studyPlanId,
      topicSlug: i.topicSlug,
      problemSlug: i.problemSlug,
      title: i.title,
      description: i.description,
      orderIndex: i.orderIndex,
      isCompleted: i.isCompleted,
      scheduledDate: new Date(i.scheduledDate),
      completedAt: i.completedAt,
    }))

    return {
      id: row.id,
      userId: row.userId as UserId,
      title: row.title,
      targetCompany: row.targetCompany,
      targetDate: new Date(row.targetDate),
      status: row.status as StudyPlanStatus,
      items,
      createdAt: row.createdAt,
    }
  }
}
