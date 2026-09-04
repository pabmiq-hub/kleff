CREATE OR REPLACE VIEW public.kon_organizers_public AS
SELECT id, user_id, company_name, logo_url, slug, status,
  COALESCE(active_modules, ARRAY[]::text[]) AS active_modules
FROM public.kon_organizers;
ALTER VIEW public.kon_organizers_public SET (security_invoker = off);
GRANT SELECT ON public.kon_organizers_public TO anon, authenticated, service_role;