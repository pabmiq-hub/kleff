ALTER TABLE public.registration_forms
  ADD COLUMN IF NOT EXISTS event_date timestamptz,
  ADD COLUMN IF NOT EXISTS event_location text,
  ADD COLUMN IF NOT EXISTS allow_guests boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_guests_per_response integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS send_confirmation_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS confirmation_email_subject text,
  ADD COLUMN IF NOT EXISTS confirmation_email_body text,
  ADD COLUMN IF NOT EXISTS reminder_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_subject text,
  ADD COLUMN IF NOT EXISTS reminder_body text,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

ALTER TABLE public.registration_responses
  ADD COLUMN IF NOT EXISTS guests_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancel_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS registration_responses_cancel_token_idx
  ON public.registration_responses (cancel_token);

ALTER TABLE public.registration_questions
  ADD COLUMN IF NOT EXISTS special text,
  ADD COLUMN IF NOT EXISTS hide_after_wednesday boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'registration_questions_special_check'
  ) THEN
    ALTER TABLE public.registration_questions
      ADD CONSTRAINT registration_questions_special_check
      CHECK (special IS NULL OR special IN ('guests', 'game_pick'));
  END IF;
END $$;