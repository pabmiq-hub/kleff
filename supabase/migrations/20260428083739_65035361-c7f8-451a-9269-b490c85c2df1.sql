
-- ============================================================
-- 1. MEMBER NUMBER (correlativo de socio)
-- ============================================================
create sequence if not exists public.member_number_seq start with 1;

alter table public.profiles
  add column if not exists member_number integer unique;

-- Backfill por orden de creación
do $$
declare
  r record;
begin
  for r in select id from public.profiles where member_number is null order by created_at asc loop
    update public.profiles set member_number = nextval('public.member_number_seq') where id = r.id;
  end loop;
end $$;

-- A partir de ahora se asigna por defecto
alter table public.profiles
  alter column member_number set default nextval('public.member_number_seq'),
  alter column member_number set not null;

-- ============================================================
-- 2. RENTAL CATALOG (juegos disponibles para alquiler)
-- ============================================================
create table if not exists public.rental_games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  bgg_id integer,
  min_players smallint,
  max_players smallint,
  duration_minutes smallint,
  max_rental_days smallint not null default 14,
  is_active boolean not null default true,
  total_copies smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rental_games enable row level security;

-- Cualquier autenticado puede ver el catálogo activo
create policy "rental_games_select_authenticated"
  on public.rental_games for select
  to authenticated
  using (true);

-- Solo super admin gestiona
create policy "rental_games_admin_insert"
  on public.rental_games for insert
  to authenticated
  with check (public.is_super_admin());

create policy "rental_games_admin_update"
  on public.rental_games for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "rental_games_admin_delete"
  on public.rental_games for delete
  to authenticated
  using (public.is_super_admin());

create trigger rental_games_updated_at
  before update on public.rental_games
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. RENTAL REQUESTS (solicitudes de alquiler)
-- ============================================================
create type public.rental_request_status as enum ('pending', 'approved', 'rejected', 'cancelled');

create table if not exists public.rental_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  game_id uuid not null references public.rental_games(id) on delete cascade,
  requested_days smallint not null default 7,
  message text,
  status public.rental_request_status not null default 'pending',
  decided_at timestamptz,
  decided_by uuid,
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rental_requests enable row level security;

create policy "rental_requests_select_own_or_admin"
  on public.rental_requests for select
  to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

create policy "rental_requests_insert_self"
  on public.rental_requests for insert
  to authenticated
  with check (user_id = auth.uid() and status = 'pending');

-- Socios pueden cancelar las suyas pendientes; admin puede cualquier cosa
create policy "rental_requests_update_own_or_admin"
  on public.rental_requests for update
  to authenticated
  using (
    public.is_super_admin()
    or (user_id = auth.uid() and status = 'pending')
  )
  with check (
    public.is_super_admin()
    or (user_id = auth.uid() and status in ('pending', 'cancelled'))
  );

create trigger rental_requests_updated_at
  before update on public.rental_requests
  for each row execute function public.set_updated_at();

create index if not exists rental_requests_user_idx on public.rental_requests(user_id);
create index if not exists rental_requests_status_idx on public.rental_requests(status);

-- ============================================================
-- 4. RENTALS (alquileres activos / histórico)
-- ============================================================
create type public.rental_status as enum ('active', 'returned', 'overdue', 'lost');

create table if not exists public.rentals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  game_id uuid not null references public.rental_games(id) on delete restrict,
  request_id uuid references public.rental_requests(id) on delete set null,
  started_at timestamptz not null default now(),
  due_at timestamptz not null,
  returned_at timestamptz,
  status public.rental_status not null default 'active',
  notes text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rentals enable row level security;

create policy "rentals_select_own_or_admin"
  on public.rentals for select
  to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

create policy "rentals_admin_insert"
  on public.rentals for insert
  to authenticated
  with check (public.is_super_admin());

create policy "rentals_admin_update"
  on public.rentals for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "rentals_admin_delete"
  on public.rentals for delete
  to authenticated
  using (public.is_super_admin());

create trigger rentals_updated_at
  before update on public.rentals
  for each row execute function public.set_updated_at();

create index if not exists rentals_user_idx on public.rentals(user_id);
create index if not exists rentals_status_idx on public.rentals(status);
