-- ============================================
-- 1. EXTENSIONS
-- ============================================
create extension if not exists pgcrypto;
create extension if not exists pgsodium;

-- ============================================
-- 2. ENUMS
-- ============================================
do $$ begin
  create type public.app_role as enum ('super_admin', 'user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.gender_type as enum ('female', 'male', 'non_binary', 'other', 'prefer_not_to_say');
exception when duplicate_object then null; end $$;

-- ============================================
-- 3. TABLES
-- ============================================

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  full_name text not null,
  avatar_url text,
  date_of_birth date not null,
  gender public.gender_type not null,
  id_document_encrypted bytea not null,
  id_document_nonce bytea not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_username_lower_idx on public.profiles (lower(username));

-- User roles (separate table to prevent privilege escalation)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- Invitations
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists invitations_email_idx on public.invitations (lower(email));
create index if not exists invitations_pending_idx on public.invitations (expires_at) where accepted_at is null and revoked_at is null;

-- DNI access audit log
create table if not exists public.id_document_audit (
  id uuid primary key default gen_random_uuid(),
  accessed_by uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  accessed_at timestamptz not null default now()
);

-- ============================================
-- 4. SECURITY DEFINER HELPERS
-- ============================================

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'super_admin');
$$;

-- ============================================
-- 5. UPDATED_AT TRIGGER
-- ============================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================
-- 6. RLS
-- ============================================
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.invitations enable row level security;
alter table public.id_document_audit enable row level security;

-- profiles: own row OR super admin
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_super_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

-- inserts are done via server functions with service role; deny client inserts
drop policy if exists "profiles_no_client_insert" on public.profiles;
create policy "profiles_no_client_insert"
  on public.profiles for insert
  to authenticated
  with check (false);

-- user_roles: read your own roles; super admin reads all
drop policy if exists "user_roles_select_own_or_admin" on public.user_roles;
create policy "user_roles_select_own_or_admin"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

-- only super admin manages roles
drop policy if exists "user_roles_admin_insert" on public.user_roles;
create policy "user_roles_admin_insert"
  on public.user_roles for insert
  to authenticated
  with check (public.is_super_admin());

drop policy if exists "user_roles_admin_delete" on public.user_roles;
create policy "user_roles_admin_delete"
  on public.user_roles for delete
  to authenticated
  using (public.is_super_admin());

-- invitations: super admin only
drop policy if exists "invitations_admin_all" on public.invitations;
create policy "invitations_admin_all"
  on public.invitations for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- audit log: super admin reads all; inserts only via server functions
drop policy if exists "audit_admin_select" on public.id_document_audit;
create policy "audit_admin_select"
  on public.id_document_audit for select
  to authenticated
  using (public.is_super_admin());

-- ============================================
-- 7. ENCRYPTION KEY (pgsodium)
-- ============================================
-- Create a project-level key for DNI encryption (id stored in pgsodium.key)
do $$
declare
  v_key_id uuid;
begin
  select id into v_key_id from pgsodium.key where name = 'kleff_id_document_key';
  if v_key_id is null then
    perform pgsodium.create_key(
      key_type => 'aead-det',
      name => 'kleff_id_document_key'
    );
  end if;
end $$;

-- ============================================
-- 8. ENCRYPT / DECRYPT FUNCTIONS
-- ============================================
create or replace function public.encrypt_id_document(_plain text)
returns table(ciphertext bytea, nonce bytea)
language plpgsql
security definer
set search_path = public, pgsodium
as $$
declare
  v_key_id uuid;
  v_nonce bytea;
  v_cipher bytea;
begin
  select id into v_key_id from pgsodium.key where name = 'kleff_id_document_key';
  if v_key_id is null then
    raise exception 'Encryption key not configured';
  end if;
  v_nonce := pgsodium.crypto_aead_det_noncegen();
  v_cipher := pgsodium.crypto_aead_det_encrypt(
    convert_to(_plain, 'utf8'),
    convert_to('id_document', 'utf8'),
    v_key_id,
    v_nonce
  );
  ciphertext := v_cipher;
  nonce := v_nonce;
  return next;
end;
$$;

revoke all on function public.encrypt_id_document(text) from public, anon, authenticated;

create or replace function public.get_id_document(_target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pgsodium
as $$
declare
  v_key_id uuid;
  v_cipher bytea;
  v_nonce bytea;
  v_plain bytea;
begin
  if not public.has_role(auth.uid(), 'super_admin') then
    raise exception 'Only super admins can read id documents';
  end if;

  select id into v_key_id from pgsodium.key where name = 'kleff_id_document_key';

  select id_document_encrypted, id_document_nonce
    into v_cipher, v_nonce
    from public.profiles
    where id = _target_user_id;

  if v_cipher is null then
    return null;
  end if;

  v_plain := pgsodium.crypto_aead_det_decrypt(
    v_cipher,
    convert_to('id_document', 'utf8'),
    v_key_id,
    v_nonce
  );

  -- Audit
  insert into public.id_document_audit (accessed_by, target_user_id)
    values (auth.uid(), _target_user_id);

  return convert_from(v_plain, 'utf8');
end;
$$;

revoke all on function public.get_id_document(uuid) from public, anon;
grant execute on function public.get_id_document(uuid) to authenticated;

-- ============================================
-- 9. STORAGE: avatars bucket
-- ============================================
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

-- Public read
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload to a folder named after their uid
drop policy if exists "avatars_user_insert" on storage.objects;
create policy "avatars_user_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_user_update" on storage.objects;
create policy "avatars_user_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_user_delete" on storage.objects;
create policy "avatars_user_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
