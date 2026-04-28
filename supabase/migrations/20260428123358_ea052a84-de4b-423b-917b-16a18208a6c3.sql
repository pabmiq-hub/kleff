ALTER TABLE public.rental_games RENAME TO bgg_games;

ALTER POLICY rental_games_select_authenticated ON public.bgg_games RENAME TO bgg_games_select_authenticated;
ALTER POLICY rental_games_admin_insert ON public.bgg_games RENAME TO bgg_games_admin_insert;
ALTER POLICY rental_games_admin_update ON public.bgg_games RENAME TO bgg_games_admin_update;
ALTER POLICY rental_games_admin_delete ON public.bgg_games RENAME TO bgg_games_admin_delete;

DROP POLICY bgg_games_select_authenticated ON public.bgg_games;
CREATE POLICY bgg_games_select_public
  ON public.bgg_games FOR SELECT
  TO anon, authenticated
  USING (true);

ALTER TABLE public.bgg_games
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS year_published smallint,
  ADD COLUMN IF NOT EXISTS min_age smallint,
  ADD COLUMN IF NOT EXISTS min_playtime smallint,
  ADD COLUMN IF NOT EXISTS max_playtime smallint,
  ADD COLUMN IF NOT EXISTS bgg_rating numeric(4,2),
  ADD COLUMN IF NOT EXISTS bgg_rating_users integer,
  ADD COLUMN IF NOT EXISTS bgg_weight numeric(4,2),
  ADD COLUMN IF NOT EXISTS bgg_weight_users integer,
  ADD COLUMN IF NOT EXISTS bgg_rank integer,
  ADD COLUMN IF NOT EXISTS bgg_type text,
  ADD COLUMN IF NOT EXISTS categories text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS mechanics text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS families text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS designers text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS publishers text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS bgg_url text,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS bgg_games_bgg_id_unique ON public.bgg_games (bgg_id) WHERE bgg_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS bgg_games_rating_idx ON public.bgg_games (bgg_rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS bgg_games_weight_idx ON public.bgg_games (bgg_weight);
CREATE INDEX IF NOT EXISTS bgg_games_mechanics_idx ON public.bgg_games USING gin (mechanics);
CREATE INDEX IF NOT EXISTS bgg_games_categories_idx ON public.bgg_games USING gin (categories);

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;