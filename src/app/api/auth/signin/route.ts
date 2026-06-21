import { z } from 'zod'
import { cookies } from 'next/headers'
import { getAuthProviderType } from '@/infrastructure/auth/createAuthProvider'
import { SESSION_COOKIE_NAME, SESSION_TTL } from '@/infrastructure/auth/LocalAuthProvider'
import { apiError, apiOk } from '@/shared/utils/api-response'
import { AppError } from '@/shared/errors/AppError'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    if (getAuthProviderType() !== 'local') {
      throw AppError.validation('Use Supabase Auth for sign-in when AUTH_PROVIDER=supabase')
    }

    const body = bodySchema.parse(await request.json())
    const { LocalAuthService } = await import('@/infrastructure/auth/LocalAuthProvider')
    const service = new LocalAuthService()

    const { token, error } = await service.signIn(body.email, body.password)
    if (error || !token) throw AppError.validation(error ?? 'Sign-in failed')

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL / 1000,
      path: '/',
    })

    return apiOk({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
