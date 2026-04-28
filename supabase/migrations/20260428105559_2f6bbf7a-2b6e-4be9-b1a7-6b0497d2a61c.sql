-- content_pages: registry of editable pages (built-in + custom landings)
CREATE TABLE public.content_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL UNIQUE,
  title text NOT NULL,
  template text NOT NULL DEFAULT 'builtin',
  is_builtin boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_pages_select_public ON public.content_pages
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY content_pages_admin_all ON public.content_pages
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE TRIGGER content_pages_updated_at
  BEFORE UPDATE ON public.content_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- content_overrides: per-element edits, draft + published
CREATE TABLE public.content_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  element_id text NOT NULL,
  property text NOT NULL,
  value jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  UNIQUE (page_path, element_id, property, status)
);

CREATE INDEX content_overrides_page_status_idx
  ON public.content_overrides (page_path, status);

ALTER TABLE public.content_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_overrides_select_published ON public.content_overrides
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR is_super_admin());

CREATE POLICY content_overrides_admin_insert ON public.content_overrides
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY content_overrides_admin_update ON public.content_overrides
  FOR UPDATE TO authenticated
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY content_overrides_admin_delete ON public.content_overrides
  FOR DELETE TO authenticated
  USING (is_super_admin());

CREATE TRIGGER content_overrides_updated_at
  BEFORE UPDATE ON public.content_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed built-in pages
INSERT INTO public.content_pages (path, title, template, is_builtin) VALUES
  ('/', 'Inicio', 'builtin', true),
  ('/about', 'Sobre Kleff', 'builtin', true),
  ('/how-it-works', 'Cómo funciona', 'builtin', true),
  ('/contact', 'Contacto', 'builtin', true),
  ('/blog', 'Publicaciones', 'builtin', true),
  ('/media', 'Media', 'builtin', true)
ON CONFLICT (path) DO NOTHING;