# DSA Progress Analyzer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality AI-powered DSA Progress Analyzer that fetches LeetCode stats, stores historical snapshots, analyzes strengths/weaknesses, and generates personalized AI study plans.

**Architecture:** Next.js 15 App Router (frontend + API routes), Supabase (PostgreSQL + Auth), Drizzle ORM, clean DDD architecture with domain/application/infrastructure layers, Claude Code SDK for AI via subprocess behind an AIProvider abstraction.

**Tech Stack:** TypeScript 5 (strict), Next.js 15, Supabase, Drizzle ORM, Zod, TanStack Query v5, Tailwind CSS + shadcn/ui, Recharts, @anthropic-ai/claude-code, Vitest + Testing Library, Playwright

---

## Milestone 1: Project Scaffold & Auth (Days 1–5)

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.env.example`, `.gitignore`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Initialize new Next.js 15 project**

```bash
cd /Users/smartjoulesc103_274outlook.com/Documents/ai-agents/claude-agents/dsa-planner
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

Expected: Next.js project created with TypeScript, Tailwind, ESLint, App Router, `src/` dir.

- [ ] **Step 2: Configure TypeScript strict mode**

Edit `tsconfig.json` to add:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  }
}
```

- [ ] **Step 3: Install all dependencies**

```bash
npm install \
  @supabase/supabase-js @supabase/ssr \
  drizzle-orm postgres \
  zod \
  @tanstack/react-query @tanstack/react-query-devtools \
  recharts \
  @anthropic-ai/claude-code \
  lucide-react clsx tailwind-merge class-variance-authority

npm install --save-dev \
  drizzle-kit \
  vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  @playwright/test \
  prettier eslint-config-prettier \
  @types/node
```

- [ ] **Step 4: Install and configure shadcn/ui**

```bash
npx shadcn@latest init
# Choose: Default style, Slate base color, CSS variables: yes
npx shadcn@latest add button card badge input label form toast skeleton tabs
```

- [ ] **Step 5: Configure Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', '.next/', 'src/tests/'],
      thresholds: { lines: 80 },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

Create `src/tests/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Create .env.example**

```bash
# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# ANTHROPIC
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-5

# APP
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# LEETCODE (optional)
LEETCODE_SESSION_COOKIE=
LEETCODE_RATE_LIMIT_PER_MINUTE=10
LEETCODE_SYNC_COOLDOWN_SECONDS=300

# FEATURE FLAGS
FEATURE_MOCK_INTERVIEW=false
USE_MOCK_AI=false
```

- [ ] **Step 7: Initialize git**

```bash
git init
git add -A
git commit -m "chore: initialize Next.js 15 project with TypeScript strict mode"
```

- [ ] **Step 8: Verify build**

```bash
npm run build
```
Expected: Build succeeds with 0 TypeScript errors.

---

### Task 2: Folder Structure & Domain Layer Scaffold

**Files (create empty with barrel exports):**
- Create: `src/domain/entities/`, `src/domain/repositories/`, `src/domain/services/`, `src/domain/value-objects/`, `src/domain/events/`
- Create: `src/application/use-cases/`, `src/application/dtos/`, `src/application/services/`
- Create: `src/infrastructure/db/`, `src/infrastructure/repositories/`, `src/infrastructure/leetcode/`, `src/infrastructure/ai/`, `src/infrastructure/events/`
- Create: `src/shared/errors/`, `src/shared/utils/`

- [ ] **Step 1: Create domain value objects**

`src/domain/value-objects/UserId.ts`:
```typescript
export type UserId = string & { readonly _brand: 'UserId' }

export const UserId = {
  fromString: (id: string): UserId => {
    if (!id || id.trim().length === 0) throw new Error('UserId cannot be empty')
    return id as UserId
  },
  toString: (id: UserId): string => id,
}
```

`src/domain/value-objects/MasteryScore.ts`:
```typescript
export type MasteryScore = number & { readonly _brand: 'MasteryScore' }

export const MasteryScore = {
  of: (value: number): MasteryScore => {
    if (value < 0 || value > 100) throw new Error(`MasteryScore must be 0-100, got ${value}`)
    return value as MasteryScore
  },
  toNumber: (score: MasteryScore): number => score,
  WEAK_THRESHOLD: 40 as const,
  STRONG_THRESHOLD: 75 as const,
}
```

`src/domain/value-objects/DateRange.ts`:
```typescript
export interface DateRange {
  readonly from: Date
  readonly to: Date
}

export const DateRange = {
  of: (from: Date, to: Date): DateRange => {
    if (from > to) throw new Error('DateRange: from must be <= to')
    return { from, to }
  },
  lastDays: (n: number): DateRange => {
    const to = new Date()
    const from = new Date(to.getTime() - n * 24 * 60 * 60 * 1000)
    return { from, to }
  },
}
```

- [ ] **Step 2: Create domain entities**

`src/domain/entities/User.ts`:
```typescript
import { UserId } from '../value-objects/UserId'

export interface User {
  readonly id: UserId
  readonly email: string
  readonly displayName: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export const createUser = (params: {
  id: string
  email: string
  displayName?: string | null
  createdAt?: Date
  updatedAt?: Date
}): User => ({
  id: UserId.fromString(params.id),
  email: params.email,
  displayName: params.displayName ?? null,
  createdAt: params.createdAt ?? new Date(),
  updatedAt: params.updatedAt ?? new Date(),
})
```

