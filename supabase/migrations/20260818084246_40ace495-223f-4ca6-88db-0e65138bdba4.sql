CREATE TYPE public.badge_kind AS ENUM ('tiered', 'unique');
CREATE TYPE public.badge_source AS ENUM ('ludoya', 'karma', 'manual');

CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  kind public.badge_kind NOT NULL DEFAULT 'tiered',
  grp text NOT NULL DEFAULT 'general',
  source public.badge_source NOT NULL DEFAULT 'manual',
  auto_metric text,
  auto_param text,
  icon text NOT NULL DEFAULT 'award',
  color text NOT NULL DEFAULT 'coral',
  name_es text NOT NULL,
  name_ca text NOT NULL,
  name_en text NOT NULL,
  description_es text NOT NULL DEFAULT '',
  description_ca text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.badges TO authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_read" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "badges_admin_write" ON public.badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER badges_updated_at BEFORE UPDATE ON public.badges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  tier text,
  unlocked_at timestamptz,
  seen_at timestamptz,
  awarded_by uuid REFERENCES auth.users(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

GRANT SELECT, UPDATE ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_read_all" ON public.user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_badges_mark_seen" ON public.user_badges FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_badges_admin_all" ON public.user_badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER user_badges_updated_at BEFORE UPDATE ON public.user_badges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX user_badges_user_idx ON public.user_badges (user_id);

INSERT INTO public.badges (code, kind, grp, source, auto_metric, auto_param, icon, color, name_es, name_ca, name_en, description_es, description_ca, description_en, tiers, sort_order) VALUES
('game_nights','tiered','participacion','ludoya','karma_group','participacion','moon','coral','Asiduo de las Noches de Juego','Assidu de les Nits de Joc','Game Night Regular','Asistencia registrada a la Noche de Juego semanal.','Assistència registrada a la Nit de Joc setmanal.','Registered attendance at the weekly Game Night.','[{"tier":"bronze","threshold":5},{"tier":"silver","threshold":15},{"tier":"gold","threshold":40},{"tier":"platinum","threshold":100},{"tier":"legend","threshold":200}]',1),
('format_explorer','tiered','participacion','manual',NULL,NULL,'compass','teal','Explorador de Formatos','Explorador de Formats','Format Explorer','Asistencia combinada a Slow Friending, torneos y eventos especiales.','Assistència combinada a Slow Friending, torneigs i esdeveniments especials.','Combined attendance at Slow Friending, tournaments and special events.','[{"tier":"bronze","threshold":3},{"tier":"silver","threshold":10},{"tier":"gold","threshold":25},{"tier":"platinum","threshold":60}]',2),
('tournament_globetrotter','tiered','torneos','manual',NULL,NULL,'trophy','gold','Trotamesas de Torneos','Trotataules de Torneigs','Tournament Globetrotter','Participación en torneos, con y sin cuota.','Participació en torneigs, amb i sense quota.','Participation in tournaments, paid or free.','[{"tier":"bronze","threshold":3},{"tier":"silver","threshold":10},{"tier":"gold","threshold":25},{"tier":"platinum","threshold":50}]',3),
('library_guardian','tiered','ludoteca','karma','karma_group','ludoteca','shield','green','Guardián de la Ludoteca','Guardià de la Ludoteca','Library Guardian','Revisiones de juegos de la ludoteca.','Revisions de jocs de la ludoteca.','Reviews of library games.','[{"tier":"bronze","threshold":10},{"tier":"silver","threshold":30},{"tier":"gold","threshold":75},{"tier":"platinum","threshold":150}]',4),
('rental_member','tiered','ludoteca','ludoya','rentals',NULL,'dices','coral','Socio de Alquiler','Soci de Lloguer','Rental Member','Alquileres de juegos de la ludoteca.','Lloguers de jocs de la ludoteca.','Board game rentals from the library.','[{"tier":"bronze","threshold":5},{"tier":"silver","threshold":15},{"tier":"gold","threshold":40},{"tier":"platinum","threshold":80}]',5),
('kleff_speaker','tiered','difusion','karma','karma_group','difusion','megaphone','pink','Altavoz de KLEFF','Altaveu de KLEFF','KLEFF Speaker','Compartir contenido, crear contenido original y colaboraciones externas.','Compartir contingut, crear contingut original i col·laboracions externes.','Sharing content, original content and external collaborations.','[{"tier":"bronze","threshold":15},{"tier":"silver","threshold":40},{"tier":"gold","threshold":100},{"tier":"platinum","threshold":200}]',6),
('ambassador','tiered','referidos','karma','referrals',NULL,'user-plus','teal','Embajador KLEFF','Ambaixador KLEFF','KLEFF Ambassador','Altas de socios referidos por ti.','Altes de socis referits per tu.','New members you referred.','[{"tier":"bronze","threshold":3},{"tier":"silver","threshold":8},{"tier":"gold","threshold":20},{"tier":"platinum","threshold":40}]',7),
('team_pillar','tiered','organizacion','karma','karma_group','organizacion','hand-helping','gold','Pilar del Equipo','Pilar de l''Equip','Team Pillar','Montaje, explicación de reglas, arbitraje y cobertura oficial.','Muntatge, explicació de regles, arbitratge i cobertura oficial.','Setup, rules teaching, refereeing and official coverage.','[{"tier":"bronze","threshold":10},{"tier":"silver","threshold":30},{"tier":"gold","threshold":75},{"tier":"platinum","threshold":150}]',8),
('chronicler','tiered','difusion','manual',NULL,NULL,'pen-line','pink','Cronista Lúdico','Cronista Lúdic','Gaming Chronicler','Reseñas publicadas en el blog o en BGG.','Ressenyes publicades al blog o a BGG.','Reviews published on the blog or BGG.','[{"tier":"bronze","threshold":3},{"tier":"silver","threshold":8},{"tier":"gold","threshold":20},{"tier":"platinum","threshold":40}]',9),
('patron','tiered','ludoteca','manual',NULL,NULL,'gift','green','Mecenas de la Ludoteca','Mecenes de la Ludoteca','Library Patron','Donaciones de juegos a la ludoteca.','Donacions de jocs a la ludoteca.','Board game donations to the library.','[{"tier":"bronze","threshold":2},{"tier":"silver","threshold":5},{"tier":"gold","threshold":12},{"tier":"platinum","threshold":25}]',10),
('mentor','tiered','organizacion','manual',NULL,NULL,'users','teal','Mentor KLEFF','Mentor KLEFF','KLEFF Mentor','Acompañamiento de nuevos socios.','Acompanyament de nous socis.','Buddy support for new members.','[{"tier":"bronze","threshold":3},{"tier":"silver","threshold":8},{"tier":"gold","threshold":20},{"tier":"platinum","threshold":40}]',11),
('active_voice','tiered','participacion','karma','polls',NULL,'vote','coral','Voz Activa','Veu Activa','Active Voice','Participación en encuestas y votaciones de adquisiciones.','Participació en enquestes i votacions d''adquisicions.','Taking part in surveys and acquisition votes.','[{"tier":"bronze","threshold":10},{"tier":"silver","threshold":25},{"tier":"gold","threshold":60},{"tier":"platinum","threshold":120}]',12),
('streak_8','unique','participacion','manual',NULL,NULL,'flame','coral','Racha','Ratxa','Streak','8 Noches de Juego consecutivas sin fallar.','8 Nits de Joc consecutives sense fallar.','8 consecutive Game Nights without missing one.','[]',20),
('pioneer','unique','comunidad','karma','member_number','100','flag','gold','Pionero','Pioner','Pioneer','Entre los primeros 100 socios de KLEFF.','Entre els primers 100 socis de KLEFF.','Among the first 100 KLEFF members.','[]',21),
('founder','unique','comunidad','manual',NULL,NULL,'landmark','gold','Fundador','Fundador','Founder','Presente en la constitución formal de la Associació en 2026.','Present en la constitució formal de l''Associació el 2026.','Present at the formal founding of the Association in 2026.','[]',22),
('first_match','unique','comunidad','manual',NULL,NULL,'sparkle','coral','Primera Partida','Primera Partida','First Match','De las primeras personas en crear una partida en Ludoya.','De les primeres persones a crear una partida a Ludoya.','One of the first people to create a match on Ludoya.','[]',23),
('iron_streak','unique','participacion','manual',NULL,NULL,'zap','coral','Racha de Hierro','Ratxa de Ferro','Iron Streak','10 Noches de Juego consecutivas sin fallar.','10 Nits de Joc consecutives sense fallar.','10 consecutive Game Nights without missing one.','[]',24),
('anniversary','unique','comunidad','manual',NULL,NULL,'cake','pink','Aniversario KLEFF','Aniversari KLEFF','KLEFF Anniversary','Asistencia registrada al evento de aniversario.','Assistència registrada a l''esdeveniment d''aniversari.','Registered attendance at the anniversary event.','[]',25),
('org_member','unique','organizacion','manual',NULL,NULL,'crown','gold','Miembro de la Organización','Membre de l''Organització','Organisation Member','Junta Directiva y equipo core.','Junta Directiva i equip core.','Board and core team.','[]',26),
('volunteer','unique','organizacion','manual',NULL,NULL,'heart-handshake','teal','Voluntario','Voluntari','Volunteer','Primeras personas en asumir un rol de voluntariado estructurado.','Primeres persones a assumir un rol de voluntariat estructurat.','First people to take on a structured volunteering role.','[]',27),
('language_bridge','unique','comunidad','manual',NULL,NULL,'languages','teal','Puente Lingüístico','Pont Lingüístic','Language Bridge','Ayuda activa para integrar a miembros internacionales.','Ajuda activa per integrar membres internacionals.','Actively helps integrate international members.','[]',28),
('world_kleffer','unique','comunidad','manual',NULL,NULL,'globe','green','Kleffer del Mundo','Kleffer del Món','Kleffer of the World','Expat o Erasmus con asistencia sostenida varios meses.','Expat o Erasmus amb assistència sostinguda diversos mesos.','Expat or Erasmus with sustained attendance over several months.','[]',29),
('solidary_heart','unique','solidaridad','manual',NULL,NULL,'heart','pink','Corazón Solidario','Cor Solidari','Solidary Heart','Participación en eventos benéficos con Sant Joan de Déu.','Participació en esdeveniments benèfics amb Sant Joan de Déu.','Taking part in charity events with Sant Joan de Déu.','[]',30),
('alliance_explorer','unique','solidaridad','manual',NULL,NULL,'handshake','teal','Explorador de Alianzas','Explorador d''Aliances','Alliance Explorer','Asistencia a los primeros eventos con un partner nuevo.','Assistència als primers esdeveniments amb un partner nou.','Attendance at the first events with a new partner.','[]',31),
('table_champion','unique','torneos','manual',NULL,NULL,'medal','gold','Campeón de Mesa','Campió de Taula','Table Champion','Ganar un torneo oficial.','Guanyar un torneig oficial.','Winning an official tournament.','[]',32),
('sportsmanship','unique','torneos','manual',NULL,NULL,'swords','green','Espíritu Deportivo','Esperit Esportiu','Sportsmanship','Participar en 3 formatos de torneo distintos.','Participar en 3 formats de torneig diferents.','Taking part in 3 different tournament formats.','[]',33);