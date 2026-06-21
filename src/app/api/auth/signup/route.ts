import { z } from 'zod'
import { getAuthProviderType } from '@/infrastructure/auth/createAuthProvider'
import { apiError, apiOk } from '@/shared/utils/api-response'
import { AppError } from '@/shared/errors/AppError'
import { createDrizzleClient } from '@/infrastructure/db/client'
import { users } from '@/infrastructure/db/schema'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  try {
    if (getAuthProviderType() !== 'local') {
      throw AppError.validation('Use Supabase Auth for sign-up when AUTH_PROVIDER=supabase')
    }

    const body = bodySchema.parse(await request.json())
    const { LocalAuthService } = await import('@/infrastructure/auth/LocalAuthProvider')
    const service = new LocalAuthService()

    const { userId, error } = await service.signUp(body.email, body.password)
    if (error || !userId) throw AppError.validation(error ?? 'Sign-up failed')

    const db = createDrizzleClient()
    await db.insert(users).values({ id: userId, email: body.email.toLowerCase() })

    return apiOk({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
