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

CREATE POLICY "Users can view own leetcode profile"
  ON public.leetcode_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leetcode profile"
  ON public.leetcode_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leetcode profile"
  ON public.leetcode_profiles FOR UPDATE USING (auth.uid() = user_id);
