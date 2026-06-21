import { createServerAuthProvider } from '@/infrastructure/auth/createAuthProvider'
import { AppError } from '../errors/AppError'
import type { AuthUser } from '@/infrastructure/auth/AuthProvider'

export async function getCurrentUser(): Promise<AuthUser> {
  const provider = await createServerAuthProvider()
  const user = await provider.getUser()
  if (!user) throw AppError.unauthorized()
  return user
}
