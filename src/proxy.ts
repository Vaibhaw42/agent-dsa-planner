import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/signup', '/api/auth']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authProvider = process.env['AUTH_PROVIDER'] ?? 'supabase'

  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/recommendations')

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup')

  // ── Local auth: read session cookie ──────────────────────────────────────
  if (authProvider === 'local') {
    const sessionCookie = request.cookies.get('dsa_session')?.value
    const isAuthenticated = Boolean(sessionCookie)

    if (isProtected && !isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (isAuthPage && isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // ── Supabase auth ─────────────────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth/callback).*)'],
}
