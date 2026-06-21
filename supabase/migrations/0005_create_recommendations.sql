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

CREATE INDEX idx_recommendations_user_active
  ON public.recommendations(user_id, is_completed, expires_at);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recommendations"
  ON public.recommendations FOR ALL USING (auth.uid() = user_id);
