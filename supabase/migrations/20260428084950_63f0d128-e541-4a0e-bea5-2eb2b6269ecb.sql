-- Enums
do $$ begin
  create type public.page_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.page_locale as enum ('es', 'ca', 'en');
exception when duplicate_object then null; end $$;

-- Tablas
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  locale page_locale not null default 'es',
  title text not null,
  description text,
  og_image_url text,
  status page_status not null default 'draft',
  published_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, locale)
);

create table if not exists public.page_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  type text not null,
  position integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists page_blocks_page_id_position_idx
  on public.page_blocks(page_id, position);

-- Triggers updated_at
drop trigger if exists pages_set_updated_at on public.pages;
create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

drop trigger if exists page_blocks_set_updated_at on public.page_blocks;
create trigger page_blocks_set_updated_at
  before update on public.page_blocks
  for each row execute function public.set_updated_at();

-- RLS
alter table public.pages enable row level security;
alter table public.page_blocks enable row level security;

drop policy if exists pages_select_public on public.pages;
create policy pages_select_public on public.pages
  for select to anon, authenticated
  using (status = 'published' or public.is_super_admin());

drop policy if exists pages_admin_insert on public.pages;
create policy pages_admin_insert on public.pages
  for insert to authenticated
  with check (public.is_super_admin());

drop policy if exists pages_admin_update on public.pages;
create policy pages_admin_update on public.pages
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists pages_admin_delete on public.pages;
create policy pages_admin_delete on public.pages
  for delete to authenticated
  using (public.is_super_admin());

drop policy if exists page_blocks_select_public on public.page_blocks;
create policy page_blocks_select_public on public.page_blocks
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.pages p
      where p.id = page_blocks.page_id
        and (p.status = 'published' or public.is_super_admin())
    )
  );

drop policy if exists page_blocks_admin_insert on public.page_blocks;
create policy page_blocks_admin_insert on public.page_blocks
  for insert to authenticated
  with check (public.is_super_admin());

drop policy if exists page_blocks_admin_update on public.page_blocks;
create policy page_blocks_admin_update on public.page_blocks
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists page_blocks_admin_delete on public.page_blocks;
create policy page_blocks_admin_delete on public.page_blocks
  for delete to authenticated
  using (public.is_super_admin());

-- Storage bucket media (público)
insert into storage.buckets (id, name, public)
  values ('media', 'media', true)
  on conflict (id) do update set public = true;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_super_admin());

drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_super_admin())
  with check (bucket_id = 'media' and public.is_super_admin());

drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_super_admin());