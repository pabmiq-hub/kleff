-- Orden de reparto de personajes en Juegos.
-- El importador guarda la posición de cada personaje en el JSON (sort_order). El reparto da primero el asesino
-- y después los personajes por orden de aparición, de modo que con menos jugadores que personajes se cubren
-- siempre los esenciales (los primeros del JSON). Los juegos ya importados tienen sort_order = 0 en todos los
-- personajes y siguen repartiéndose al azar, igual que antes.
ALTER TABLE public.mm_characters ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.mm_assign_characters(_session uuid,_mode text,_player uuid DEFAULT NULL,_invitation uuid DEFAULT NULL,_character uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s mm_sessions; g mm_games; p record; c uuid; killer uuid; n int; assigned int:=0; missing jsonb;
BEGIN
 SELECT * INTO s FROM mm_sessions WHERE id=_session FOR UPDATE;
 IF s.id IS NULL THEN RAISE EXCEPTION 'Partida no encontrada'; END IF;
 SELECT * INTO g FROM mm_games WHERE id=s.game_id;
 IF _mode='release' AND s.characters_released_at IS NOT NULL THEN RETURN jsonb_build_object('already',true,'assigned',0,'missing','[]'::jsonb); END IF;
 IF _mode IN ('release','random') AND s.status<>'lobby' THEN RAISE EXCEPTION 'Solo se puede repartir antes de iniciar la partida'; END IF;
 IF _mode='random' AND s.characters_released_at IS NOT NULL THEN RAISE EXCEPTION 'Los personajes ya se han repartido'; END IF;
 IF _mode='assign' THEN
  IF _character IS NOT NULL AND NOT EXISTS(SELECT 1 FROM mm_characters WHERE id=_character AND game_id=s.game_id AND NOT victim) THEN RAISE EXCEPTION 'Personaje no válido'; END IF;
  IF _player IS NOT NULL THEN
   IF NOT EXISTS(SELECT 1 FROM mm_session_players WHERE id=_player AND session_id=_session) THEN RAISE EXCEPTION 'Jugador no válido'; END IF;
   UPDATE mm_session_players SET character_id=NULL,ready=false WHERE session_id=_session AND character_id=_character AND id<>_player;
   UPDATE mm_invitations SET character_id=NULL WHERE session_id=_session AND status='sent' AND character_id=_character;
   UPDATE mm_session_players SET character_id=_character,ready=false WHERE id=_player AND session_id=_session;
  ELSIF _invitation IS NOT NULL THEN
   IF NOT EXISTS(SELECT 1 FROM mm_invitations WHERE id=_invitation AND session_id=_session AND status='sent') THEN RAISE EXCEPTION 'Invitación no válida'; END IF;
   IF _character IS NOT NULL AND (EXISTS(SELECT 1 FROM mm_session_players WHERE session_id=_session AND character_id=_character) OR EXISTS(SELECT 1 FROM mm_invitations WHERE session_id=_session AND status='sent' AND character_id=_character AND id<>_invitation)) THEN RAISE EXCEPTION 'El personaje ya está asignado'; END IF;
   UPDATE mm_invitations SET character_id=_character WHERE id=_invitation AND session_id=_session;
  ELSE RAISE EXCEPTION 'Falta el jugador o invitación'; END IF;
  RETURN jsonb_build_object('assigned',1);
 END IF;
 IF _mode NOT IN ('release','random') THEN RAISE EXCEPTION 'Modo no válido'; END IF;
 SELECT count(*) INTO n FROM mm_session_players WHERE session_id=_session;
 IF _mode='release' AND n<g.min_players THEN RAISE EXCEPTION 'Faltan % jugador(es) para completar el mínimo de %.',g.min_players-n,g.min_players; END IF;
 IF n>LEAST(g.max_players,(SELECT count(*) FROM mm_characters WHERE game_id=s.game_id AND NOT victim)) THEN RAISE EXCEPTION 'Hay más jugadores que personajes disponibles'; END IF;
 FOR p IN SELECT id FROM mm_session_players WHERE session_id=_session AND character_id IS NULL ORDER BY registered_at,id LOOP
  SELECT ch.id INTO c FROM mm_characters ch WHERE ch.game_id=s.game_id AND NOT ch.victim
   AND NOT EXISTS(SELECT 1 FROM mm_session_players sp WHERE sp.session_id=_session AND sp.character_id=ch.id)
   AND (_mode='release' OR NOT EXISTS(SELECT 1 FROM mm_invitations i WHERE i.session_id=_session AND i.status='sent' AND i.character_id=ch.id))
   ORDER BY ch.is_killer DESC,ch.sort_order,random() LIMIT 1;
  IF c IS NULL AND _mode='release' THEN RAISE EXCEPTION 'No hay suficientes personajes disponibles'; END IF;
  IF c IS NOT NULL THEN UPDATE mm_session_players SET character_id=c,ready=false WHERE id=p.id; assigned:=assigned+1; END IF;
 END LOOP;
 IF _mode='release' THEN
  FOR killer IN SELECT ch.id FROM mm_characters ch WHERE ch.game_id=s.game_id AND ch.is_killer AND NOT ch.victim AND NOT EXISTS(SELECT 1 FROM mm_session_players sp WHERE sp.session_id=_session AND sp.character_id=ch.id) LOOP
   SELECT sp.id INTO c FROM mm_session_players sp JOIN mm_characters ch ON ch.id=sp.character_id WHERE sp.session_id=_session AND NOT ch.is_killer ORDER BY sp.registered_at DESC,sp.id LIMIT 1;
   IF c IS NULL THEN RAISE EXCEPTION 'Falta cubrir un personaje imprescindible'; END IF;
   UPDATE mm_session_players SET character_id=killer,ready=false WHERE id=c; assigned:=assigned+1;
  END LOOP;
  -- Pending invitations must not retain reservations already handed to attendees.
  UPDATE mm_invitations i SET character_id=NULL WHERE i.session_id=_session AND i.status='sent' AND EXISTS(SELECT 1 FROM mm_session_players sp WHERE sp.session_id=_session AND sp.character_id=i.character_id);
  UPDATE mm_sessions SET characters_released_at=now(),release_at=NULL WHERE id=_session;
 ELSE
  FOR p IN SELECT id FROM mm_invitations WHERE session_id=_session AND status='sent' AND character_id IS NULL ORDER BY created_at,id LOOP
   SELECT ch.id INTO c FROM mm_characters ch WHERE ch.game_id=s.game_id AND NOT ch.victim
    AND NOT EXISTS(SELECT 1 FROM mm_session_players sp WHERE sp.session_id=_session AND sp.character_id=ch.id)
    AND NOT EXISTS(SELECT 1 FROM mm_invitations i WHERE i.session_id=_session AND i.status='sent' AND i.character_id=ch.id) ORDER BY ch.sort_order,random() LIMIT 1;
   IF c IS NOT NULL THEN UPDATE mm_invitations SET character_id=c WHERE id=p.id; END IF;
  END LOOP;
 END IF;
 SELECT coalesce(jsonb_agg(ch.name),'[]') INTO missing FROM mm_characters ch WHERE ch.game_id=s.game_id AND NOT ch.victim AND NOT EXISTS(SELECT 1 FROM mm_session_players sp WHERE sp.session_id=_session AND sp.character_id=ch.id);
 RETURN jsonb_build_object('already',false,'assigned',assigned,'missing',missing);
END; $$;
REVOKE ALL ON FUNCTION public.mm_assign_characters(uuid,text,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mm_assign_characters(uuid,text,uuid,uuid,uuid) TO service_role;
