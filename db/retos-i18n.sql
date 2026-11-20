-- Retos bilingües (ES/EN): idioma del participante y traducción de cada misión.
ALTER TABLE public.reto_missions ADD COLUMN IF NOT EXISTS title_en text;
ALTER TABLE public.reto_participants ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'es';
DO $$ BEGIN
  ALTER TABLE public.reto_participants ADD CONSTRAINT reto_participants_language_chk CHECK (language IN ('es','en'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
UPDATE public.reto_missions m SET title_en = v.en FROM (VALUES
('Sigue en Instagram a las cuentas del reto','Follow the challenge accounts on Instagram'),
('Haz una publicación en redes etiquetando a las cuentas del reto','Make a social media post tagging the challenge accounts'),
('Sube una historia etiquetando a las cuentas del reto','Post a story tagging the challenge accounts'),
('Registra en Ludoya una partida jugada hoy','Log a game you played today on Ludoya'),
('Haz que otra persona que esté jugando contigo bostece.','Make another person playing with you yawn.'),
('Consigue que otra persona que esté jugando contigo termine tu frase.','Get another person playing with you to finish your sentence.'),
('Dile a los demás jugadores que huele a caca de perro. Consigue que al menos dos miren sus zapatos.','Tell the other players it smells like dog poo. Get at least two of them to check their shoes.'),
('Consigue que otra persona que esté jugando contigo debata contigo hacia dónde está el Norte.','Get another person playing with you to argue with you about which way is North.'),
('Convence a otra persona que esté jugando contigo de que hay otra zona de juegos nueva fuera. Si te sigue, enséñale esta misión.','Convince another person playing with you that there is a new game area outside. If they follow you, show them this mission.'),
('Finge tener algo en el ojo. Consigue que otra persona que esté jugando contigo te lo revise.','Pretend you have something in your eye. Get another person playing with you to check it.'),
('Consigue que otra persona que esté jugando contigo te diga su edad.','Get another person playing with you to tell you their age.'),
('Esconde esta carta en la comida de otra persona que esté jugando contigo y quédate a ver cuándo la encuentre.','Hide this card in another player''s food and stay to watch when they find it.'),
('Consigue que otra persona que esté jugando contigo trate de tocarse la nariz con la lengua.','Get another person playing with you to try to touch their nose with their tongue.'),
('Esconde esta carta en la caja de un juego. Consigue que otra persona que esté jugando contigo la encuentre.','Hide this card in a game box. Get another person playing with you to find it.'),
('Haz una torre de objetos en equilibrio y consigue que otra persona que esté jugando contigo la tire.','Build a tower of balanced objects and get another person playing with you to knock it over.'),
('Consigue que otra persona que esté jugando contigo te rasque la espalda.','Get another person playing with you to scratch your back.'),
('Consigue que otra persona que esté jugando contigo repita lo que ha dicho. Dos veces.','Get another person playing with you to repeat what they said. Twice.'),
('Consigue que otra persona que esté jugando contigo visite la cuenta de TikTok: @kleff.bcn','Get another person playing with you to visit the TikTok account: @kleff.bcn'),
('Consigue que otra persona que esté jugando contigo te acuse de hacer trampas.','Get another person playing with you to accuse you of cheating.'),
('Consigue que otra persona que esté jugando contigo se haga una selfie contigo. Debe ser con su móvil.','Get another person playing with you to take a selfie with you. It must be on their phone.'),
('Consigue que otra persona que esté jugando contigo choque los puños contigo. Dos veces.','Get another person playing with you to fist-bump you. Twice.'),
('Haz que un jugador te haga un cumplido sobre tu pelo.','Get a player to compliment your hair.'),
('Di mal una cita de una película y haz que otro jugador te corrija.','Misquote a film line and get another player to correct you.'),
('Haz que un jugador te dé un choque de manos dos veces durante la noche de juegos.','Get a player to high-five you twice during the game night.'),
('Haz que un jugador te diga «no eres feo/a».','Get a player to tell you "you''re not ugly".'),
('Haz que un jugador te dé un golpe.','Get a player to hit you.'),
('Haz que un jugador te pregunte si estás llorando.','Get a player to ask you if you''re crying.'),
('Haz que un jugador confiese un delito.','Get a player to confess a crime.'),
('Haz que un jugador haga un nudo en un globo.','Get a player to tie a knot in a balloon.'),
('Dile a un jugador que algo se activa por voz. Haz que lo pruebe.','Tell a player something is voice-activated. Get them to try it.'),
('Haz que un jugador diga algo en otro idioma.','Get a player to say something in another language.'),
('Haz que un jugador te imite.','Get a player to imitate you.'),
('Haz que un jugador diga «se acabó el juego / la partida».','Get a player to say "game over".'),
('Invéntate una palabra y haz que otro jugador te pregunte qué significa.','Make up a word and get another player to ask you what it means.')
) AS v(es, en) WHERE m.title = v.es AND m.title_en IS NULL;
