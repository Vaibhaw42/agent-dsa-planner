import { createDrizzleClient } from '@/infrastructure/db/client'
import { AIOrchestrationService } from '@/infrastructure/ai/AIOrchestrationService'
import { createAIProvider } from '@/infrastructure/ai/createAIProvider'
import { SupabaseRecommendationRepository } from '@/infrastructure/repositories/SupabaseRecommendationRepository'
import { SupabaseSnapshotRepository } from '@/infrastructure/repositories/SupabaseSnapshotRepository'
import { AnalyticsService } from '@/application/services/AnalyticsService'
import { UserId } from '@/domain/value-objects/UserId'
import { DateRange } from '@/domain/value-objects/DateRange'
import { getCurrentUser } from '@/shared/utils/get-current-user'
import { apiError, apiOk } from '@/shared/utils/api-response'

export async function GET() {
  try {
    const user = await getCurrentUser()

    const db = createDrizzleClient()
    const recRepo = new SupabaseRecommendationRepository(db)
    const recs = await recRepo.findActiveByUserId(UserId.fromString(user.id))
    return apiOk(recs)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser()

    const db = createDrizzleClient()
    const snapshotRepo = new SupabaseSnapshotRepository(db)
    const recRepo = new SupabaseRecommendationRepository(db)
    const analyticsService = new AnalyticsService()
    const ai = new AIOrchestrationService(createAIProvider())

    const snapshots = await snapshotRepo.findByUserId(UserId.fromString(user.id), DateRange.lastDays(30))
    const analytics = analyticsService.compute(snapshots)
    const recs = await ai.generateRecommendations(user.id, analytics)
    const saved = await recRepo.saveBatch(recs)
    return apiOk(saved)
  } catch (err) {
    return apiError(err)
  }
}
