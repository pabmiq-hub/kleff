ALTER TABLE public.registration_forms
  ADD COLUMN IF NOT EXISTS description_html text,
  ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS legal_info_html text,
  ADD COLUMN IF NOT EXISTS legal_info_enabled boolean NOT NULL DEFAULT true;