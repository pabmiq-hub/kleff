
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🎲',
  photo_url text,
  favorite_game text NOT NULL DEFAULT '—',
  lucky_number text NOT NULL DEFAULT '—',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  role_es text NOT NULL DEFAULT '',
  role_ca text NOT NULL DEFAULT '',
  role_en text NOT NULL DEFAULT '',
  bio_es text NOT NULL DEFAULT '',
  bio_ca text NOT NULL DEFAULT '',
  bio_en text NOT NULL DEFAULT '',
  color_es text NOT NULL DEFAULT '—',
  color_ca text NOT NULL DEFAULT '—',
  color_en text NOT NULL DEFAULT '—',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.team_members TO anon, authenticated;
GRANT ALL ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members public read" ON public.team_members
  FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "team_members admin insert" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "team_members admin update" ON public.team_members
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "team_members admin delete" ON public.team_members
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER team_members_set_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed with existing hardcoded members
INSERT INTO public.team_members (name, emoji, favorite_game, lucky_number, sort_order, role_es, role_en, role_ca, bio_es, bio_en, bio_ca, color_es, color_en, color_ca) VALUES
('Pau','🎲','King of Tokyo','7',10,
 'Fundador & Estrategia','Founder & Strategy','Fundador & Estratègia',
 'Responsable de buscar colaboraciones y crear nuevos eventos. Toma las decisiones estratégicas. De día abogado de startups; de noche, una buena peli con pizza margherita.',
 'In charge of partnerships and new events. Makes strategic decisions. Lawyer for startups by day; movies and margherita pizza by night.',
 'Responsable de col·laboracions i nous esdeveniments. Pren les decisions estratègiques. De dia advocat de startups; de nit, una bona pel·li amb pizza margherita.',
 'Azul','Blue','Blau'),
('Pol','🏗️','Splendor','7',20,
 'Arquitecto de juegos','Game Architect','Arquitecte de jocs',
 'Mantiene el orden en la colección de juegos de KLEFF. Se describe como arquitecto de juegos, colaborando con autores y editores para perfeccionar reglas.',
 'Keeps order in KLEFF''s game collection. Self-described as a game architect, collaborating with designers and publishers to refine rules.',
 'Manté l''ordre en la col·lecció de jocs. Es descriu com arquitecte de jocs, col·laborant amb autors i editors per perfeccionar regles.',
 'Azul','Blue','Blau'),
('Beatriz','🎯','Stone Age','2',30,
 'Eventos & retos','Events & challenges','Esdeveniments & reptes',
 'Apoya en la organización de eventos. Maestra de educación infantil con corazón de jugona. Le encanta diseñar retos, enseñar jugando y vivir aventuras.',
 'Supports event organization. Early-years teacher with a gamer''s heart. Loves designing challenges, teaching through play and new adventures.',
 'Dona suport a l''organització d''esdeveniments. Mestra d''educació infantil amb cor de jugona. Li encanta dissenyar reptes i ensenyar jugant.',
 'Me gusta variar','Likes to mix it up','M''agrada variar'),
('Jordi','🎮','—','—',40,'Equipo KLEFF','KLEFF crew','Equip KLEFF',
 'Próximamente. Estamos preparando su ficha completa.',
 'Coming soon. We''re putting together their full profile.',
 'Pròximament. Estem preparant la seva fitxa completa.',
 '—','—','—'),
('Karen','✨','—','—',50,'Equipo KLEFF','KLEFF crew','Equip KLEFF',
 'Próximamente. Estamos preparando su ficha completa.',
 'Coming soon. We''re putting together their full profile.',
 'Pròximament. Estem preparant la seva fitxa completa.',
 '—','—','—'),
('Leiro','🃏','—','—',60,'Equipo KLEFF','KLEFF crew','Equip KLEFF',
 'Próximamente. Estamos preparando su ficha completa.',
 'Coming soon. We''re putting together their full profile.',
 'Pròximament. Estem preparant la seva fitxa completa.',
 '—','—','—'),
('Eric','🎲','—','—',70,'Equipo KLEFF','KLEFF crew','Equip KLEFF',
 'Próximamente. Estamos preparando su ficha completa.',
 'Coming soon. We''re putting together their full profile.',
 'Pròximament. Estem preparant la seva fitxa completa.',
 '—','—','—');
