-- 1. Drop the old block-based CMS tables (replaced by sections model)
DROP TABLE IF EXISTS public.page_blocks CASCADE;
DROP TABLE IF EXISTS public.pages CASCADE;
DROP TYPE IF EXISTS public.page_status CASCADE;
DROP TYPE IF EXISTS public.page_locale CASCADE;

-- 2. Editable content sections (one row per editable zone of a page)
CREATE TABLE public.content_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  schema_version integer NOT NULL DEFAULT 1,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX content_sections_key_idx ON public.content_sections (section_key);

ALTER TABLE public.content_sections ENABLE ROW LEVEL SECURITY;

-- Public read (so the live site can fetch published content without auth)
CREATE POLICY content_sections_select_public
  ON public.content_sections
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY content_sections_admin_insert
  ON public.content_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY content_sections_admin_update
  ON public.content_sections
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY content_sections_admin_delete
  ON public.content_sections
  FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

CREATE TRIGGER content_sections_set_updated_at
  BEFORE UPDATE ON public.content_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3. Version history (insert-only snapshot on every update)
CREATE TABLE public.content_section_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL,
  schema_version integer NOT NULL,
  content jsonb NOT NULL,
  saved_by uuid,
  saved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX content_section_history_key_idx
  ON public.content_section_history (section_key, saved_at DESC);

ALTER TABLE public.content_section_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_section_history_admin_select
  ON public.content_section_history
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- History is written by a SECURITY DEFINER trigger; no client INSERT policy needed.

CREATE OR REPLACE FUNCTION public.snapshot_content_section()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.content IS DISTINCT FROM NEW.content) THEN
    INSERT INTO public.content_section_history (section_key, schema_version, content, saved_by)
    VALUES (OLD.section_key, OLD.schema_version, OLD.content, OLD.updated_by);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER content_sections_snapshot
  BEFORE UPDATE ON public.content_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_content_section();