`src/domain/entities/LeetCodeProfile.ts`:
```typescript
import { UserId } from '../value-objects/UserId'

export interface LeetCodeProfile {
  readonly id: string
  readonly userId: UserId
  readonly username: string
  readonly isVerified: boolean
  readonly isPublic: boolean
  readonly createdAt: Date
  readonly lastSyncedAt: Date | null
}

export const createLeetCodeProfile = (params: {
  id: string
  userId: string
  username: string
  isVerified?: boolean
  isPublic?: boolean
  createdAt?: Date
  lastSyncedAt?: Date | null
}): LeetCodeProfile => ({
  id: params.id,
  userId: UserId.fromString(params.userId),
  username: params.username.toLowerCase().trim(),
  isVerified: params.isVerified ?? false,
  isPublic: params.isPublic ?? true,
  createdAt: params.createdAt ?? new Date(),
  lastSyncedAt: params.lastSyncedAt ?? null,
})
```

`src/domain/entities/DailySnapshot.ts`:
```typescript
import { UserId } from '../value-objects/UserId'
import { MasteryScore } from '../value-objects/MasteryScore'

export interface TopicProgress {
  readonly topicId: string
  readonly topicSlug: string
  readonly solved: number
  readonly attempted: number
  readonly masteryScore: MasteryScore
}

export interface DailySnapshot {
  readonly id: string
  readonly userId: UserId
  readonly leetcodeProfileId: string
  readonly snapshotDate: Date
  readonly totalSolved: number
  readonly easySolved: number
  readonly mediumSolved: number
  readonly hardSolved: number
  readonly totalSubmissions: number
  readonly ranking: number | null
  readonly contestRating: number | null
  readonly topicProgress: ReadonlyArray<TopicProgress>
  readonly createdAt: Date
}

export const createDailySnapshot = (params: Omit<DailySnapshot, 'createdAt'> & { createdAt?: Date }): DailySnapshot => ({
  ...params,
  createdAt: params.createdAt ?? new Date(),
})
```

`src/domain/entities/Topic.ts`:
```typescript
export type TopicCategory = 'data_structures' | 'algorithms' | 'math' | 'other'

export interface Topic {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly category: TopicCategory
}
```

`src/domain/entities/Recommendation.ts`:
```typescript
import { UserId } from '../value-objects/UserId'

export type RecommendationType = 'problem' | 'topic' | 'pattern' | 'revision'

export interface Recommendation {
  readonly id: string
  readonly userId: UserId
  readonly type: RecommendationType
  readonly title: string
  readonly description: string
  readonly reasoning: string
  readonly priority: number
  readonly metadata: Record<string, unknown>
  readonly isCompleted: boolean
  readonly createdAt: Date
  readonly expiresAt: Date
}
```

`src/domain/entities/StudyPlan.ts`:
```typescript
import { UserId } from '../value-objects/UserId'

export type StudyPlanStatus = 'active' | 'completed' | 'paused'

export interface StudyPlanItem {
  readonly id: string
  readonly studyPlanId: string
  readonly topicSlug: string | null
  readonly problemSlug: string | null
  readonly title: string
  readonly description: string
  readonly orderIndex: number
  readonly isCompleted: boolean
  readonly scheduledDate: Date
  readonly completedAt: Date | null
}

export interface StudyPlan {
  readonly id: string
  readonly userId: UserId
  readonly title: string
  readonly targetCompany: string | null
  readonly targetDate: Date
  readonly status: StudyPlanStatus
  readonly items: ReadonlyArray<StudyPlanItem>
  readonly createdAt: Date
}
```

- [ ] **Step 3: Create repository interfaces**

`src/domain/repositories/IUserRepository.ts`:
```typescript
import { User } from '../entities/User'
import { UserId } from '../value-objects/UserId'

export interface IUserRepository {
  findById(id: UserId): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<User>
}
```

`src/domain/repositories/ILeetCodeProfileRepository.ts`:
```typescript
import { LeetCodeProfile } from '../entities/LeetCodeProfile'
import { UserId } from '../value-objects/UserId'

export interface ILeetCodeProfileRepository {
  findByUserId(userId: UserId): Promise<LeetCodeProfile | null>
  findByUsername(username: string): Promise<LeetCodeProfile | null>
  save(profile: LeetCodeProfile): Promise<LeetCodeProfile>
  updateLastSynced(id: string, at: Date): Promise<void>
}
```

`src/domain/repositories/ISnapshotRepository.ts`:
```typescript
import { DailySnapshot } from '../entities/DailySnapshot'
import { UserId } from '../value-objects/UserId'
import { DateRange } from '../value-objects/DateRange'

export interface ISnapshotRepository {
  findById(id: string): Promise<DailySnapshot | null>
  findByUserId(userId: UserId, range?: DateRange): Promise<DailySnapshot[]>
  findLatestByUserId(userId: UserId): Promise<DailySnapshot | null>
  save(snapshot: DailySnapshot): Promise<DailySnapshot>
}
```

