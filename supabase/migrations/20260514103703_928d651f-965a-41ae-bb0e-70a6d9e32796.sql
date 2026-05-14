
-- 1. Enums for shelf, shape, drawer letter
DO $$ BEGIN
  CREATE TYPE public.shelf_location AS ENUM ('1','2','3','4','on_demand','drawer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.shelf_shape AS ENUM ('triangle','heart','square');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.drawer_letter AS ENUM ('a','b','c','d');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Add manual editable fields to bgg_games
ALTER TABLE public.bgg_games
  ADD COLUMN IF NOT EXISTS shelf public.shelf_location,
  ADD COLUMN IF NOT EXISTS shape public.shelf_shape,
  ADD COLUMN IF NOT EXISTS slot_number smallint,
  ADD COLUMN IF NOT EXISTS drawer_number smallint,
  ADD COLUMN IF NOT EXISTS drawer_letter public.drawer_letter,
  ADD COLUMN IF NOT EXISTS notes_admin text;

-- Coherence trigger: shape/slot only valid for shelf 1-4; drawer fields only for drawer
CREATE OR REPLACE FUNCTION public.validate_bgg_game_location()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.shelf IN ('1','2','3','4') THEN
    IF NEW.drawer_number IS NOT NULL OR NEW.drawer_letter IS NOT NULL THEN
      RAISE EXCEPTION 'drawer_* must be null for shelf 1-4';
    END IF;
    IF NEW.slot_number IS NOT NULL AND (NEW.slot_number < 1 OR NEW.slot_number > 5) THEN
      RAISE EXCEPTION 'slot_number must be 1..5';
    END IF;
  ELSIF NEW.shelf = 'drawer' THEN
    IF NEW.shape IS NOT NULL OR NEW.slot_number IS NOT NULL THEN
      RAISE EXCEPTION 'shape/slot_number must be null for drawer';
    END IF;
    IF NEW.drawer_number IS NOT NULL AND (NEW.drawer_number < 1 OR NEW.drawer_number > 4) THEN
      RAISE EXCEPTION 'drawer_number must be 1..4';
    END IF;
  ELSIF NEW.shelf = 'on_demand' OR NEW.shelf IS NULL THEN
    NEW.shape := NULL;
    NEW.slot_number := NULL;
    NEW.drawer_number := NULL;
    NEW.drawer_letter := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bgg_games_validate_location ON public.bgg_games;
CREATE TRIGGER bgg_games_validate_location
  BEFORE INSERT OR UPDATE ON public.bgg_games
  FOR EACH ROW EXECUTE FUNCTION public.validate_bgg_game_location();

-- 3. rental_settings (singleton)
CREATE TABLE IF NOT EXISTS public.rental_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  game_night_weekday smallint NOT NULL DEFAULT 3 CHECK (game_night_weekday BETWEEN 0 AND 6),
  cooldown_weeks smallint NOT NULL DEFAULT 4 CHECK (cooldown_weeks >= 0),
  monthly_quota smallint NOT NULL DEFAULT 2 CHECK (monthly_quota >= 0),
  block_if_overdue boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

INSERT INTO public.rental_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

ALTER TABLE public.rental_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rental_settings_select_public ON public.rental_settings;
CREATE POLICY rental_settings_select_public ON public.rental_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS rental_settings_admin_update ON public.rental_settings;
CREATE POLICY rental_settings_admin_update ON public.rental_settings
  FOR UPDATE TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

-- 4. rental_requests: add waitlist + dates
DO $$ BEGIN
  ALTER TYPE public.rental_request_status ADD VALUE IF NOT EXISTS 'waitlisted';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.rental_request_status ADD VALUE IF NOT EXISTS 'approved';
EXCEPTION WHEN others THEN NULL; END $$;

ALTER TABLE public.rental_requests
  ADD COLUMN IF NOT EXISTS pickup_date date,
  ADD COLUMN IF NOT EXISTS return_date date,
  ADD COLUMN IF NOT EXISTS waitlist_position smallint;

CREATE INDEX IF NOT EXISTS rental_requests_game_pickup_idx
  ON public.rental_requests (game_id, pickup_date, status);
