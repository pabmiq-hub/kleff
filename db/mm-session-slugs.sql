ALTER TABLE public.mm_sessions ADD COLUMN IF NOT EXISTS join_slug text;
ALTER TABLE public.mm_sessions ALTER COLUMN join_slug SET DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
UPDATE public.mm_sessions SET join_slug = substr(replace(id::text, '-', ''), 1, 10) WHERE join_slug IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS mm_sessions_join_slug_unique ON public.mm_sessions (join_slug);
ALTER TABLE public.mm_sessions ALTER COLUMN join_slug SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.mm_sessions'::regclass AND conname = 'mm_sessions_join_slug_format') THEN
    ALTER TABLE public.mm_sessions ADD CONSTRAINT mm_sessions_join_slug_format
      CHECK (char_length(join_slug) BETWEEN 3 AND 48 AND join_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  END IF;
END $$;
COMMENT ON COLUMN public.mm_sessions.join_slug IS 'Editable public join-link identifier only; never a player credential. Long UUID join links remain supported.';
NOTIFY pgrst, 'reload schema';