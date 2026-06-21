import { z } from 'zod'
import { createDrizzleClient } from '@/infrastructure/db/client'
import { LeetCodeGraphQLClient } from '@/infrastructure/leetcode/LeetCodeGraphQLClient'
import { SupabaseLeetCodeProfileRepository } from '@/infrastructure/repositories/SupabaseLeetCodeProfileRepository'
import { SupabaseSnapshotRepository } from '@/infrastructure/repositories/SupabaseSnapshotRepository'
import { ConnectLeetCodeProfile } from '@/application/use-cases/ConnectLeetCodeProfile'
import { TakeDailySnapshot } from '@/application/use-cases/TakeDailySnapshot'
import { getCurrentUser } from '@/shared/utils/get-current-user'
import { apiError, apiOk } from '@/shared/utils/api-response'

const bodySchema = z.object({
  username: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid LeetCode username'),
})

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    const body = bodySchema.parse(await request.json())

    const db = createDrizzleClient()
    const profileRepo = new SupabaseLeetCodeProfileRepository(db)
    const snapshotRepo = new SupabaseSnapshotRepository(db)
    const leetcodeClient = new LeetCodeGraphQLClient()

    const connectUseCase = new ConnectLeetCodeProfile(profileRepo, leetcodeClient)
    const result = await connectUseCase.execute({ userId: user.id, username: body.username })

    const snapshotUseCase = new TakeDailySnapshot(profileRepo, snapshotRepo, leetcodeClient)
    await snapshotUseCase.execute({ userId: user.id })

    return apiOk(result)
  } catch (err) {
    return apiError(err)
  }
}
