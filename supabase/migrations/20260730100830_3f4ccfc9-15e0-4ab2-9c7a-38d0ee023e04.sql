-- ENUMS
create type public.karma_entry_status as enum ('pending','approved','rejected','voided');
create type public.karma_redemption_status as enum ('requested','approved','delivered','rejected');
create type public.karma_limit_period as enum ('none','weekly','monthly');
create type public.karma_reward_effect as enum ('manual','fee_discount','raffle_ticket','extra_rental','extend_rental','tournament_discount','priority_access','double_vote');
create type public.karma_category_group as enum ('ludoteca','difusion','referidos','participacion','organizacion','otras');

-- SEASONS
create table public.karma_seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default false,
  carryover_max smallint not null default 20,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.karma_seasons to authenticated;
grant all on public.karma_seasons to service_role;
alter table public.karma_seasons enable row level security;
create policy "karma_seasons_select" on public.karma_seasons for select to authenticated using (true);
create policy "karma_seasons_admin" on public.karma_seasons for all to authenticated using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

-- CATEGORIES
create table public.karma_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  grp public.karma_category_group not null,
  name_es text not null,
  name_ca text not null default '',
  name_en text not null default '',
  description_es text not null default '',
  description_ca text not null default '',
  description_en text not null default '',
  points smallint not null default 0,
  points_min smallint,
  points_max smallint,
  limit_period public.karma_limit_period not null default 'none',
  limit_count smallint,
  member_requestable boolean not null default true,
  requires_evidence boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.karma_categories to authenticated;
grant all on public.karma_categories to service_role;
alter table public.karma_categories enable row level security;
create policy "karma_categories_select" on public.karma_categories for select to authenticated using (true);
create policy "karma_categories_admin" on public.karma_categories for all to authenticated using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

-- ENTRIES
create table public.karma_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  category_id uuid references public.karma_categories(id) on delete set null,
  season_id uuid references public.karma_seasons(id) on delete set null,
  points smallint not null default 0,
  status public.karma_entry_status not null default 'pending',
  description text,
  evidence_url text,
  game_id uuid references public.bgg_games(id) on delete set null,
  event_ref text,
  decided_by uuid,
  decided_at timestamptz,
  decision_note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index karma_entries_user_idx on public.karma_entries(user_id, status);
create index karma_entries_season_idx on public.karma_entries(season_id);
grant select, insert on public.karma_entries to authenticated;
grant all on public.karma_entries to service_role;
alter table public.karma_entries enable row level security;
create policy "karma_entries_select_own" on public.karma_entries for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "karma_entries_insert_own" on public.karma_entries for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "karma_entries_admin" on public.karma_entries for all to authenticated using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

-- REWARDS
create table public.karma_rewards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_es text not null,
  name_ca text not null default '',
  name_en text not null default '',
  description_es text not null default '',
  description_ca text not null default '',
  description_en text not null default '',
  cost smallint not null,
  effect public.karma_reward_effect not null default 'manual',
  effect_value integer,
  stock integer,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.karma_rewards to authenticated;
grant all on public.karma_rewards to service_role;
alter table public.karma_rewards enable row level security;
create policy "karma_rewards_select" on public.karma_rewards for select to authenticated using (true);
create policy "karma_rewards_admin" on public.karma_rewards for all to authenticated using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

-- REDEMPTIONS
create table public.karma_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reward_id uuid references public.karma_rewards(id) on delete set null,
  season_id uuid references public.karma_seasons(id) on delete set null,
  points_spent smallint not null,
  status public.karma_redemption_status not null default 'requested',
  target_rental_id uuid references public.rentals(id) on delete set null,
  note text,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index karma_redemptions_user_idx on public.karma_redemptions(user_id, status);
grant select on public.karma_redemptions to authenticated;
grant all on public.karma_redemptions to service_role;
alter table public.karma_redemptions enable row level security;
create policy "karma_redemptions_select_own" on public.karma_redemptions for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "karma_redemptions_admin" on public.karma_redemptions for all to authenticated using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