`src/domain/repositories/IRecommendationRepository.ts`:
```typescript
import { Recommendation } from '../entities/Recommendation'
import { UserId } from '../value-objects/UserId'

export interface IRecommendationRepository {
  findActiveByUserId(userId: UserId): Promise<Recommendation[]>
  save(rec: Recommendation): Promise<Recommendation>
  saveBatch(recs: Recommendation[]): Promise<Recommendation[]>
  markCompleted(id: string): Promise<void>
}
```

`src/domain/repositories/IStudyPlanRepository.ts`:
```typescript
import { StudyPlan } from '../entities/StudyPlan'
import { UserId } from '../value-objects/UserId'

export interface IStudyPlanRepository {
  findById(id: string): Promise<StudyPlan | null>
  findActiveByUserId(userId: UserId): Promise<StudyPlan[]>
  save(plan: StudyPlan): Promise<StudyPlan>
  updateItemCompleted(itemId: string, completedAt: Date): Promise<void>
}
```

- [ ] **Step 4: Create shared errors**

`src/shared/errors/AppError.ts`:
```typescript
export type ErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'LEETCODE_FETCH_ERROR'
  | 'LEETCODE_PRIVATE_PROFILE'
  | 'SYNC_COOLDOWN_ACTIVE'
  | 'AI_PROVIDER_ERROR'
  | 'INTERNAL_ERROR'

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message)
    this.name = 'AppError'
  }

  static notFound(resource: string): AppError {
    return new AppError('NOT_FOUND', `${resource} not found`, 404)
  }

  static unauthorized(): AppError {
    return new AppError('UNAUTHORIZED', 'Authentication required', 401)
  }

  static forbidden(): AppError {
    return new AppError('FORBIDDEN', 'Access denied', 403)
  }

  static validation(message: string): AppError {
    return new AppError('VALIDATION_ERROR', message, 400)
  }
}
```

`src/shared/utils/api-response.ts`:
```typescript
import { NextResponse } from 'next/server'
import { AppError } from '../errors/AppError'
import { ZodError } from 'zod'

export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: { total?: number; page?: number; limit?: number }
}

export interface ApiError {
  success: false
  error: { code: string; message: string }
}

export const apiOk = <T>(data: T, meta?: ApiSuccess<T>['meta']): NextResponse<ApiSuccess<T>> =>
  NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) })

export const apiError = (err: unknown): NextResponse<ApiError> => {
  if (err instanceof AppError) {
    return NextResponse.json(
      { success: false, error: { code: err.code, message: err.message } },
      { status: err.statusCode }
    )
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0]?.message ?? 'Validation failed' } },
      { status: 400 }
    )
  }
  console.error('[API Error]', err)
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
    { status: 500 }
  )
}
```

- [ ] **Step 5: Write tests for value objects**

`src/tests/unit/domain/value-objects.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { UserId } from '@/domain/value-objects/UserId'
import { MasteryScore } from '@/domain/value-objects/MasteryScore'
import { DateRange } from '@/domain/value-objects/DateRange'

describe('UserId', () => {
  it('creates from valid string', () => {
    const id = UserId.fromString('user-123')
    expect(UserId.toString(id)).toBe('user-123')
  })

  it('throws on empty string', () => {
    expect(() => UserId.fromString('')).toThrow('UserId cannot be empty')
  })
})

describe('MasteryScore', () => {
  it('creates valid score', () => {
    const score = MasteryScore.of(75)
    expect(MasteryScore.toNumber(score)).toBe(75)
  })

  it('throws below 0', () => {
    expect(() => MasteryScore.of(-1)).toThrow()
  })

  it('throws above 100', () => {
    expect(() => MasteryScore.of(101)).toThrow()
  })
})

describe('DateRange', () => {
  it('creates valid range', () => {
    const from = new Date('2024-01-01')
    const to = new Date('2024-01-31')
    const range = DateRange.of(from, to)
    expect(range.from).toEqual(from)
    expect(range.to).toEqual(to)
  })

  it('throws when from > to', () => {
    expect(() => DateRange.of(new Date('2024-02-01'), new Date('2024-01-01'))).toThrow()
  })

  it('creates last N days', () => {
    const range = DateRange.lastDays(30)
    const diffMs = range.to.getTime() - range.from.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeCloseTo(30, 0)
  })
})
```

- [ ] **Step 6: Run tests**

```bash
npm run test
```
Expected: All tests pass (PASS on 3 test suites).

- [ ] **Step 7: Commit**

```bash
git add src/domain src/shared src/tests vitest.config.ts
git commit -m "feat: add domain layer — entities, value objects, repository interfaces, shared errors"
```

---

### Task 3: Supabase Setup & Database Schema

**Files:**
- Create: `supabase/config.toml`, `supabase/migrations/0001_create_users.sql` through `0010_seed_topics.sql`
- Create: `src/infrastructure/db/schema.ts`, `src/infrastructure/db/client.ts`, `drizzle.config.ts`

- [ ] **Step 1: Install Supabase CLI and initialize**

```bash
# Install via homebrew if not present
brew install supabase/tap/supabase

# Initialize local Supabase project
supabase init

# Start local Supabase stack (requires Docker)
supabase start
```

Expected: Local Supabase running at http://localhost:54321, Studio at http://localhost:54323.

- [ ] **Step 2: Create database migrations**

