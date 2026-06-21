import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { AuthUser, IServerAuthProvider } from './AuthProvider'

/**
 * Works identically for local Supabase (supabase start) and cloud Supabase.
 * Switch by changing NEXT_PUBLIC_SUPABASE_URL in .env.local.
 */
export class SupabaseServerAuthProvider implements IServerAuthProvider {
  async getUser(): Promise<AuthUser | null> {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) return null
    return { id: user.id, email: user.email }
  }
}