-- REFERRALS
create table public.karma_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null,
  referred_name text not null,
  referred_user_id uuid,
  signup_awarded boolean not null default false,
  loyalty_awarded boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.karma_referrals to authenticated;
grant all on public.karma_referrals to service_role;
alter table public.karma_referrals enable row level security;
create policy "karma_referrals_select_own" on public.karma_referrals for select to authenticated using (referrer_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "karma_referrals_admin" on public.karma_referrals for all to authenticated using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

-- PERKS (active benefits granted by redemptions)
create table public.karma_perks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  redemption_id uuid references public.karma_redemptions(id) on delete cascade,
  kind public.karma_reward_effect not null,
  value integer,
  expires_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index karma_perks_user_idx on public.karma_perks(user_id, kind);
grant select on public.karma_perks to authenticated;
grant all on public.karma_perks to service_role;
alter table public.karma_perks enable row level security;
create policy "karma_perks_select_own" on public.karma_perks for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "karma_perks_admin" on public.karma_perks for all to authenticated using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

-- PROFILE opt-in
alter table public.profiles add column if not exists karma_ranking_opt_in boolean not null default true;

-- updated_at triggers
create trigger karma_seasons_updated before update on public.karma_seasons for each row execute function public.set_updated_at();
create trigger karma_categories_updated before update on public.karma_categories for each row execute function public.set_updated_at();
create trigger karma_entries_updated before update on public.karma_entries for each row execute function public.set_updated_at();
create trigger karma_rewards_updated before update on public.karma_rewards for each row execute function public.set_updated_at();
create trigger karma_redemptions_updated before update on public.karma_redemptions for each row execute function public.set_updated_at();
create trigger karma_referrals_updated before update on public.karma_referrals for each row execute function public.set_updated_at();

-- BALANCE FUNCTIONS
create or replace function public.karma_active_season()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.karma_seasons where is_active = true order by starts_on desc limit 1;
$$;

create or replace function public.karma_lifetime(_user_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(sum(points),0)::int from public.karma_entries
  where user_id = _user_id and status = 'approved';
$$;

create or replace function public.karma_balance(_user_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select (
    coalesce((select sum(points) from public.karma_entries e
      where e.user_id = _user_id and e.status = 'approved'
        and (e.season_id is null or e.season_id = public.karma_active_season())),0)
    - coalesce((select sum(points_spent) from public.karma_redemptions r
      where r.user_id = _user_id and r.status <> 'rejected'),0)
  )::int;
$$;

-- Count of approved+pending entries in the current limit window for a category
create or replace function public.karma_category_usage(_user_id uuid, _category_id uuid)
returns integer language plpgsql stable security definer set search_path = public as $$
declare v_period public.karma_limit_period; v_since timestamptz; v_count int;
begin
  select limit_period into v_period from public.karma_categories where id = _category_id;
  if v_period is null or v_period = 'none' then return 0; end if;
  if v_period = 'weekly' then v_since := date_trunc('week', now()); else v_since := date_trunc('month', now()); end if;
  select count(*) into v_count from public.karma_entries
   where user_id = _user_id and category_id = _category_id
     and status in ('pending','approved') and created_at >= v_since;
  return v_count;
end;
$$;

grant execute on function public.karma_active_season() to authenticated;
grant execute on function public.karma_lifetime(uuid) to authenticated;
grant execute on function public.karma_balance(uuid) to authenticated;
grant execute on function public.karma_category_usage(uuid, uuid) to authenticated;

-- SEED: season
insert into public.karma_seasons (name, starts_on, ends_on, is_active, carryover_max)
values ('Temporada 2026', '2026-01-01', '2026-12-31', true, 20);

-- SEED: categories
insert into public.karma_categories (code, grp, name_es, name_ca, name_en, description_es, points, points_min, points_max, limit_period, limit_count, member_requestable, requires_evidence, sort_order) values
('review_small','ludoteca','Revisión de juego pequeño','Revisió de joc petit','Small game check','Juegos de cartas, filler (pocos componentes)',5,null,null,'monthly',3,true,false,10),
('review_medium','ludoteca','Revisión de juego mediano','Revisió de joc mitjà','Medium game check','Familiar / estratégico estándar',10,null,null,'monthly',3,true,false,20),
('review_large','ludoteca','Revisión de juego grande','Revisió de joc gran','Large game check','Familiar + o eurogame de complejidad alta',20,null,null,'monthly',3,true,false,30),
('review_report','ludoteca','Revisión con reporte detallado (bonus)','Revisió amb informe detallat','Detailed report bonus','Ficha de estado + fotos de piezas dañadas o faltantes',5,null,null,'monthly',3,true,true,40),
('share_story','difusion','Compartir/story en redes','Compartir/story a xarxes','Social share/story','Repost o story mencionando @kleff_bcn o el evento',2,null,null,'weekly',1,true,true,50),
('original_content','difusion','Contenido original','Contingut original','Original content','Reel, vídeo o post propio promocionando un evento KLEFF',10,null,null,'none',null,true,true,60),
('external_collab','difusion','Traer colaboración externa','Portar col·laboració externa','External collaboration','Contacto de medio, local o influencer que resulte en difusión real',15,null,null,'none',null,true,false,70),
('referral_signup','referidos','Alta de nuevo socio referido','Alta de nou soci referit','New referred member','El nuevo socio indica tu nombre al inscribirse',15,null,null,'none',null,true,false,80),
('referral_loyalty','referidos','Fidelización del referido (bonus)','Fidelització del referit','Referral loyalty bonus','El referido asiste a 3 o más eventos en su primer mes',10,null,null,'none',null,false,false,90),
('tournament_free','participacion','Torneo sin cuota de inscripción','Torneig sense quota','Free tournament','Participación en un torneo sin cuota de inscripción',10,null,null,'none',null,true,false,100),
('tournament_low','participacion','Torneo con cuota inferior a 10€','Torneig amb quota < 10€','Tournament under 10€','Código Secreto, Himizu o similares',15,null,null,'none',null,true,false,110),
('tournament_high','participacion','Torneo con cuota de 10€ o superior','Torneig amb quota ≥ 10€','Tournament 10€+','Catan o Carcassonne',35,null,null,'none',null,true,false,120),
('special_menu','participacion','Evento especial con menú','Esdeveniment especial amb menú','Special event with menu','Blood on the Clocktower en El Convento, The Last Game Night, Aniversario KLEFF',75,null,null,'none',null,true,false,130),
('slow_friending','participacion','Slow Friending Lúdico','Slow Friending Lúdic','Slow Friending','Participación en un Slow Friending Lúdico',10,null,null,'none',null,true,false,140),
('ludoya_game','participacion','Creación de partida en Ludoya','Creació de partida a Ludoya','Ludoya game creation','Creación y ejecución de una partida en las noches de juegos',10,null,null,'none',null,true,false,150),
('new_participant','participacion','Alta de nuevo participante en evento especial','Alta de nou participant','New participant','El nuevo participante no ha asistido a ningún otro evento especial',10,null,null,'none',null,true,false,160),
('setup','organizacion','Montaje / desmontaje de sala','Muntatge / desmuntatge','Room setup','Ayuda antes o después de un evento (bajo demanda)',5,null,null,'none',null,true,false,170),
('rules_demo','organizacion','Explicación de reglas / demos','Explicació de regles','Rules explanation','Enseñar un juego a nuevos asistentes durante un evento',5,null,null,'none',null,true,false,180),
('tournament_ref','organizacion','Arbitraje o mesa en torneo','Arbitratge en torneig','Tournament referee','Ejercer de explicador o árbitro oficial en una mesa de torneo',10,null,null,'none',null,true,false,190),
('media_cover','organizacion','Fotografía o vídeo oficial','Fotografia o vídeo oficial','Official photo/video','Cubrir un evento para el archivo o redes de KLEFF',10,null,null,'none',null,true,false,200),
('review_post','otras','Reseña para blog o BGG','Ressenya per al blog o BGG','Blog/BGG review','Reseña escrita publicada en el blog de KLEFF o en BGG',15,null,null,'none',null,true,true,210),
('incident_report','otras','Reporte de incidencias','Report d''incidències','Incident report','Avisar de piezas dañadas o perdidas fuera de una revisión formal',3,null,null,'none',null,true,false,220),
('donation_wishlist','otras','Donación de juego (wishlist)','Donació de joc (wishlist)','Game donation (wishlist)','Juego de la wishlist donado en buen estado e incorporado al catálogo',20,20,50,'none',null,true,false,230),
('donation_other','otras','Donación de juego (no wishlist)','Donació de joc (no wishlist)','Game donation (other)','Juego destinado a sorteo o mercadillo',15,null,null,'none',null,true,false,240),
('mentoring','otras','Mentoría / buddy de nuevos socios','Mentoria de nous socis','Mentoring','Acompañar a un nuevo socio en sus primeras 2-3 sesiones',10,null,null,'monthly',1,true,false,250),
('survey','otras','Encuestas','Enquestes','Surveys','Responder encuestas oficiales de KLEFF',2,null,null,'none',null,true,false,260);

-- SEED: rewards
insert into public.karma_rewards (code, name_es, name_ca, name_en, description_es, cost, effect, effect_value, sort_order) values
('fee_1','1 € de descuento en la cuota','1 € de descompte a la quota','1 € membership discount','Cada 50 puntos equivalen a 1 € de descuento sobre la cuota anual',50,'fee_discount',1,10),
('fee_5','5 € de descuento en la cuota','5 € de descompte','5 € membership discount','Descuento acumulable sobre la cuota anual',250,'fee_discount',5,20),
('fee_10','10 € de descuento en la cuota','10 € de descompte','10 € membership discount','Descuento acumulable sobre la cuota anual',500,'fee_discount',10,30),
('raffle_ticket','Papeleta extra en un sorteo','Paperata extra en un sorteig','Extra raffle ticket','20 puntos = 1 papeleta adicional en cualquier sorteo oficial',20,'raffle_ticket',1,40),
('tourney_1','1 € de descuento en inscripción a torneo','1 € de descompte en torneig','1 € tournament discount','Descuento aplicable a la inscripción de un torneo',50,'tournament_discount',1,50),
('tourney_free','Inscripción gratuita a un torneo estándar','Inscripció gratuïta a un torneig','Free tournament entry','Cubre la inscripción de un torneo estándar',250,'tournament_discount',0,60),
('extra_rental','1 préstamo adicional simultáneo (1 semana)','1 préstec addicional','Extra simultaneous rental','Permite un préstamo simultáneo extra durante 1 semana',50,'extra_rental',1,70),
('extend_rental','+1 semana de plazo de devolución','+1 setmana de termini','+1 week return deadline','Amplía en una semana el plazo de un préstamo concreto',50,'extend_rental',7,80),
('priority_access','Acceso prioritario a novedades (48h)','Accés prioritari a novetats','Priority access to new games','Reserva de novedades 48h antes que el resto',25,'priority_access',48,90),
('double_vote','Voto con doble peso en próximas compras','Vot amb doble pes','Double-weight vote','Tu voto cuenta doble en las votaciones de compras de la ludoteca',20,'double_vote',2,100),
('pin','Pin oficial de KLEFF','Pin oficial de KLEFF','Official KLEFF pin','Pin oficial de la asociación',40,'manual',null,110),
('tshirt','Camiseta personalizada de KLEFF','Samarreta personalitzada','Custom KLEFF t-shirt','Camiseta personalizada de KLEFF',150,'manual',null,120),
('playtesting','Sesión exclusiva de playtesting','Sessió exclusiva de playtesting','Exclusive playtesting session','Invitación a una sesión de playtesting de novedades',50,'manual',null,130),
('partner_guest','Entrada gratuita como acompañante','Entrada gratuïta d''acompanyant','Free guest entry','Entrada gratuita como acompañante a un evento con partner',30,'manual',null,140);