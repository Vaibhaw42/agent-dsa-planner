import { createDrizzleClient } from '@/infrastructure/db/client'
import { SupabaseSnapshotRepository } from '@/infrastructure/repositories/SupabaseSnapshotRepository'
import { AnalyticsService } from '@/application/services/AnalyticsService'
import { DateRange } from '@/domain/value-objects/DateRange'
import { UserId } from '@/domain/value-objects/UserId'
import { getCurrentUser } from '@/shared/utils/get-current-user'
import { apiError, apiOk } from '@/shared/utils/api-response'

export async function GET() {
  try {
    const user = await getCurrentUser()

    const db = createDrizzleClient()
    const snapshotRepo = new SupabaseSnapshotRepository(db)
    const analyticsService = new AnalyticsService()

    const snapshots = await snapshotRepo.findByUserId(UserId.fromString(user.id), DateRange.lastDays(30))
    const result = analyticsService.compute(snapshots)

    return apiOk(result)
  } catch (err) {
    return apiError(err)
  }
}
