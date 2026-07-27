ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dues_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dues_paid_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS dues_paid_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;