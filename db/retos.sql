-- Retos (misiones con sorteo). Service-role only: participantes acceden por token vía funciones de servidor.
CREATE TABLE IF NOT EXISTS public.reto_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  event_date timestamptz,
  location text,
  cover_url text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('draft','open','closed')),
  social_accounts text[] NOT NULL DEFAULT ARRAY['kleff.bcn'],
  connection_per_person int NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.reto_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.reto_events(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('social','conexion')),
  kind text NOT NULL DEFAULT 'custom' CHECK (kind IN ('follow','post','story','ludoya','custom','connection')),
  title text NOT NULL,
  tickets int NOT NULL DEFAULT 1 CHECK (tickets BETWEEN 0 AND 100),
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reto_missions_event_idx ON public.reto_missions(event_id);
CREATE TABLE IF NOT EXISTS public.reto_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.reto_events(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  nickname_key text NOT NULL,
  avatar_url text,
  token text NOT NULL UNIQUE,
  access_code text NOT NULL,
  member_user_id uuid,
  extra_tickets int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, nickname_key),
  UNIQUE (event_id, access_code)
);
CREATE TABLE IF NOT EXISTS public.reto_assignments (
  participant_id uuid NOT NULL REFERENCES public.reto_participants(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES public.reto_missions(id) ON DELETE CASCADE,
  PRIMARY KEY (participant_id, mission_id)
);
CREATE TABLE IF NOT EXISTS public.reto_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.reto_events(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES public.reto_missions(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.reto_participants(id) ON DELETE CASCADE,
  partner_ids uuid[] NOT NULL DEFAULT '{}',
  evidence text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  confirmed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS reto_completions_active_uniq ON public.reto_completions(participant_id, mission_id) WHERE status <> 'rejected';
CREATE TABLE IF NOT EXISTS public.reto_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.reto_events(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.reto_participants(id) ON DELETE CASCADE,
  number int NOT NULL,
  source text NOT NULL DEFAULT 'mission',
  completion_id uuid REFERENCES public.reto_completions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, number)
);
CREATE TABLE IF NOT EXISTS public.reto_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.reto_events(id) ON DELETE CASCADE,
  from_id uuid NOT NULL REFERENCES public.reto_participants(id) ON DELETE CASCADE,
  to_id uuid NOT NULL REFERENCES public.reto_participants(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX IF NOT EXISTS reto_messages_pair_idx ON public.reto_messages(event_id, to_id, from_id);
CREATE TABLE IF NOT EXISTS public.reto_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.reto_events(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES public.reto_tickets(id) ON DELETE CASCADE,
  prize text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Numeración secuencial bajo bloqueo del evento.
CREATE OR REPLACE FUNCTION public.reto_award_tickets(_event uuid, _participant uuid, _count int, _source text, _completion uuid)
RETURNS int[] LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int; out int[] := '{}'; i int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('reto:' || _event::text));
  SELECT coalesce(max(number),0) INTO n FROM reto_tickets WHERE event_id = _event;
  FOR i IN 1.._count LOOP
    n := n + 1;
    INSERT INTO reto_tickets(event_id, participant_id, number, source, completion_id) VALUES (_event, _participant, n, _source, _completion);
    out := out || n;
  END LOOP;
  RETURN out;
END $$;
REVOKE ALL ON FUNCTION public.reto_award_tickets(uuid,uuid,int,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reto_award_tickets(uuid,uuid,int,text,uuid) TO service_role;

GRANT ALL ON public.reto_events, public.reto_missions, public.reto_participants, public.reto_assignments,
  public.reto_completions, public.reto_tickets, public.reto_messages, public.reto_draws TO service_role;
ALTER TABLE public.reto_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reto_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reto_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reto_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reto_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reto_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reto_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reto_draws ENABLE ROW LEVEL SECURITY;
