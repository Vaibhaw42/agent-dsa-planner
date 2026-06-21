import { z } from 'zod'
import { createDrizzleClient } from '@/infrastructure/db/client'
import { AIOrchestrationService } from '@/infrastructure/ai/AIOrchestrationService'
import { createAIProvider } from '@/infrastructure/ai/createAIProvider'
import { SupabaseSnapshotRepository } from '@/infrastructure/repositories/SupabaseSnapshotRepository'
import { SupabaseStudyPlanRepository } from '@/infrastructure/repositories/SupabaseStudyPlanRepository'
import { AnalyticsService } from '@/application/services/AnalyticsService'
import { UserId } from '@/domain/value-objects/UserId'
import { DateRange } from '@/domain/value-objects/DateRange'
import { getCurrentUser } from '@/shared/utils/get-current-user'
import { apiError, apiOk } from '@/shared/utils/api-response'

const createPlanSchema = z.object({
  targetDays: z.number().int().min(7).max(365),
  targetCompany: z.enum(['amazon', 'google', 'microsoft', 'meta']).nullable().optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()

    const db = createDrizzleClient()
    const planRepo = new SupabaseStudyPlanRepository(db)
    const plans = await planRepo.findActiveByUserId(UserId.fromString(user.id))
    return apiOk(plans)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    const body = createPlanSchema.parse(await request.json())

    const db = createDrizzleClient()
    const snapshotRepo = new SupabaseSnapshotRepository(db)
    const planRepo = new SupabaseStudyPlanRepository(db)
    const analyticsService = new AnalyticsService()
    const ai = new AIOrchestrationService(createAIProvider())

    const snapshots = await snapshotRepo.findByUserId(UserId.fromString(user.id), DateRange.lastDays(30))
    const analytics = analyticsService.compute(snapshots)
    const plan = await ai.generateStudyPlan(user.id, analytics, body.targetDays, body.targetCompany ?? null)

    const saved = await planRepo.save(plan)
    return apiOk(saved)
  } catch (err) {
    return apiError(err)
  }
}
