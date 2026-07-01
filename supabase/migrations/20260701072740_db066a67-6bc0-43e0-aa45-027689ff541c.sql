
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS seo_title_es text,
  ADD COLUMN IF NOT EXISTS seo_title_ca text,
  ADD COLUMN IF NOT EXISTS seo_title_en text,
  ADD COLUMN IF NOT EXISTS meta_description_es text,
  ADD COLUMN IF NOT EXISTS meta_description_ca text,
  ADD COLUMN IF NOT EXISTS meta_description_en text,
  ADD COLUMN IF NOT EXISTS keywords text[] NOT NULL DEFAULT '{}'::text[];
