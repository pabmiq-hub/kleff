CREATE TABLE public.bgg_sync_exclusions (
  bgg_id integer PRIMARY KEY,
  title text,
  excluded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bgg_sync_exclusions TO authenticated;
GRANT ALL ON public.bgg_sync_exclusions TO service_role;
ALTER TABLE public.bgg_sync_exclusions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bgg_sync_exclusions_admin_read" ON public.bgg_sync_exclusions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));