-- All allocators share the session lock; no live assignments are changed by this migration.
CREATE UNIQUE INDEX IF NOT EXISTS mm_players_unique_character ON public.mm_session_players(session_id,character_id) WHERE character_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.mm_lock_player_assignment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM 1 FROM mm_sessions WHERE id=NEW.session_id FOR UPDATE;
 IF NEW.character_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM mm_characters c JOIN mm_sessions s ON s.game_id=c.game_id WHERE s.id=NEW.session_id AND c.id=NEW.character_id AND NOT c.victim) THEN
  RAISE EXCEPTION 'Personaje no válido para esta partida';
 END IF;
 RETURN NEW;
END; $$;
CREATE OR REPLACE TRIGGER mm_player_assignment_lock BEFORE INSERT OR UPDATE OF character_id ON public.mm_session_players FOR EACH ROW EXECUTE FUNCTION public.mm_lock_player_assignment();

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
   ORDER BY ch.is_killer DESC,random() LIMIT 1;
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
    AND NOT EXISTS(SELECT 1 FROM mm_invitations i WHERE i.session_id=_session AND i.status='sent' AND i.character_id=ch.id) ORDER BY random() LIMIT 1;
   IF c IS NOT NULL THEN UPDATE mm_invitations SET character_id=c WHERE id=p.id; END IF;
  END LOOP;
 END IF;
 SELECT coalesce(jsonb_agg(ch.name),'[]') INTO missing FROM mm_characters ch WHERE ch.game_id=s.game_id AND NOT ch.victim AND NOT EXISTS(SELECT 1 FROM mm_session_players sp WHERE sp.session_id=_session AND sp.character_id=ch.id);
 RETURN jsonb_build_object('already',false,'assigned',assigned,'missing',missing);
END; $$;
REVOKE ALL ON FUNCTION public.mm_assign_characters(uuid,text,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mm_assign_characters(uuid,text,uuid,uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.mm_register_player(_invitation uuid,_name text,_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i mm_invitations; s mm_sessions; c uuid; pid uuid;
BEGIN
 SELECT session_id INTO s.id FROM mm_invitations WHERE id=_invitation;
 SELECT * INTO s FROM mm_sessions WHERE id=s.id FOR UPDATE;
 SELECT * INTO i FROM mm_invitations WHERE id=_invitation AND session_id=s.id FOR UPDATE;
 IF i.id IS NULL OR i.status<>'sent' THEN RAISE EXCEPTION 'Esta invitación ya se ha usado'; END IF;
 IF s.status='finished' THEN RAISE EXCEPTION 'Esta partida ya ha terminado'; END IF;
 c:=i.character_id;
 IF c IS NOT NULL AND EXISTS(SELECT 1 FROM mm_session_players WHERE session_id=s.id AND character_id=c) THEN c:=NULL; END IF;
 IF c IS NULL AND s.characters_released_at IS NOT NULL THEN
  SELECT ch.id INTO c FROM mm_characters ch WHERE ch.game_id=s.game_id AND NOT ch.victim
   AND NOT EXISTS(SELECT 1 FROM mm_session_players sp WHERE sp.session_id=s.id AND sp.character_id=ch.id)
   AND NOT EXISTS(SELECT 1 FROM mm_invitations inv WHERE inv.session_id=s.id AND inv.status='sent' AND inv.id<>i.id AND inv.character_id=ch.id) ORDER BY random() LIMIT 1;
  IF c IS NULL THEN RAISE EXCEPTION 'No quedan personajes disponibles'; END IF;
 END IF;
 INSERT INTO mm_session_players(session_id,character_id,invitation_id,display_name,email,access_code) VALUES(s.id,c,i.id,_name,i.email,_code) RETURNING id INTO pid;
 UPDATE mm_invitations SET status='registered',character_id=c WHERE id=i.id;
 RETURN pid;
END; $$;
REVOKE ALL ON FUNCTION public.mm_register_player(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mm_register_player(uuid,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.mm_prevent_joint_replay() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE act uuid; members uuid[];
BEGIN
 IF NEW.payload->>'kind'<>'joint' THEN RETURN NEW; END IF;
 SELECT current_act_id INTO act FROM mm_sessions WHERE id=NEW.session_id FOR UPDATE;
 members:=array_prepend(NEW.from_player,NEW.to_players);
 IF EXISTS(SELECT 1 FROM mm_action_requests r WHERE r.session_id=NEW.session_id AND r.payload->>'kind'='joint' AND r.payload->>'source_id'=NEW.payload->>'source_id'
  AND (r.status='completed' OR (r.status='pending' AND (r.payload->>'act_id')::uuid=act))
  AND array_prepend(r.from_player,r.to_players) && members) THEN
  RAISE EXCEPTION 'Esta acción ya está pendiente o completada para uno de los participantes';
 END IF;
 RETURN NEW;
END; $$;
CREATE OR REPLACE TRIGGER mm_joint_replay_guard BEFORE INSERT ON public.mm_action_requests FOR EACH ROW EXECUTE FUNCTION public.mm_prevent_joint_replay();
REVOKE ALL ON FUNCTION public.mm_prevent_joint_replay() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.mm_lock_player_assignment() FROM PUBLIC,anon,authenticated;