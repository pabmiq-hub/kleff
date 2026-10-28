CREATE TABLE IF NOT EXISTS public.contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('draft','open','closed')),
  raffle_winner_id uuid,
  raffled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.contest_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.contest_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  name text NOT NULL,
  photo_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.contest_entry_categories (
  entry_id uuid NOT NULL REFERENCES public.contest_entries(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.contest_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, category_id)
);
CREATE TABLE IF NOT EXISTS public.contest_voters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.contest_votes (
  voter_id uuid NOT NULL REFERENCES public.contest_voters(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.contest_categories(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.contest_entries(id) ON DELETE CASCADE,
  PRIMARY KEY (voter_id, category_id, entry_id)
);
GRANT ALL ON public.contests, public.contest_categories, public.contest_entries,
  public.contest_entry_categories, public.contest_voters, public.contest_votes TO service_role;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_entry_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_votes ENABLE ROW LEVEL SECURITY;
