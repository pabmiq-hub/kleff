
create type public.poll_kind as enum ('survey','acquisition');
create type public.poll_status as enum ('draft','published','closed');

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  kind public.poll_kind not null default 'acquisition',
  status public.poll_status not null default 'draft',
  title_es text not null,
  title_ca text,
  title_en text,
  description_es text,
  description_ca text,
  description_en text,
  opens_at timestamptz not null default now(),
  closes_at timestamptz,
  karma_category_id uuid references public.karma_categories(id) on delete set null,
  max_choices smallint not null default 1,
  questions jsonb not null default '[]'::jsonb,
  show_results boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  description text,
  game_ref text,
  game_image_url text,
  game_year smallint,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index poll_options_poll_idx on public.poll_options(poll_id);

create table public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  weight smallint not null default 1,
  created_at timestamptz not null default now(),
  unique (option_id, user_id)
);
create index poll_votes_poll_idx on public.poll_votes(poll_id);

create table public.poll_responses (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

grant select, insert, update, delete on public.polls to authenticated;
grant all on public.polls to service_role;
grant select, insert, update, delete on public.poll_options to authenticated;
grant all on public.poll_options to service_role;
grant select, insert, update, delete on public.poll_votes to authenticated;
grant all on public.poll_votes to service_role;
grant select, insert, update, delete on public.poll_responses to authenticated;
grant all on public.poll_responses to service_role;

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.poll_responses enable row level security;

create policy "polls readable by members" on public.polls
  for select to authenticated using (status <> 'draft' or public.has_role(auth.uid(),'super_admin'));
create policy "polls managed by admin" on public.polls
  for all to authenticated using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

create policy "poll options readable by members" on public.poll_options
  for select to authenticated using (
    exists (select 1 from public.polls p where p.id = poll_id and (p.status <> 'draft' or public.has_role(auth.uid(),'super_admin')))
  );
create policy "poll options managed by admin" on public.poll_options
  for all to authenticated using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

create policy "poll votes readable" on public.poll_votes
  for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "poll votes own insert" on public.poll_votes
  for insert to authenticated with check (user_id = auth.uid());
create policy "poll votes own delete" on public.poll_votes
  for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));

create policy "poll responses readable" on public.poll_responses
  for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "poll responses own insert" on public.poll_responses
  for insert to authenticated with check (user_id = auth.uid());
create policy "poll responses own update" on public.poll_responses
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger polls_set_updated_at before update on public.polls
  for each row execute function public.set_updated_at();

insert into public.karma_categories
  (code, grp, name_es, name_ca, name_en, description_es, description_ca, description_en, points, limit_period, member_requestable, requires_evidence, is_active, sort_order)
values
  ('poll_vote','otras','Votación de adquisiciones','Votació d''adquisicions','Acquisition vote',
   'Participar en una votación de nuevas adquisiciones','Participar en una votació de noves adquisicions','Taking part in an acquisitions vote',
   2,'none', false, false, true, 260)
on conflict (code) do nothing;