`supabase/migrations/0001_create_users.sql`:
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users(id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

`supabase/migrations/0002_create_leetcode_profiles.sql`:
```sql
CREATE TABLE public.leetcode_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ
);

CREATE INDEX idx_leetcode_profiles_user_id ON public.leetcode_profiles(user_id);

ALTER TABLE public.leetcode_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.leetcode_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.leetcode_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.leetcode_profiles FOR UPDATE USING (auth.uid() = user_id);
```

`supabase/migrations/0003_create_topics.sql`:
```sql
CREATE TYPE topic_category AS ENUM ('data_structures', 'algorithms', 'math', 'other');

CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category topic_category NOT NULL DEFAULT 'other'
);
```

`supabase/migrations/0004_create_snapshots.sql`:
```sql
CREATE TABLE public.daily_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leetcode_profile_id UUID NOT NULL REFERENCES public.leetcode_profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_solved INTEGER NOT NULL DEFAULT 0,
  easy_solved INTEGER NOT NULL DEFAULT 0,
  medium_solved INTEGER NOT NULL DEFAULT 0,
  hard_solved INTEGER NOT NULL DEFAULT 0,
  total_submissions INTEGER NOT NULL DEFAULT 0,
  ranking INTEGER,
  contest_rating DECIMAL(8,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX idx_snapshots_user_date ON public.daily_snapshots(user_id, snapshot_date DESC);

CREATE TABLE public.topic_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES public.daily_snapshots(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id),
  solved INTEGER NOT NULL DEFAULT 0,
  attempted INTEGER NOT NULL DEFAULT 0,
  mastery_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  UNIQUE(snapshot_id, topic_id)
);

CREATE INDEX idx_topic_snapshots_snapshot ON public.topic_snapshots(snapshot_id);

ALTER TABLE public.daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own snapshots"
  ON public.daily_snapshots FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role inserts snapshots"
  ON public.daily_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own topic snapshots"
  ON public.topic_snapshots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.daily_snapshots ds
    WHERE ds.id = topic_snapshots.snapshot_id AND ds.user_id = auth.uid()
  ));
```

`supabase/migrations/0005_create_recommendations.sql`:
```sql
CREATE TYPE recommendation_type AS ENUM ('problem', 'topic', 'pattern', 'revision');

CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type recommendation_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reasoning TEXT NOT NULL DEFAULT '',
  priority INTEGER NOT NULL DEFAULT 5,
  metadata JSONB NOT NULL DEFAULT '{}',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_recommendations_user_active ON public.recommendations(user_id, is_completed, expires_at);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recommendations"
  ON public.recommendations FOR ALL USING (auth.uid() = user_id);
```

`supabase/migrations/0006_create_study_plans.sql`:
```sql
CREATE TYPE study_plan_status AS ENUM ('active', 'completed', 'paused');

CREATE TABLE public.study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_company TEXT,
  target_date DATE NOT NULL,
  status study_plan_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.study_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  topic_slug TEXT,
  problem_slug TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  scheduled_date DATE NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_study_plan_items_plan ON public.study_plan_items(study_plan_id, order_index);

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own study plans"
  ON public.study_plans FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own study plan items"
  ON public.study_plan_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.study_plans sp
    WHERE sp.id = study_plan_items.study_plan_id AND sp.user_id = auth.uid()
  ));
```

`supabase/migrations/0007_create_ai_interactions.sql`:
```sql
CREATE TABLE public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_interactions_user ON public.ai_interactions(user_id, created_at DESC);
```

`supabase/migrations/0008_seed_topics.sql`:
```sql
INSERT INTO public.topics (name, slug, category) VALUES
  ('Array', 'array', 'data_structures'),
  ('String', 'string', 'data_structures'),
  ('Hash Table', 'hash-table', 'data_structures'),
  ('Linked List', 'linked-list', 'data_structures'),
  ('Stack', 'stack', 'data_structures'),
  ('Queue', 'queue', 'data_structures'),
  ('Tree', 'tree', 'data_structures'),
  ('Binary Tree', 'binary-tree', 'data_structures'),
  ('Binary Search Tree', 'binary-search-tree', 'data_structures'),
  ('Graph', 'graph', 'data_structures'),
  ('Trie', 'trie', 'data_structures'),
  ('Heap', 'heap', 'data_structures'),
  ('Matrix', 'matrix', 'data_structures'),
  ('Dynamic Programming', 'dynamic-programming', 'algorithms'),
  ('Greedy', 'greedy', 'algorithms'),
  ('Backtracking', 'backtracking', 'algorithms'),
  ('Sorting', 'sorting', 'algorithms'),
  ('Binary Search', 'binary-search', 'algorithms'),
  ('Two Pointers', 'two-pointers', 'algorithms'),
  ('Sliding Window', 'sliding-window', 'algorithms'),
  ('Depth-First Search', 'depth-first-search', 'algorithms'),
  ('Breadth-First Search', 'breadth-first-search', 'algorithms'),
  ('Recursion', 'recursion', 'algorithms'),
  ('Divide and Conquer', 'divide-and-conquer', 'algorithms'),
  ('Math', 'math', 'math'),
  ('Bit Manipulation', 'bit-manipulation', 'math'),
  ('Union Find', 'union-find', 'algorithms'),
  ('Monotonic Stack', 'monotonic-stack', 'algorithms');
```

- [ ] **Step 3: Apply migrations locally**

```bash
supabase db reset
```
Expected: All 8 migrations applied, topics table has 28 rows.

- [ ] **Step 4: Configure Drizzle ORM**

`drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/infrastructure/db/schema.ts',
  out: './supabase/migrations/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL']!,
  },
})
```

`src/infrastructure/db/schema.ts`:
```typescript
import { pgTable, uuid, text, boolean, integer, decimal, date, timestamp, pgEnum, unique, index } from 'drizzle-orm/pg-core'

export const topicCategoryEnum = pgEnum('topic_category', ['data_structures', 'algorithms', 'math', 'other'])
export const recommendationTypeEnum = pgEnum('recommendation_type', ['problem', 'topic', 'pattern', 'revision'])
export const studyPlanStatusEnum = pgEnum('study_plan_status', ['active', 'completed', 'paused'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const leetcodeProfiles = pgTable('leetcode_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  username: text('username').notNull().unique(),
  isVerified: boolean('is_verified').notNull().default(false),
  isPublic: boolean('is_public').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
}, (t) => [index('idx_leetcode_profiles_user_id').on(t.userId)])

export const topics = pgTable('topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  category: topicCategoryEnum('category').notNull().default('other'),
})

export const dailySnapshots = pgTable('daily_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  leetcodeProfileId: uuid('leetcode_profile_id').notNull().references(() => leetcodeProfiles.id, { onDelete: 'cascade' }),
  snapshotDate: date('snapshot_date').notNull(),
  totalSolved: integer('total_solved').notNull().default(0),
  easySolved: integer('easy_solved').notNull().default(0),
  mediumSolved: integer('medium_solved').notNull().default(0),
  hardSolved: integer('hard_solved').notNull().default(0),
  totalSubmissions: integer('total_submissions').notNull().default(0),
  ranking: integer('ranking'),
  contestRating: decimal('contest_rating', { precision: 8, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_snapshots_user_date').on(t.userId, t.snapshotDate),
  unique().on(t.userId, t.snapshotDate),
])

export const topicSnapshots = pgTable('topic_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  snapshotId: uuid('snapshot_id').notNull().references(() => dailySnapshots.id, { onDelete: 'cascade' }),
  topicId: uuid('topic_id').notNull().references(() => topics.id),
  solved: integer('solved').notNull().default(0),
  attempted: integer('attempted').notNull().default(0),
  masteryScore: decimal('mastery_score', { precision: 5, scale: 2 }).notNull().default('0'),
}, (t) => [
  index('idx_topic_snapshots_snapshot').on(t.snapshotId),
  unique().on(t.snapshotId, t.topicId),
])

export const recommendations = pgTable('recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: recommendationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  reasoning: text('reasoning').notNull().default(''),
  priority: integer('priority').notNull().default(5),
  metadata: text('metadata').notNull().default('{}'),
  isCompleted: boolean('is_completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (t) => [index('idx_recommendations_user_active').on(t.userId, t.isCompleted, t.expiresAt)])

export const studyPlans = pgTable('study_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  targetCompany: text('target_company'),
  targetDate: date('target_date').notNull(),
  status: studyPlanStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const studyPlanItems = pgTable('study_plan_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  studyPlanId: uuid('study_plan_id').notNull().references(() => studyPlans.id, { onDelete: 'cascade' }),
  topicSlug: text('topic_slug'),
  problemSlug: text('problem_slug'),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  orderIndex: integer('order_index').notNull(),
  isCompleted: boolean('is_completed').notNull().default(false),
  scheduledDate: date('scheduled_date').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (t) => [index('idx_study_plan_items_plan').on(t.studyPlanId, t.orderIndex)])

export const aiInteractions = pgTable('ai_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  interactionType: text('interaction_type').notNull(),
  model: text('model').notNull(),
  promptTokens: integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  latencyMs: integer('latency_ms').notNull().default(0),
  success: boolean('success').notNull().default(true),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('idx_ai_interactions_user').on(t.userId, t.createdAt)])
```

`src/infrastructure/db/client.ts`:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export type DrizzleClient = ReturnType<typeof createDrizzleClient>

let cachedClient: DrizzleClient | null = null

export const createDrizzleClient = (): ReturnType<typeof drizzle> => {
  if (cachedClient) return cachedClient

  const connectionString = process.env['DATABASE_URL']
  if (!connectionString) throw new Error('DATABASE_URL environment variable is required')

  const queryClient = postgres(connectionString, { max: 10 })
  cachedClient = drizzle(queryClient, { schema })
  return cachedClient
}
```

- [ ] **Step 5: Add scripts to package.json**

Add to `package.json` scripts:
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 6: Verify type check passes**

```bash
npm run type-check
```
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add supabase/ src/infrastructure/db/ drizzle.config.ts
git commit -m "feat: add database schema — Supabase migrations, Drizzle schema, 28 topic seeds"
```

---

### Task 4: Supabase Auth Integration

**Files:**
- Create: `src/infrastructure/supabase/server.ts`, `src/infrastructure/supabase/client.ts`, `src/middleware.ts`
- Create: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`
- Create: `src/app/api/auth/callback/route.ts`
- Create: `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Create Supabase server/client utilities**

`src/infrastructure/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}
```

`src/infrastructure/supabase/client.ts`:
```typescript
'use client'
import { createBrowserClient } from '@supabase/ssr'

export const createSupabaseBrowserClient = () =>
  createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  )
```

- [ ] **Step 2: Create middleware for auth protection**

`src/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/analytics') || pathname.startsWith('/settings')
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup')

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
```

- [ ] **Step 3: Create auth callback route**

`src/app/api/auth/callback/route.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('[Auth Callback]', error)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
```

- [ ] **Step 4: Create login/signup pages**

`src/app/(auth)/login/page.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createSupabaseBrowserClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your credentials to access your DSA dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            No account? <Link href="/signup" className="underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

`src/app/(auth)/signup/page.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createSupabaseBrowserClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) setError(error.message)
    else setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>We sent a confirmation link to {email}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Start tracking your DSA progress today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            Have an account? <Link href="/login" className="underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: Create dashboard layout**

