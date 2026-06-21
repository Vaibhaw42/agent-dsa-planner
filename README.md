# DSA Progress Analyzer

AI-powered LeetCode progress tracker with personalized study recommendations.

## Stack

- **Framework:** Next.js 15 (App Router), TypeScript strict
- **Database:** Supabase (PostgreSQL + Auth)
- **ORM:** Drizzle ORM
- **AI:** Claude Code SDK (subprocess) behind `AIProvider` abstraction
- **UI:** Tailwind CSS, shadcn/ui, Recharts

## Architecture

```
src/
├── domain/           # Business logic — entities, value objects, repository interfaces
├── application/      # Use cases, services (AnalyticsService, etc.)
├── infrastructure/   # DB (Drizzle), LeetCode GraphQL client, AI providers, Supabase clients
├── presentation/     # React components, TanStack Query hooks
└── app/              # Next.js App Router (pages + API routes)
```

## Setup

### 1. Environment

```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, ANTHROPIC_API_KEY
```

### 2. Install

```bash
npm install
```

### 3. Database (local Supabase)

```bash
# Requires Docker
supabase start
supabase db reset   # applies all migrations and seeds 28 topics
```

### 4. Dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run type-check` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run test:coverage` | Tests + coverage report |
| `npm run db:studio` | Drizzle Studio (DB GUI) |

## Features (Phase 1)

- Sign up / sign in via Supabase Auth
- Connect LeetCode username → syncs solve counts + topic stats
- Dashboard with difficulty pie chart, topic radar, company readiness bars
- AI-generated personalized recommendations (Claude Code SDK)
- AI-generated study plans with daily schedule

## Phase 2 (planned)

- AI Coach with daily guidance
- Weakness detection with curated problem suggestions
- Progress forecasting

## Phase 3 (planned)

- Mock interview simulator
- AI interviewer with live feedback
- Communication scoring
