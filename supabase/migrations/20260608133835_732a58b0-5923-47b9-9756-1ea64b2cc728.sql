
CREATE TABLE public.content_page_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.content_pages(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('es','ca','en')),
  position integer NOT NULL DEFAULT 0,
  type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE INDEX content_page_blocks_page_locale_idx
  ON public.content_page_blocks (page_id, locale, position);

GRANT SELECT ON public.content_page_blocks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content_page_blocks TO authenticated;
GRANT ALL ON public.content_page_blocks TO service_role;

ALTER TABLE public.content_page_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_page_blocks_select_public"
  ON public.content_page_blocks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "content_page_blocks_admin_all"
  ON public.content_page_blocks FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE TRIGGER content_page_blocks_set_updated_at
  BEFORE UPDATE ON public.content_page_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
