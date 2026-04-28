-- Add locale column
ALTER TABLE public.content_overrides
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'es';

-- Drop old unique index/constraint if present, then create new one including locale
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.content_overrides'::regclass
      AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.content_overrides DROP CONSTRAINT %I', c.conname);
  END LOOP;
END$$;

DROP INDEX IF EXISTS content_overrides_page_path_element_id_property_status_key;

ALTER TABLE public.content_overrides
  ADD CONSTRAINT content_overrides_unique_key
  UNIQUE (page_path, element_id, property, status, locale);

CREATE INDEX IF NOT EXISTS idx_content_overrides_lookup
  ON public.content_overrides (page_path, status, locale);
