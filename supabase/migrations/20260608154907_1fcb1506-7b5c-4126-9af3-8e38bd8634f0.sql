-- Lock down kv_cache: only service role reads/writes (internal cache)
DROP POLICY IF EXISTS "kv_cache_public_read" ON public.kv_cache;
REVOKE SELECT ON public.kv_cache FROM anon, authenticated;

-- Tighten registration-uploads INSERT: only super_admins (no anonymous uploads)
DROP POLICY IF EXISTS "Anyone can upload registration files" ON storage.objects;
CREATE POLICY "Super admins upload registration files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'registration-uploads'
    AND public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );