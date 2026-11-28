import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

const connection = process.env["APP_SUPABASE_DATABASE_URL"];
const suite = connection ? describe : describe.skip;

suite("Hitster replay persistence", () => {
  function query(assertion: string) {
    if (!connection) throw new Error("Database connection missing");
    const game = randomUUID();
    const participant = randomUUID();
    const round = randomUUID();
    return execFileSync("psql", [connection, "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", `
      BEGIN;
      INSERT INTO public.hitster_games(id,title,slug,status) VALUES ('${game}','Replay test','test-${game}','playing');
      INSERT INTO public.hitster_participants(id,game_id,nickname,nickname_key,avatar_url,token,access_code,board,marks)
      VALUES ('${participant}','${game}','Player','player','test-avatar','test-${participant}','ABCDEF','["green"]','[true]');
      INSERT INTO public.hitster_rounds(id,game_id,round_number,category_key,ends_at) VALUES ('${round}','${game}',1,'green',now());
      INSERT INTO public.hitster_answers(game_id,round_id,participant_id,answer_text,is_correct) VALUES ('${game}','${round}','${participant}','Queen',true);
      UPDATE public.hitster_games SET current_round_id='${round}',winner_participant_ids=ARRAY['${participant}'::uuid] WHERE id='${game}';
      SELECT public.hitster_restart_game('${game}',1);
      ${assertion.replaceAll("GAME", game).replaceAll("PLAYER", participant).replaceAll("ROUND", round)}
      ROLLBACK;
    `], { encoding: "utf8" });
  }

  it("waits for Empezar partida, clears winners and restarts displayed rounds at one", () => {
    const result = query(`SELECT status || ':' || play_number || ':' || round_offset || ':' || (current_round_id IS NULL) || ':' || cardinality(winner_participant_ids) FROM public.hitster_games WHERE id='GAME';`);
    expect(result).toContain("draft:2:1:true:0");
  });

  it("retains participants, boards, tokens and recovery codes while removing every cross", () => {
    const result = query(`SELECT nickname || ':' || token || ':' || access_code || ':' || (board='["green"]'::jsonb) || ':' || jsonb_array_length(marks) || ':' || (marks @> '[true]'::jsonb) FROM public.hitster_participants WHERE id='PLAYER';`);
    expect(result).toMatch(/Player:test-[a-f0-9-]+:ABCDEF:true:25:false/);
  });

  it("keeps past answers and closes the previous round", () => {
    const result = query(`SELECT a.answer_text || ':' || r.phase || ':' || r.play_number FROM public.hitster_answers a JOIN public.hitster_rounds r ON r.id=a.round_id WHERE r.id='ROUND';`);
    expect(result).toContain("Queen:closed:1");
  });

  it("rejects duplicate or stale restarts", () => {
    const result = query(`DO $$ BEGIN
      BEGIN PERFORM public.hitster_restart_game('GAME',1); RAISE EXCEPTION 'Unexpected restart';
      EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE 'La partida ya ha cambiado%' THEN RAISE; END IF; END;
    END $$;
    SELECT play_number FROM public.hitster_games WHERE id='GAME';`);
    expect(result).toMatch(/\n2\n/);
  });

  it("does not expose restart execution to anonymous or ordinary signed-in callers", () => {
    const result = query(`SELECT has_function_privilege('anon','public.hitster_restart_game(uuid,integer)','EXECUTE') || ':' || has_function_privilege('authenticated','public.hitster_restart_game(uuid,integer)','EXECUTE') || ':' || has_function_privilege('service_role','public.hitster_restart_game(uuid,integer)','EXECUTE');`);
    expect(result).toContain("false:false:true");
  });
});