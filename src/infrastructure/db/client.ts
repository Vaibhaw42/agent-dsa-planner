import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export type DrizzleClient = ReturnType<typeof createDrizzleClient>

let cachedClient: ReturnType<typeof drizzle> | null = null

export const createDrizzleClient = () => {
  if (cachedClient) return cachedClient

  const connectionString = process.env['DATABASE_URL']
  if (!connectionString) throw new Error('DATABASE_URL environment variable is required')

  const queryClient = postgres(connectionString, { max: 10 })
  cachedClient = drizzle(queryClient, { schema })
  return cachedClient
}
