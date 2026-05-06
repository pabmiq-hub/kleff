
-- Add locale column to content_sections so each language has its own row.
-- Existing rows are treated as Spanish (the default).
ALTER TABLE public.content_sections
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'es';

-- Drop the old single-key unique constraint and replace it with (section_key, locale)
ALTER TABLE public.content_sections
  DROP CONSTRAINT IF EXISTS content_sections_section_key_key;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'content_sections_section_key_locale_key'
  ) THEN
    ALTER TABLE public.content_sections
      ADD CONSTRAINT content_sections_section_key_locale_key UNIQUE (section_key, locale);
  END IF;
END $$;

-- Replace the single-column index with a composite to match new lookups.
DROP INDEX IF EXISTS public.content_sections_key_idx;
CREATE INDEX IF NOT EXISTS content_sections_key_locale_idx
  ON public.content_sections (section_key, locale);

-- History table: add locale too so we can track per-language history.
ALTER TABLE public.content_section_history
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'es';

-- Update the snapshot trigger so it carries the locale into history.
CREATE OR REPLACE FUNCTION public.snapshot_content_section()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only snapshot when content actually changes
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO public.content_section_history (section_key, locale, content, schema_version, saved_by)
    VALUES (OLD.section_key, OLD.locale, OLD.content, OLD.schema_version, OLD.updated_by);
  END IF;
  RETURN NEW;
END;
$$;
