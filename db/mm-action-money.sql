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
  UPDATE mm_action_requests SET status='expired',resolved_at=now()
  WHERE session_id=_session AND status='pending' AND (payload->>'act_id')::uuid IS DISTINCT FROM s.current_act_id;
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
 -- Automatic money rewards/costs from joint-action results (negative = cost).
 FOR a IN SELECT jsonb_array_elements(coalesce(r.payload->'money','[]')) LOOP
  n:=(a->>'amount')::int;
  INSERT INTO mm_wallets(session_player_id,amount) VALUES((a->>'player_id')::uuid,0) ON CONFLICT DO NOTHING;
  UPDATE mm_wallets SET amount=amount+n WHERE session_player_id=(a->>'player_id')::uuid AND amount+n>=0;
  IF NOT FOUND THEN RAISE EXCEPTION 'Saldo insuficiente para esta acción'; END IF;
 END LOOP;
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
