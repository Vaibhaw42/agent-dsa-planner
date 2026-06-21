import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/infrastructure/db/schema.ts',
  out: './supabase/migrations/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL']!,
  },
})
