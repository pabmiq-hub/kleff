
ALTER TABLE public.media_appearances
  ADD COLUMN IF NOT EXISTS title_es text,
  ADD COLUMN IF NOT EXISTS title_ca text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS description_es text,
  ADD COLUMN IF NOT EXISTS description_ca text,
  ADD COLUMN IF NOT EXISTS description_en text;

-- Backfill spanish from existing single-language columns
UPDATE public.media_appearances
  SET title_es = COALESCE(title_es, title),
      description_es = COALESCE(description_es, description)
  WHERE title_es IS NULL OR (description IS NOT NULL AND description_es IS NULL);
