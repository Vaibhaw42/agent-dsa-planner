CREATE TYPE topic_category AS ENUM ('data_structures', 'algorithms', 'math', 'other');

CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category topic_category NOT NULL DEFAULT 'other'
);
