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
  ON public.daily_snapshots FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own topic snapshots"
  ON public.topic_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_snapshots ds
      WHERE ds.id = topic_snapshots.snapshot_id AND ds.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert topic snapshots"
  ON public.topic_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.daily_snapshots ds
      WHERE ds.id = topic_snapshots.snapshot_id AND ds.user_id = auth.uid()
    )
  );
