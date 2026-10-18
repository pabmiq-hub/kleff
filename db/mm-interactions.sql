ALTER TABLE public.mm_games ADD COLUMN IF NOT EXISTS economy jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.mm_items ADD COLUMN IF NOT EXISTS ref text;
ALTER TABLE public.mm_items ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'item';
ALTER TABLE public.mm_items ADD COLUMN IF NOT EXISTS amount integer NOT NULL DEFAULT 0;
ALTER TABLE public.mm_items ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';
ALTER TABLE public.mm_items ADD COLUMN IF NOT EXISTS use_config jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.mm_abilities ADD COLUMN IF NOT EXISTS ref text;
ALTER TABLE public.mm_abilities ADD COLUMN IF NOT EXISTS use_config jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.mm_joint_actions ADD COLUMN IF NOT EXISTS ref text;
ALTER TABLE public.mm_joint_actions ADD COLUMN IF NOT EXISTS proposal_text text;
CREATE TABLE IF NOT EXISTS public.mm_wallets (
 session_player_id uuid PRIMARY KEY REFERENCES public.mm_session_players(id) ON DELETE CASCADE,
 amount integer NOT NULL DEFAULT 0 CHECK(amount>=0), currency text NOT NULL DEFAULT 'EUR'
);
GRANT ALL ON public.mm_wallets TO service_role;
ALTER TABLE public.mm_wallets ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.mm_inventory (
 session_id uuid NOT NULL REFERENCES public.mm_sessions(id) ON DELETE CASCADE,
 item_id uuid NOT NULL REFERENCES public.mm_items(id) ON DELETE CASCADE,
 owner_id uuid NOT NULL REFERENCES public.mm_session_players(id) ON DELETE CASCADE,
 PRIMARY KEY(session_id,item_id)
);
GRANT ALL ON public.mm_inventory TO service_role;
ALTER TABLE public.mm_inventory ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.mm_income_receipts (
 session_player_id uuid NOT NULL REFERENCES public.mm_session_players(id) ON DELETE CASCADE,
 event_ref text NOT NULL, PRIMARY KEY(session_player_id,event_ref)
);
GRANT ALL ON public.mm_income_receipts TO service_role;
ALTER TABLE public.mm_income_receipts ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.mm_init_interactions(_session uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO mm_wallets(session_player_id,amount,currency)
 SELECT p.id,coalesce(sum(i.amount),0)::int,coalesce(min(i.currency),'EUR')
 FROM mm_session_players p LEFT JOIN mm_items i ON i.character_id=p.character_id AND i.type='money'
 WHERE p.session_id=_session AND p.character_id IS NOT NULL GROUP BY p.id
 ON CONFLICT DO NOTHING;
 INSERT INTO mm_inventory(session_id,item_id,owner_id)
 SELECT _session,i.id,p.id FROM mm_session_players p JOIN mm_items i ON i.character_id=p.character_id AND i.type<>'money'
 WHERE p.session_id=_session ON CONFLICT DO NOTHING;
END; $$;
REVOKE ALL ON FUNCTION public.mm_init_interactions(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mm_init_interactions(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.mm_commit_interaction(_session uuid,_actor uuid,_command text,_request uuid,_plan jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s mm_sessions; r mm_action_requests; pid uuid; a jsonb; n integer; v_id uuid; accepted jsonb;
BEGIN
 SELECT * INTO s FROM mm_sessions WHERE id=_session FOR UPDATE;
 IF s.status<>'running' THEN RAISE EXCEPTION 'La partida no está activa'; END IF;
 IF NOT EXISTS(SELECT 1 FROM mm_session_players WHERE id=_actor AND session_id=_session AND character_id IS NOT NULL) THEN RAISE EXCEPTION 'Jugador no válido'; END IF;
 PERFORM mm_init_interactions(_session);
 IF _command='propose' THEN
  IF (_plan->>'act_id')::uuid IS DISTINCT FROM s.current_act_id THEN RAISE EXCEPTION 'El acto ha cambiado'; END IF;
  IF EXISTS(SELECT 1 FROM mm_action_requests WHERE session_id=_session AND from_player=_actor AND status='pending' AND payload->>'source_id'=_plan->>'source_id') THEN RAISE EXCEPTION 'Ya hay una propuesta pendiente'; END IF;
  FOR pid IN SELECT jsonb_array_elements_text(_plan->'targets')::uuid LOOP
   IF pid=_actor OR NOT EXISTS(SELECT 1 FROM mm_session_players WHERE id=pid AND session_id=_session AND character_id IS NOT NULL) THEN RAISE EXCEPTION 'Destinatario no válido'; END IF;
  END LOOP;
  INSERT INTO mm_action_requests(session_id,from_player,to_players,joint_action_id,payload)
  VALUES(_session,_actor,ARRAY(SELECT jsonb_array_elements_text(_plan->'targets')::uuid),(_plan->>'joint_id')::uuid,_plan) RETURNING id INTO v_id;
  IF jsonb_array_length(_plan->'targets')>0 THEN RETURN v_id; END IF;
 ELSE
  v_id:=_request;
 END IF;
 SELECT * INTO r FROM mm_action_requests WHERE id=v_id AND session_id=_session FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Propuesta no válida'; END IF;
 IF r.status<>'pending' THEN RETURN r.id; END IF;
 IF _command='cancel' THEN
  IF r.from_player<>_actor THEN RAISE EXCEPTION 'No puedes cancelar esta propuesta'; END IF;
  UPDATE mm_action_requests SET status='rejected',resolved_at=now() WHERE id=r.id; RETURN r.id;
 END IF;
 IF _command<>'propose' AND NOT(_actor=ANY(r.to_players)) THEN RAISE EXCEPTION 'No eres destinatario'; END IF;
 IF _command='reject' THEN
  UPDATE mm_action_requests SET status='rejected',resolved_at=now() WHERE id=r.id; RETURN r.id;
 END IF;
 IF (r.payload->>'act_id')::uuid IS DISTINCT FROM s.current_act_id THEN
  UPDATE mm_action_requests SET status='expired',resolved_at=now() WHERE id=r.id; RETURN r.id;
 END IF;
 accepted:=coalesce(r.payload->'accepted','[]'::jsonb);
 IF _command='accept' AND NOT accepted ? _actor::text THEN accepted:=accepted || to_jsonb(_actor::text); END IF;
 UPDATE mm_action_requests SET payload=jsonb_set(payload,'{accepted}',accepted) WHERE id=r.id;
 IF EXISTS(SELECT 1 FROM unnest(r.to_players) p WHERE NOT accepted ? p::text) THEN RETURN r.id; END IF;
 IF r.payload->>'kind'='money' THEN
  n:=(r.payload->>'amount')::int; pid:=r.to_players[1];
  IF n<=0 OR (SELECT currency FROM mm_wallets WHERE session_player_id=r.from_player)<>(SELECT currency FROM mm_wallets WHERE session_player_id=pid) THEN RAISE EXCEPTION 'Cantidad o moneda no válida'; END IF;
  UPDATE mm_wallets SET amount=amount-n WHERE session_player_id=r.from_player AND amount>=n;
  IF NOT FOUND THEN RAISE EXCEPTION 'Saldo insuficiente'; END IF;
  UPDATE mm_wallets SET amount=amount+n WHERE session_player_id=pid;
 END IF;
 FOR a IN SELECT jsonb_array_elements(coalesce(r.payload->'resources','[]')) LOOP
  IF a->>'kind'='ability' THEN
   UPDATE mm_player_abilities SET uses_left=uses_left-1 WHERE session_player_id=(a->>'player_id')::uuid AND ability_id=(a->>'id')::uuid AND uses_left>0;
   IF NOT FOUND THEN RAISE EXCEPTION 'Habilidad agotada'; END IF;
  ELSIF a->>'kind'='item' THEN
   IF NOT EXISTS(SELECT 1 FROM mm_inventory WHERE session_id=_session AND item_id=(a->>'id')::uuid AND owner_id=(a->>'player_id')::uuid) THEN RAISE EXCEPTION 'El objeto ya no está disponible'; END IF;
  END IF;
 END LOOP;
 IF r.payload->>'kind'='item' THEN
  UPDATE mm_inventory SET owner_id=r.to_players[1] WHERE session_id=_session AND item_id=(r.payload->>'source_id')::uuid AND owner_id=r.from_player;
  IF NOT FOUND THEN RAISE EXCEPTION 'El objeto ya no es tuyo'; END IF;
 END IF;
 FOR a IN SELECT jsonb_array_elements(coalesce(r.payload->'unlocks','[]')) LOOP
  INSERT INTO mm_player_unlocks(session_player_id,evidence_id,secret_id,via)
  VALUES((a->>'player_id')::uuid,(a->>'evidence_id')::uuid,(a->>'secret_id')::uuid,'interaction');
 END LOOP;
 UPDATE mm_action_requests SET status='completed',resolved_at=now(),result=payload->'results' WHERE id=r.id;
 INSERT INTO mm_event_log(session_id,player_id,type,payload) VALUES(_session,r.from_player,'interaction_completed',jsonb_build_object('request_id',r.id,'kind',r.payload->>'kind'));
 RETURN r.id;
END; $$;
REVOKE ALL ON FUNCTION public.mm_commit_interaction(uuid,uuid,text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mm_commit_interaction(uuid,uuid,text,uuid,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.mm_apply_income(_session uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s mm_sessions; ev jsonb; p uuid; current_pos integer; ev_pos integer;
BEGIN
 SELECT * INTO s FROM mm_sessions WHERE id=_session FOR UPDATE;
 IF s.status NOT IN ('running','paused') THEN RETURN; END IF;
 PERFORM mm_init_interactions(_session);
 SELECT position INTO current_pos FROM mm_acts WHERE id=s.current_act_id;
 FOR ev IN SELECT jsonb_array_elements(coalesce((SELECT economy->'income_events' FROM mm_games WHERE id=s.game_id),'[]')) LOOP
  SELECT position INTO ev_pos FROM mm_acts WHERE game_id=s.game_id AND key=ev->>'act';
  IF ev_pos IS NULL OR ev_pos>current_pos THEN CONTINUE; END IF;
  SELECT sp.id INTO p FROM mm_session_players sp JOIN mm_characters c ON c.id=sp.character_id WHERE sp.session_id=s.id AND c.ref=ev->>'character';
  IF p IS NULL THEN CONTINUE; END IF;
  INSERT INTO mm_income_receipts(session_player_id,event_ref) VALUES(p,ev->>'ref') ON CONFLICT DO NOTHING;
  IF FOUND THEN
   UPDATE mm_wallets SET amount=amount+(ev->>'amount')::int WHERE session_player_id=p;
   INSERT INTO mm_event_log(session_id,player_id,type,payload) VALUES(s.id,p,'income_received',jsonb_build_object('amount',ev->'amount','ref',ev->>'ref'));
  END IF;
 END LOOP;
END; $$;
REVOKE ALL ON FUNCTION public.mm_apply_income(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mm_apply_income(uuid) TO service_role;
