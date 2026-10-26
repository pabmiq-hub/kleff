-- Castle map for Juegos: places, examinable features and per-player reads. Server-only (service_role).
ALTER TABLE public.mm_games ADD COLUMN IF NOT EXISTS map_url text;

CREATE TABLE IF NOT EXISTS public.mm_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.mm_games(id) ON DELETE CASCADE,
  ref text NOT NULL,
  name text NOT NULL,
  description text,
  act_id uuid REFERENCES public.mm_acts(id) ON DELETE SET NULL,
  x numeric NOT NULL DEFAULT 50,
  y numeric NOT NULL DEFAULT 50,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, ref)
);

CREATE TABLE IF NOT EXISTS public.mm_location_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.mm_games(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.mm_locations(id) ON DELETE CASCADE,
  ref text NOT NULL,
  name text NOT NULL,
  teaser text,
  locked_hint text,
  content text NOT NULL,
  image_url text,
  act_id uuid REFERENCES public.mm_acts(id) ON DELETE SET NULL,
  requires jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_id uuid REFERENCES public.mm_evidences(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, ref)
);

CREATE TABLE IF NOT EXISTS public.mm_feature_reads (
  session_player_id uuid NOT NULL REFERENCES public.mm_session_players(id) ON DELETE CASCADE,
  feature_id uuid NOT NULL REFERENCES public.mm_location_features(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.mm_sessions(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_player_id, feature_id)
);

CREATE INDEX IF NOT EXISTS mm_locations_game_idx ON public.mm_locations(game_id);
CREATE INDEX IF NOT EXISTS mm_location_features_loc_idx ON public.mm_location_features(location_id);
CREATE INDEX IF NOT EXISTS mm_feature_reads_session_idx ON public.mm_feature_reads(session_id);

REVOKE ALL ON public.mm_locations, public.mm_location_features, public.mm_feature_reads FROM anon, authenticated;
GRANT ALL ON public.mm_locations, public.mm_location_features, public.mm_feature_reads TO service_role;
ALTER TABLE public.mm_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mm_location_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mm_feature_reads ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
