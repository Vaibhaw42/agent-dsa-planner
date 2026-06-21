import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { createDrizzleClient } from '@/infrastructure/db/client'
import { localAuthSessions, localAuthUsers } from '@/infrastructure/db/schema'
import type { AuthUser, IServerAuthProvider } from './AuthProvider'

const SESSION_COOKIE = 'dsa_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export class LocalServerAuthProvider implements IServerAuthProvider {
  async getUser(): Promise<AuthUser | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null

    const db = createDrizzleClient()
    const rows = await db
      .select()
      .from(localAuthSessions)
      .where(eq(localAuthSessions.sessionToken, token))
      .limit(1)

    const session = rows[0]
    if (!session || session.expiresAt < new Date()) return null

    const userRows = await db
      .select()
      .from(localAuthUsers)
      .where(eq(localAuthUsers.id, session.userId))
      .limit(1)

    const user = userRows[0]
    if (!user) return null

    return { id: user.id, email: user.email }
  }
}

/** Call from API routes — handles sign-in/sign-up/sign-out for local mode */
export class LocalAuthService {
  private readonly db = createDrizzleClient()

  async signUp(email: string, password: string): Promise<{ userId: string | null; error: string | null }> {
    const existing = await this.db
      .select()
      .from(localAuthUsers)
      .where(eq(localAuthUsers.email, email.toLowerCase()))
      .limit(1)

    if (existing.length > 0) return { userId: null, error: 'Email already registered' }

    const userId = randomUUID()
    const passwordHash = await bcrypt.hash(password, 12)
    await this.db.insert(localAuthUsers).values({
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      emailVerified: true,
    })

    return { userId, error: null }
  }

  async signIn(email: string, password: string): Promise<{ token: string | null; error: string | null }> {
    const rows = await this.db
      .select()
      .from(localAuthUsers)
      .where(eq(localAuthUsers.email, email.toLowerCase()))
      .limit(1)

    const user = rows[0]
    if (!user) return { token: null, error: 'Invalid email or password' }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return { token: null, error: 'Invalid email or password' }

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
    await this.db.insert(localAuthSessions).values({
      id: randomUUID(),
      userId: user.id,
      sessionToken: token,
      expiresAt,
    })

    return { token, error: null }
  }

  async signOut(token: string): Promise<void> {
    await this.db
      .delete(localAuthSessions)
      .where(eq(localAuthSessions.sessionToken, token))
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE
export const SESSION_TTL = SESSION_TTL_MS
