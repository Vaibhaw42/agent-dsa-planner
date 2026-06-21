import type { IServerAuthProvider } from './AuthProvider'

export type AuthProviderType = 'supabase' | 'local'

export function getAuthProviderType(): AuthProviderType {
  const val = process.env['AUTH_PROVIDER']
  return val === 'local' ? 'local' : 'supabase'
}

export async function createServerAuthProvider(): Promise<IServerAuthProvider> {
  const type = getAuthProviderType()

  if (type === 'local') {
    const { LocalServerAuthProvider } = await import('./LocalAuthProvider')
    return new LocalServerAuthProvider()
  }

  const { SupabaseServerAuthProvider } = await import('./SupabaseAuthProvider')
  return new SupabaseServerAuthProvider()
}
