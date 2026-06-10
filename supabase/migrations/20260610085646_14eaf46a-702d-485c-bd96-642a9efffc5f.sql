
CREATE TABLE public.media_appearances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
  outlet text NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  date_label text,
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  display_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.media_appearances TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_appearances TO authenticated;
GRANT ALL ON public.media_appearances TO service_role;

ALTER TABLE public.media_appearances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published media appearances"
  ON public.media_appearances
  FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert media appearances"
  ON public.media_appearances
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update media appearances"
  ON public.media_appearances
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete media appearances"
  ON public.media_appearances
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER media_appearances_set_updated_at
  BEFORE UPDATE ON public.media_appearances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX media_appearances_year_month_idx
  ON public.media_appearances (year DESC, month DESC, display_order DESC, created_at DESC);
