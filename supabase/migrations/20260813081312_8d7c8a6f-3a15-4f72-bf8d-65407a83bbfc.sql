ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_locale text NOT NULL DEFAULT 'es';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_preferred_locale_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_preferred_locale_check CHECK (preferred_locale IN ('es','ca','en'));

ALTER TABLE public.poll_options
  ADD COLUMN IF NOT EXISTS label_ca text,
  ADD COLUMN IF NOT EXISTS label_en text,
  ADD COLUMN IF NOT EXISTS description_ca text,
  ADD COLUMN IF NOT EXISTS description_en text;