`src/app/(dashboard)/layout.tsx`:
```typescript
import { createSupabaseServerClient } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <span className="font-semibold">DSA Analyzer</span>
        <span className="text-sm text-muted-foreground">{user.email}</span>
      </nav>
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
```

`src/app/(dashboard)/dashboard/page.tsx`:
```typescript
import { createSupabaseServerClient } from '@/infrastructure/supabase/server'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground">Welcome, {user?.email}. Connect your LeetCode profile to get started.</p>
    </div>
  )
}
```

- [ ] **Step 6: Run type check**

```bash
npm run type-check
```
Expected: 0 TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/infrastructure/supabase/ src/middleware.ts src/app/\(auth\)/ src/app/\(dashboard\)/ src/app/api/auth/
git commit -m "feat: add Supabase Auth — login/signup pages, auth middleware, callback route, dashboard layout"
```

---

### Task 5: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  check:
    name: Type Check, Lint & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Run unit tests
        run: npm run test:coverage
        env:
          USE_MOCK_AI: 'true'
          DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test'
          NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321'
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
```

- [ ] **Step 2: Commit**

```bash
git add .github/
git commit -m "chore: add GitHub Actions CI — type-check, lint, vitest on PR"
```

---

## Milestone 2: LeetCode Integration (Days 6–12)

### Task 6: LeetCode GraphQL Client

**Files:**
- Create: `src/infrastructure/leetcode/LeetCodeGraphQLClient.ts`
- Create: `src/infrastructure/leetcode/LeetCodeRateLimiter.ts`
- Create: `src/infrastructure/leetcode/types.ts`
- Test: `src/tests/unit/infrastructure/LeetCodeGraphQLClient.test.ts`

- [ ] **Step 1: Write failing tests**

`src/tests/unit/infrastructure/LeetCodeGraphQLClient.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LeetCodeGraphQLClient } from '@/infrastructure/leetcode/LeetCodeGraphQLClient'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('LeetCodeGraphQLClient', () => {
  let client: LeetCodeGraphQLClient

  beforeEach(() => {
    client = new LeetCodeGraphQLClient()
    mockFetch.mockClear()
  })

  it('returns user stats for public profile', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          matchedUser: {
            submitStats: {
              acSubmissionNum: [
                { difficulty: 'All', count: 150, submissions: 300 },
                { difficulty: 'Easy', count: 80, submissions: 100 },
                { difficulty: 'Medium', count: 60, submissions: 150 },
                { difficulty: 'Hard', count: 10, submissions: 50 },
              ],
            },
            profile: { ranking: 12345 },
          },
        },
      }),
    })

    const result = await client.getUserStats('testuser')
    expect(result).not.toBeNull()
    expect(result?.totalSolved).toBe(150)
    expect(result?.easySolved).toBe(80)
    expect(result?.mediumSolved).toBe(60)
    expect(result?.hardSolved).toBe(10)
  })

  it('returns null for private/non-existent profile', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { matchedUser: null } }),
    })

    const result = await client.getUserStats('nonexistent')
    expect(result).toBeNull()
  })

  it('returns topic stats', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          matchedUser: {
            tagProblemCounts: {
              advanced: [],
              intermediate: [{ tagName: 'Dynamic Programming', tagSlug: 'dynamic-programming', problemsSolved: 15 }],
              fundamental: [{ tagName: 'Array', tagSlug: 'array', problemsSolved: 45 }],
            },
          },
        },
      }),
    })

    const result = await client.getTopicStats('testuser')
    expect(result).toHaveLength(2)
    expect(result[0]?.tagSlug).toBe('dynamic-programming')
    expect(result[0]?.problemsSolved).toBe(15)
  })
})
```

- [ ] **Step 2: Run tests to confirm FAIL**

```bash
npm test -- src/tests/unit/infrastructure/LeetCodeGraphQLClient.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement LeetCode types**

`src/infrastructure/leetcode/types.ts`:
```typescript
export interface LeetCodeUserStats {
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  totalSubmissions: number
  ranking: number | null
}

export interface LeetCodeTopicStat {
  tagName: string
  tagSlug: string
  problemsSolved: number
}

export interface LeetCodeContestInfo {
  rating: number
  ranking: number
  attendedContestsCount: number
}

export interface LeetCodeManualEntry {
  username: string
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
}
```

- [ ] **Step 4: Implement rate limiter**

`src/infrastructure/leetcode/LeetCodeRateLimiter.ts`:
```typescript
export class LeetCodeRateLimiter {
  private readonly maxPerMinute: number
  private requestTimestamps: number[] = []

