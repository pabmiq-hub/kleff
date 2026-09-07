ALTER TABLE public.registration_forms
  ADD COLUMN IF NOT EXISTS reminder_offsets_hours integer[] NOT NULL DEFAULT ARRAY[72,48,24];