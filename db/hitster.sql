-- Hitster module (bingo musical para eventos KLEFF).
-- Service-role only; participants are anonymous pseudonyms identified by a per-browser token + 6-char recovery code.

CREATE TABLE IF NOT EXISTS public.hitster_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  side text NOT NULL DEFAULT 'A' CHECK (side IN ('A', 'B')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'playing', 'tiebreak', 'finished')),
  timer_seconds integer NOT NULL DEFAULT 30 CHECK (timer_seconds BETWEEN 5 AND 300),
  current_round_id uuid,
  winner_participant_ids uuid[] NOT NULL DEFAULT '{}',
  tiebreak_participant_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hitster_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.hitster_games(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  category_key text NOT NULL CHECK (category_key IN ('green', 'pink', 'yellow', 'purple', 'blue')),
  phase text NOT NULL DEFAULT 'answering' CHECK (phase IN ('answering', 'validating', 'closed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  revealed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, round_number)
);

CREATE TABLE IF NOT EXISTS public.hitster_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.hitster_games(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  nickname_key text NOT NULL,
  avatar_url text NOT NULL,
  token text NOT NULL UNIQUE,
  access_code text NOT NULL,
  language text NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'ca', 'en')),
  board jsonb NOT NULL,
  marks jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, nickname_key),
  UNIQUE (game_id, access_code)
);

CREATE TABLE IF NOT EXISTS public.hitster_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.hitster_games(id) ON DELETE CASCADE,
  round_id uuid NOT NULL REFERENCES public.hitster_rounds(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.hitster_participants(id) ON DELETE CASCADE,
  answer_text text NOT NULL DEFAULT '',
  is_correct boolean,
  is_exact_year boolean NOT NULL DEFAULT false,
  marked_cell integer CHECK (marked_cell IS NULL OR (marked_cell >= 0 AND marked_cell < 25)),
  punished_participant_id uuid REFERENCES public.hitster_participants(id) ON DELETE SET NULL,
  punished_cell integer CHECK (punished_cell IS NULL OR (punished_cell >= 0 AND punished_cell < 25)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_id, participant_id)
);

CREATE TABLE IF NOT EXISTS public.hitster_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.hitster_games(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  invited_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, email)
);

CREATE INDEX IF NOT EXISTS hitster_rounds_game_idx ON public.hitster_rounds(game_id, round_number DESC);
CREATE INDEX IF NOT EXISTS hitster_participants_game_idx ON public.hitster_participants(game_id);
CREATE INDEX IF NOT EXISTS hitster_answers_round_idx ON public.hitster_answers(round_id);
CREATE INDEX IF NOT EXISTS hitster_collaborators_game_idx ON public.hitster_collaborators(game_id);

GRANT ALL ON public.hitster_games TO service_role;
GRANT ALL ON public.hitster_rounds TO service_role;
GRANT ALL ON public.hitster_participants TO service_role;
GRANT ALL ON public.hitster_answers TO service_role;
GRANT ALL ON public.hitster_collaborators TO service_role;

ALTER TABLE public.hitster_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hitster_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hitster_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hitster_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hitster_collaborators ENABLE ROW LEVEL SECURITY;