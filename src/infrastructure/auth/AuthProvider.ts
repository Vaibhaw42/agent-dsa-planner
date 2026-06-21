export interface AuthUser {
  id: string
  email: string
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
}

/** Server-side: reads session from request cookies/headers */
export interface IServerAuthProvider {
  getUser(request?: Request): Promise<AuthUser | null>
}

/** Client-side: sign-in, sign-up, sign-out */
export interface IClientAuthProvider {
  signIn(email: string, password: string): Promise<{ error: string | null }>
  signUp(email: string, password: string, redirectUrl: string): Promise<{ error: string | null; requiresConfirmation: boolean }>
  signOut(): Promise<void>
}
