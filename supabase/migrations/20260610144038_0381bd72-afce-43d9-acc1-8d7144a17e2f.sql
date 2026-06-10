CREATE TABLE IF NOT EXISTS public.url_migration_map (
  old_url text PRIMARY KEY,
  new_url text NOT NULL
);
GRANT ALL ON public.url_migration_map TO service_role;

CREATE OR REPLACE FUNCTION public.fn_apply_url_map(t text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  IF t IS NULL OR t = '' THEN RETURN t; END IF;
  FOR r IN SELECT old_url, new_url FROM public.url_migration_map ORDER BY length(old_url) DESC LOOP
    t := replace(t, r.old_url, r.new_url);
  END LOOP;
  RETURN t;
END;
$$;