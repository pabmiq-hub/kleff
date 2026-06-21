ALTER TABLE public.registration_forms
  ADD COLUMN IF NOT EXISTS cover_position text NOT NULL DEFAULT 'center center',
  ADD COLUMN IF NOT EXISTS external_iframe_height integer NOT NULL DEFAULT 2400;