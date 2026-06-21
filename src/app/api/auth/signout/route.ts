import { cookies } from 'next/headers'
import { getAuthProviderType } from '@/infrastructure/auth/createAuthProvider'
import { SESSION_COOKIE_NAME, LocalAuthService } from '@/infrastructure/auth/LocalAuthProvider'
import { apiError, apiOk } from '@/shared/utils/api-response'

export async function POST() {
  try {
    const cookieStore = await cookies()

    if (getAuthProviderType() === 'local') {
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
      if (token) {
        const service = new LocalAuthService()
        await service.signOut(token)
      }
      cookieStore.delete(SESSION_COOKIE_NAME)
    }

    return apiOk({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
