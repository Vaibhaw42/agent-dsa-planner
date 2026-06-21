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

CREATE INDEX idx_study_plan_items_plan
  ON public.study_plan_items(study_plan_id, order_index);

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own study plans"
  ON public.study_plans FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own study plan items"
  ON public.study_plan_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.study_plans sp
      WHERE sp.id = study_plan_items.study_plan_id AND sp.user_id = auth.uid()
    )
  );
