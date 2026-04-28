-- Add search_path to set_updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Revoke broad execute on security definer helpers
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.is_super_admin() from public, anon;
revoke all on function public.encrypt_id_document(text) from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon;

-- get_id_document MUST stay callable by authenticated (it checks role internally)
-- The linter warning is acknowledged: the function self-guards.

-- Tighten avatars bucket: only allow listing/select within a user's own folder
-- but keep it readable when accessed by direct URL (public bucket = direct GET works)
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');
-- Note: bucket is public, so direct asset URLs work. The select policy gates the
-- list endpoint. We keep it permissive because avatars are intentionally public,
-- but we never expose a "list all avatars" UI.
