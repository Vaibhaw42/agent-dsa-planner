import {
  boolean,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

export const topicCategoryEnum = pgEnum('topic_category', [
  'data_structures',
  'algorithms',
  'math',
  'other',
])

export const recommendationTypeEnum = pgEnum('recommendation_type', [
  'problem',
  'topic',
  'pattern',
  'revision',
])

export const studyPlanStatusEnum = pgEnum('study_plan_status', [
  'active',
  'completed',
  'paused',
])

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const leetcodeProfiles = pgTable(
  'leetcode_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    username: text('username').notNull().unique(),
    isVerified: boolean('is_verified').notNull().default(false),
    isPublic: boolean('is_public').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  },
  (t) => [index('idx_leetcode_profiles_user_id').on(t.userId)],
)

export const topics = pgTable('topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  category: topicCategoryEnum('category').notNull().default('other'),
})

export const dailySnapshots = pgTable(
  'daily_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    leetcodeProfileId: uuid('leetcode_profile_id')
      .notNull()
      .references(() => leetcodeProfiles.id, { onDelete: 'cascade' }),
    snapshotDate: date('snapshot_date').notNull(),
    totalSolved: integer('total_solved').notNull().default(0),
    easySolved: integer('easy_solved').notNull().default(0),
    mediumSolved: integer('medium_solved').notNull().default(0),
    hardSolved: integer('hard_solved').notNull().default(0),
    totalSubmissions: integer('total_submissions').notNull().default(0),
    ranking: integer('ranking'),
    contestRating: decimal('contest_rating', { precision: 8, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_snapshots_user_date').on(t.userId, t.snapshotDate),
    unique().on(t.userId, t.snapshotDate),
  ],
)

export const topicSnapshots = pgTable(
  'topic_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    snapshotId: uuid('snapshot_id')
      .notNull()
      .references(() => dailySnapshots.id, { onDelete: 'cascade' }),
    topicId: uuid('topic_id')
      .notNull()
      .references(() => topics.id),
    solved: integer('solved').notNull().default(0),
    attempted: integer('attempted').notNull().default(0),
    masteryScore: decimal('mastery_score', { precision: 5, scale: 2 }).notNull().default('0'),
  },
  (t) => [
    index('idx_topic_snapshots_snapshot').on(t.snapshotId),
    unique().on(t.snapshotId, t.topicId),
  ],
)

export const recommendations = pgTable(
  'recommendations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: recommendationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    reasoning: text('reasoning').notNull().default(''),
    priority: integer('priority').notNull().default(5),
    metadata: jsonb('metadata').notNull().default({}),
    isCompleted: boolean('is_completed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('idx_recommendations_user_active').on(t.userId, t.isCompleted, t.expiresAt)],
)

export const studyPlans = pgTable('study_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  targetCompany: text('target_company'),
  targetDate: date('target_date').notNull(),
  status: studyPlanStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const studyPlanItems = pgTable(
  'study_plan_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studyPlanId: uuid('study_plan_id')
      .notNull()
      .references(() => studyPlans.id, { onDelete: 'cascade' }),
    topicSlug: text('topic_slug'),
    problemSlug: text('problem_slug'),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    orderIndex: integer('order_index').notNull(),
    isCompleted: boolean('is_completed').notNull().default(false),
    scheduledDate: date('scheduled_date').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [index('idx_study_plan_items_plan').on(t.studyPlanId, t.orderIndex)],
)

export const aiInteractions = pgTable(
  'ai_interactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    interactionType: text('interaction_type').notNull(),
    model: text('model').notNull(),
    promptTokens: integer('prompt_tokens').notNull().default(0),
    completionTokens: integer('completion_tokens').notNull().default(0),
    latencyMs: integer('latency_ms').notNull().default(0),
    success: boolean('success').notNull().default(true),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_ai_interactions_user').on(t.userId, t.createdAt)],
)

// ─── Local auth tables (used only when AUTH_PROVIDER=local) ───────────────────

export const localAuthUsers = pgTable('local_auth_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const localAuthSessions = pgTable(
  'local_auth_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => localAuthUsers.id, { onDelete: 'cascade' }),
    sessionToken: text('session_token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_local_sessions_token').on(t.sessionToken)],
)
