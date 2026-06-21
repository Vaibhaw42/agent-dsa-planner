import { createDrizzleClient } from '@/infrastructure/db/client'
import { SupabaseStudyPlanRepository } from '@/infrastructure/repositories/SupabaseStudyPlanRepository'
import { getCurrentUser } from '@/shared/utils/get-current-user'
import { apiError, apiOk } from '@/shared/utils/api-response'
import { AppError } from '@/shared/errors/AppError'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    const db = createDrizzleClient()
    const planRepo = new SupabaseStudyPlanRepository(db)
    const plan = await planRepo.findById(id)

    if (!plan) throw AppError.notFound('Study plan')
    if ((plan.userId as string) !== user.id) throw AppError.forbidden()

    return apiOk(plan)
  } catch (err) {
    return apiError(err)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    const body = (await request.json()) as { itemId?: string }
    if (!body.itemId) throw AppError.validation('itemId is required')

    const db = createDrizzleClient()
    const planRepo = new SupabaseStudyPlanRepository(db)
    const plan = await planRepo.findById(id)

    if (!plan) throw AppError.notFound('Study plan')
    if ((plan.userId as string) !== user.id) throw AppError.forbidden()

    await planRepo.updateItemCompleted(body.itemId, new Date())
    return apiOk({ updated: true })
  } catch (err) {
    return apiError(err)
  }
}
