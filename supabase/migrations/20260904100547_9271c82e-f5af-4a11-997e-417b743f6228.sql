ALTER TABLE public.kon_events ADD COLUMN IF NOT EXISTS slug text;

-- Backfill: slugify name, disambiguate with a numeric suffix
WITH base AS (
  SELECT id,
         NULLIF(
           trim(both '-' from regexp_replace(
             lower(translate(coalesce(name,''),
               'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
               'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC')),
             '[^a-z0-9]+', '-', 'g')),
           '') AS s,
         date
  FROM public.kon_events
), numbered AS (
  SELECT id,
         coalesce(s, 'evento') AS s,
         row_number() OVER (PARTITION BY coalesce(s, 'evento') ORDER BY date NULLS LAST, id) AS rn
  FROM base
)
UPDATE public.kon_events e
SET slug = CASE WHEN n.rn = 1 THEN n.s ELSE n.s || '-' || n.rn END
FROM numbered n
WHERE e.id = n.id AND e.slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS kon_events_slug_key ON public.kon_events (slug);