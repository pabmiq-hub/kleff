ALTER TABLE public.kon_events ADD COLUMN IF NOT EXISTS secondary_event_name text;
ALTER TABLE public.kon_participants ADD COLUMN IF NOT EXISTS registration_variant text NOT NULL DEFAULT 'primary';
DO $$ BEGIN
  ALTER TABLE public.kon_participants ADD CONSTRAINT kon_participants_registration_variant_check CHECK (registration_variant IN ('primary','secondary'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;