  constructor(maxPerMinute = 10) {
    this.maxPerMinute = maxPerMinute
  }

  async acquire(): Promise<void> {
    const now = Date.now()
    const oneMinuteAgo = now - 60_000
    this.requestTimestamps = this.requestTimestamps.filter((t) => t > oneMinuteAgo)

    if (this.requestTimestamps.length >= this.maxPerMinute) {
      const oldest = this.requestTimestamps[0]!
      const waitMs = oldest + 60_000 - now + 100
      await new Promise((resolve) => setTimeout(resolve, waitMs))
      return this.acquire()
    }

    this.requestTimestamps.push(now)
  }
}
```

- [ ] **Step 5: Implement GraphQL client**

`src/infrastructure/leetcode/LeetCodeGraphQLClient.ts`:
```typescript
import { LeetCodeRateLimiter } from './LeetCodeRateLimiter'
import type { LeetCodeContestInfo, LeetCodeTopicStat, LeetCodeUserStats } from './types'

const GRAPHQL_URL = 'https://leetcode.com/graphql'

const USER_STATS_QUERY = `
  query getUserStats($username: String!) {
    matchedUser(username: $username) {
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      profile {
        ranking
      }
    }
  }
`

const TOPIC_STATS_QUERY = `
  query getTopicStats($username: String!) {
    matchedUser(username: $username) {
      tagProblemCounts {
        advanced { tagName tagSlug problemsSolved }
        intermediate { tagName tagSlug problemsSolved }
        fundamental { tagName tagSlug problemsSolved }
      }
    }
  }
`

const CONTEST_QUERY = `
  query getContestInfo($username: String!) {
    userContestRanking(username: $username) {
      rating
      globalRanking
      attendedContestsCount
    }
  }
`

export class LeetCodeGraphQLClient {
  private readonly rateLimiter: LeetCodeRateLimiter

  constructor(maxPerMinute = 10) {
    this.rateLimiter = new LeetCodeRateLimiter(maxPerMinute)
  }

  async getUserStats(username: string): Promise<LeetCodeUserStats | null> {
    await this.rateLimiter.acquire()
    const data = await this.query(USER_STATS_QUERY, { username })
    const user = data?.matchedUser
    if (!user) return null

    const byDifficulty = (diff: string) =>
      user.submitStats.acSubmissionNum.find((s: { difficulty: string }) => s.difficulty === diff)

    return {
      totalSolved: byDifficulty('All')?.count ?? 0,
      easySolved: byDifficulty('Easy')?.count ?? 0,
      mediumSolved: byDifficulty('Medium')?.count ?? 0,
      hardSolved: byDifficulty('Hard')?.count ?? 0,
      totalSubmissions: byDifficulty('All')?.submissions ?? 0,
      ranking: user.profile.ranking ?? null,
    }
  }

  async getTopicStats(username: string): Promise<LeetCodeTopicStat[]> {
    await this.rateLimiter.acquire()
    const data = await this.query(TOPIC_STATS_QUERY, { username })
    const counts = data?.matchedUser?.tagProblemCounts
    if (!counts) return []

    return [
      ...(counts.advanced ?? []),
      ...(counts.intermediate ?? []),
      ...(counts.fundamental ?? []),
    ]
  }

  async getContestInfo(username: string): Promise<LeetCodeContestInfo | null> {
    await this.rateLimiter.acquire()
    const data = await this.query(CONTEST_QUERY, { username })
    const ranking = data?.userContestRanking
    if (!ranking) return null

    return {
      rating: ranking.rating,
      ranking: ranking.globalRanking,
      attendedContestsCount: ranking.attendedContestsCount,
    }
  }

