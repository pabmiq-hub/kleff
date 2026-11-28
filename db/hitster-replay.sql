ALTER TABLE public.hitster_games ADD COLUMN IF NOT EXISTS play_number integer NOT NULL DEFAULT 1;
ALTER TABLE public.hitster_games ADD COLUMN IF NOT EXISTS round_offset integer NOT NULL DEFAULT 0;
ALTER TABLE public.hitster_rounds ADD COLUMN IF NOT EXISTS play_number integer NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION public.hitster_restart_game(p_game_id uuid, p_expected_play integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.hitster_games; last_number integer;
BEGIN
  SELECT * INTO g FROM public.hitster_games WHERE id = p_game_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Partida no encontrada.'; END IF;
  IF g.play_number <> p_expected_play OR g.status = 'draft' THEN
    RAISE EXCEPTION 'La partida ya ha cambiado. Actualiza el panel.';
  END IF;
  SELECT coalesce(max(round_number), 0) INTO last_number FROM public.hitster_rounds WHERE game_id = p_game_id;
  UPDATE public.hitster_rounds SET phase = 'closed' WHERE game_id = p_game_id AND phase <> 'closed';
  UPDATE public.hitster_participants SET marks = to_jsonb(array_fill(false, ARRAY[25])) WHERE game_id = p_game_id;
  UPDATE public.hitster_games SET status = 'draft', current_round_id = NULL,
    winner_participant_ids = '{}', tiebreak_participant_ids = '{}',
    play_number = play_number + 1, round_offset = last_number, updated_at = now()
    WHERE id = p_game_id;
END;
$$;
REVOKE ALL ON FUNCTION public.hitster_restart_game(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hitster_restart_game(uuid, integer) TO service_role;