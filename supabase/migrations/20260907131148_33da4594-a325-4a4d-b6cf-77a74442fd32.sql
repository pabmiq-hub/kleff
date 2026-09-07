ALTER TABLE public.registration_responses
  ADD COLUMN IF NOT EXISTS reminder_email_ids jsonb NOT NULL DEFAULT '[]'::jsonb;