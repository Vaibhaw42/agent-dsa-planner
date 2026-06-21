-- ─── RLS hardening ──────────────────────────────────────────────────────────
-- Closes RLS holes flagged in the security audit:
--   * `topics`, `ai_interactions`, `local_auth_users`, `local_auth_sessions`
--     had RLS disabled; anon Supabase key could read everything.
--   * `daily_snapshots`, `recommendations`, `study_plans`, `study_plan_items`
--     used `FOR ALL ... USING (...)` with no `WITH CHECK`, so the auth check
--     applied to SELECT but not to INSERT/UPDATE writes.
--
-- NOTE: This only defends against direct anon-key access. The app itself
-- connects via DATABASE_URL (likely a superuser role) and BYPASSES RLS.
-- That's a separate architectural concern; tracked but not fixed here.

-- topics: world-readable catalog, no writes from clients ────────────────────
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Topics are publicly readable" ON public.topics;
CREATE POLICY "Topics are publicly readable"
  ON public.topics FOR SELECT
  USING (true);

-- ai_interactions: per-user audit log ──────────────────────────────────────
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own ai interactions" ON public.ai_interactions;
CREATE POLICY "Users view own ai interactions"
  ON public.ai_interactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own ai interactions" ON public.ai_interactions;
CREATE POLICY "Users insert own ai interactions"
  ON public.ai_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- local_auth_*: never readable via PostgREST anon ─────────────────────────
-- These tables hold password hashes + session tokens. Server-side code
-- talks to them through Drizzle/DATABASE_URL (superuser, bypasses RLS).
-- Anon role must NEVER see them.
ALTER TABLE public.local_auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_auth_sessions ENABLE ROW LEVEL SECURITY;
-- No policies = no access for any non-superuser role.
-- Supabase ships with `anon` + `authenticated` roles; plain Postgres does not.
-- Guard the REVOKEs so the migration is portable across both.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON public.local_auth_users FROM anon';
    EXECUTE 'REVOKE ALL ON public.local_auth_sessions FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.local_auth_users FROM authenticated';
    EXECUTE 'REVOKE ALL ON public.local_auth_sessions FROM authenticated';
  END IF;
END$$;

-- Add WITH CHECK to existing FOR ALL policies on user-owned tables ────────
-- These policies were write-permissive: USING applies to SELECT/UPDATE/DELETE
-- but INSERT needs WITH CHECK to enforce user_id matches auth.uid().

DROP POLICY IF EXISTS "Users view own snapshots" ON public.daily_snapshots;
CREATE POLICY "Users manage own snapshots"
  ON public.daily_snapshots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own recommendations" ON public.recommendations;
CREATE POLICY "Users manage own recommendations"
  ON public.recommendations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own study plans" ON public.study_plans;
CREATE POLICY "Users manage own study plans"
  ON public.study_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own study plan items" ON public.study_plan_items;
CREATE POLICY "Users manage own study plan items"
  ON public.study_plan_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.study_plans sp
      WHERE sp.id = study_plan_items.study_plan_id AND sp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_plans sp
      WHERE sp.id = study_plan_items.study_plan_id AND sp.user_id = auth.uid()
    )
  );
