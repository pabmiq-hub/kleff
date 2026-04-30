create table public.media_og_cache (
  url text primary key,
  og_title text,
  og_description text,
  og_image text,
  og_site_name text,
  fetched_at timestamptz not null default now(),
  error text
);
alter table public.media_og_cache enable row level security;
create policy "media_og_cache_public_read"
  on public.media_og_cache for select
  to anon, authenticated
  using (true);

create table public.kv_cache (
  key text primary key,
  value jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.kv_cache enable row level security;
create policy "kv_cache_public_read"
  on public.kv_cache for select
  to anon, authenticated
  using (true);