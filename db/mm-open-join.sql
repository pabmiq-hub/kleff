-- Open join link: players self-register with name+email; game metadata (genre/difficulty).
ALTER TABLE public.mm_sessions ADD COLUMN IF NOT EXISTS join_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.mm_games ADD COLUMN IF NOT EXISTS genre text;
ALTER TABLE public.mm_games ADD COLUMN IF NOT EXISTS difficulty text;
ALTER TABLE public.mm_invitations ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'email';

-- Atomic self-registration through the public link. Shares the session lock with
-- the other allocators so concurrent joins cannot overfill the session.
CREATE OR REPLACE FUNCTION public.mm_join_session(_session uuid, _name text, _email text, _code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s mm_sessions; g mm_games; c uuid; pid uuid; iid uuid; n int;
BEGIN
 SELECT * INTO s FROM mm_sessions WHERE id=_session FOR UPDATE;
 IF s.id IS NULL THEN RAISE EXCEPTION 'Partida no encontrada'; END IF;
 IF NOT s.join_enabled THEN RAISE EXCEPTION 'Las inscripciones por enlace están cerradas'; END IF;
 IF s.status<>'lobby' THEN RAISE EXCEPTION 'Esta partida ya ha comenzado'; END IF;
 SELECT * INTO g FROM mm_games WHERE id=s.game_id;
 IF EXISTS(SELECT 1 FROM mm_session_players WHERE session_id=s.id AND lower(email)=lower(_email)) THEN
  RAISE EXCEPTION 'Ya estás apuntado a esta partida con ese correo. Entra con tu código personal.';
 END IF;
 IF EXISTS(SELECT 1 FROM mm_invitations WHERE session_id=s.id AND status='sent' AND lower(email)=lower(_email)) THEN
  RAISE EXCEPTION 'Ya tienes una invitación para esta partida: revisa tu correo.';
 END IF;
 SELECT count(*) INTO n FROM mm_session_players WHERE session_id=s.id;
 IF n>=LEAST(g.max_players,(SELECT count(*) FROM mm_characters WHERE game_id=s.game_id AND NOT victim)) THEN
  RAISE EXCEPTION 'La partida está completa';
 END IF;
 c:=NULL;
 IF s.characters_released_at IS NOT NULL THEN
  SELECT ch.id INTO c FROM mm_characters ch WHERE ch.game_id=s.game_id AND NOT ch.victim
   AND NOT EXISTS(SELECT 1 FROM mm_session_players sp WHERE sp.session_id=s.id AND sp.character_id=ch.id)
   AND NOT EXISTS(SELECT 1 FROM mm_invitations inv WHERE inv.session_id=s.id AND inv.status='sent' AND inv.character_id=ch.id)
   ORDER BY random() LIMIT 1;
  IF c IS NULL THEN RAISE EXCEPTION 'No quedan personajes disponibles'; END IF;
 END IF;
 INSERT INTO mm_invitations(session_id,email,token,status,sent_at,character_id,source)
  VALUES(s.id,_email,replace(gen_random_uuid()::text,'-',''),'registered',now(),c,'link') RETURNING id INTO iid;
 INSERT INTO mm_session_players(session_id,character_id,invitation_id,display_name,email,access_code)
  VALUES(s.id,c,iid,_name,_email,_code) RETURNING id INTO pid;
 RETURN pid;
END; $$;
REVOKE ALL ON FUNCTION public.mm_join_session(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mm_join_session(uuid,text,text,text) TO service_role;