  private async query(query: string, variables: Record<string, unknown>): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Referer': 'https://leetcode.com',
    }
    const sessionCookie = process.env['LEETCODE_SESSION_COOKIE']
    if (sessionCookie) headers['Cookie'] = `LEETCODE_SESSION=${sessionCookie}`

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) throw new Error(`LeetCode API error: ${response.status}`)
    const json = await response.json() as { data?: Record<string, unknown>; errors?: unknown[] }
    if (json.errors?.length) throw new Error(`LeetCode GraphQL error: ${JSON.stringify(json.errors)}`)
    return json.data ?? {}
  }
}
```

- [ ] **Step 6: Run tests to confirm PASS**

```bash
npm test -- src/tests/unit/infrastructure/LeetCodeGraphQLClient.test.ts
```
Expected: 3 tests passing.

- [ ] **Step 7: Commit**

```bash
git add src/infrastructure/leetcode/ src/tests/unit/infrastructure/
git commit -m "feat: add LeetCode GraphQL client with rate limiter and topic stats"
```

---

### Task 7: LeetCode Sync API Route & Profile Connection

**Files:**
- Create: `src/app/api/leetcode/connect/route.ts`
- Create: `src/app/api/leetcode/sync/route.ts`
- Create: `src/application/use-cases/ConnectLeetCodeProfile.ts`
- Create: `src/application/use-cases/TakeDailySnapshot.ts`
- Create: `src/infrastructure/repositories/SupabaseLeetCodeProfileRepository.ts`
- Create: `src/infrastructure/repositories/SupabaseSnapshotRepository.ts`

(Full implementation as described in architecture design, using Drizzle queries and repository interfaces from Task 2.)

- [ ] **Step 1: Write failing test for ConnectLeetCodeProfile use case**
- [ ] **Step 2: Implement use case with mock repos — confirm PASS**
- [ ] **Step 3: Implement SupabaseLeetCodeProfileRepository**
- [ ] **Step 4: Implement SupabaseSnapshotRepository**
- [ ] **Step 5: Create /api/leetcode/connect route (validate username → save profile)**
- [ ] **Step 6: Create /api/leetcode/sync route (fetch GraphQL → save snapshot)**
- [ ] **Step 7: Manual sync cooldown (5 min, check lastSyncedAt)**
- [ ] **Step 8: Manual entry fallback endpoint**
- [ ] **Step 9: Tests pass, commit**

---

## Milestone 3: Dashboard & Analytics (Days 13–20)

### Task 8: Analytics Domain Services

**Files:**
- Create: `src/domain/services/MasteryCalculator.ts`
- Create: `src/domain/services/ReadinessCalculator.ts`
- Create: `src/domain/services/WeaknessDetector.ts`
- Create: `src/domain/services/VelocityCalculator.ts`
- Test: `src/tests/unit/domain/analytics.test.ts`

**Key formulas:**
- MasteryScore = `Math.min(100, (solved / topicTotalProblems) * 100 * difficultyWeight)`
- CompanyReadiness = `Σ(topicMastery * topicWeight)` for company-specific weights
- Velocity = `(latestSnapshot.totalSolved - earliestSnapshot.totalSolved) / daysDiff`
- Weakness = topics with masteryScore < 40

(Full TDD implementation with tests first.)

- [ ] **Step 1 - Step 8: TDD implementation with tests, commit**

---

### Task 9: Analytics API & Dashboard UI

**Files:**
- Create: `src/app/api/analytics/route.ts`
- Create: `src/app/(dashboard)/dashboard/page.tsx` (full version)
- Create: `src/presentation/components/charts/DifficultyPieChart.tsx`
- Create: `src/presentation/components/charts/TopicRadarChart.tsx`
- Create: `src/presentation/components/charts/ProgressLineChart.tsx`
- Create: `src/presentation/components/charts/CompanyReadinessBar.tsx`
- Create: `src/presentation/components/stats/StatsCard.tsx`
- Create: `src/presentation/hooks/useAnalytics.ts`

(TanStack Query for data fetching, Recharts for visualizations, Skeleton loaders for async states.)

---

## Milestone 4: AI Recommendations & Study Plans (Days 21–28)

### Task 10: AI Provider Abstraction & Claude Code SDK Integration

**Files:**
- Create: `src/infrastructure/ai/AIProvider.ts` (interface)
- Create: `src/infrastructure/ai/ClaudeCodeProvider.ts`
- Create: `src/infrastructure/ai/MockAIProvider.ts` (for tests)
- Create: `src/infrastructure/ai/prompts/analyze-progress.ts`
- Create: `src/infrastructure/ai/prompts/generate-recommendations.ts`
- Create: `src/infrastructure/ai/prompts/generate-study-plan.ts`
- Create: `src/infrastructure/ai/AIOrchestrationService.ts`

**AIProvider interface:**
```typescript
export interface AIOptions {
  model?: string
  maxTokens?: number
  systemPrompt?: string
}

export interface AIResponse {
  content: string
  promptTokens: number
  completionTokens: number
  model: string
}

export interface AIProvider {
  runPrompt(prompt: string, options?: AIOptions): Promise<AIResponse>
}
```

**ClaudeCodeProvider** uses `@anthropic-ai/claude-code` SDK to spawn the claude CLI as a subprocess.

**MockAIProvider** returns deterministic canned responses for tests — controlled by `USE_MOCK_AI=true`.

---

### Task 11: Recommendation & Study Plan API

**Files:**
- Create: `src/app/api/recommendations/route.ts`
- Create: `src/app/api/study-plans/route.ts`
- Create: `src/app/api/study-plans/[id]/route.ts`
- Create: `src/application/services/RecommendationService.ts`
- Create: `src/application/services/StudyPlanService.ts`
- Create: `src/infrastructure/repositories/SupabaseRecommendationRepository.ts`
- Create: `src/infrastructure/repositories/SupabaseStudyPlanRepository.ts`

---

## Milestone 5: Polish & Test Coverage (Days 29–35)

### Task 12: E2E Tests & Coverage

**Files:**
- Create: `tests/e2e/auth.spec.ts`
- Create: `tests/e2e/dashboard.spec.ts`
- Create: `tests/e2e/study-plan.spec.ts`
- Create: `playwright.config.ts`

**Acceptance criteria:**
- `npm run test:coverage` ≥ 80% line coverage
- `npm run test:e2e` passes against local Supabase
- `npm run type-check` exits 0
- Lighthouse performance ≥ 85 on dashboard

---

## Verification

End-to-end smoke test after each milestone:

**Milestone 1:** `npm run build` succeeds; sign up → log in → see empty dashboard → log out works.

**Milestone 2:** Connect LeetCode username → click Sync → see solve counts update in dashboard.

**Milestone 3:** Dashboard renders 4 charts with real data; company readiness bars show percentages.

**Milestone 4:** "Generate Recommendations" → see 5+ prioritized items; create 30-day study plan.

**Milestone 5:** `npm run test:coverage` ≥ 80%; all Playwright tests green.
