-- 1) Slugs i18n en content_pages
ALTER TABLE public.content_pages
  ADD COLUMN IF NOT EXISTS page_key text,
  ADD COLUMN IF NOT EXISTS slug_es  text,
  ADD COLUMN IF NOT EXISTS slug_ca  text,
  ADD COLUMN IF NOT EXISTS slug_en  text;

-- Backfill page_key desde el path actual para las páginas existentes,
-- de forma idempotente.
UPDATE public.content_pages
   SET page_key = CASE
     WHEN page_key IS NOT NULL THEN page_key
     WHEN path = '/' THEN 'home'
     WHEN path LIKE '/p/%' THEN regexp_replace(path, '^/p/', '')
     ELSE regexp_replace(path, '^/', '')
   END
 WHERE page_key IS NULL;

-- Backfill slug_es desde path, sin el slash inicial. Para Home queda en NULL
-- (representa la raíz "/").
UPDATE public.content_pages
   SET slug_es = CASE
     WHEN path = '/' THEN NULL
     WHEN path LIKE '/p/%' THEN regexp_replace(path, '^/p/', '')
     ELSE regexp_replace(path, '^/', '')
   END
 WHERE slug_es IS NULL AND path <> '/';

-- Unicidad opcional por idioma cuando el slug está definido
CREATE UNIQUE INDEX IF NOT EXISTS content_pages_slug_es_uniq
  ON public.content_pages (slug_es) WHERE slug_es IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS content_pages_slug_ca_uniq
  ON public.content_pages (slug_ca) WHERE slug_ca IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS content_pages_slug_en_uniq
  ON public.content_pages (slug_en) WHERE slug_en IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS content_pages_page_key_uniq
  ON public.content_pages (page_key) WHERE page_key IS NOT NULL;

-- 2) Tabla de redirecciones 301 para preservar SEO al cambiar slugs
CREATE TABLE IF NOT EXISTS public.content_redirects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path    text NOT NULL,
  to_path      text NOT NULL,
  locale       text,
  page_key     text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid
);

CREATE UNIQUE INDEX IF NOT EXISTS content_redirects_from_path_uniq
  ON public.content_redirects (from_path);

ALTER TABLE public.content_redirects ENABLE ROW LEVEL SECURITY;

-- Lectura pública (la usa el catch-all en el cliente/SSR para hacer 301)
DROP POLICY IF EXISTS content_redirects_select_public ON public.content_redirects;
CREATE POLICY content_redirects_select_public
  ON public.content_redirects
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escritura solo super admin
DROP POLICY IF EXISTS content_redirects_admin_all ON public.content_redirects;
CREATE POLICY content_redirects_admin_all
  ON public.content_redirects
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
