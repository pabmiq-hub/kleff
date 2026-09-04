// @ts-nocheck
// Ported from the original Konektum edge function `icebreaker-select`.
let __handler: any = null;
const serve = (h: any) => { __handler = h; };
const Deno = {
  env: { get: (k: string) => (globalThis as any).process?.env?.[k] },
  serve: (h: any) => { __handler = h; },
};

// Table-level game selection for the «Juegos» (icebreakers) section.
// The first participant of a table+round who picks a game deploys it to everyone else.
import { createClient } from "@/lib/kon-fn/client.server";
import { corsHeaders, json, UUID_RE } from "@/lib/kon-fn/_shared/icebreakers";
import { resolveParticipantRounds } from "@/lib/kon-fn/_shared/participantRounds";

const SELECTION_CODE = "table_choice";
const VALID_GAMES = ["who_is_who", "build_yourself", "timeline", "emoji_story"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { eventId, verificationCode, action, gameCode } = body || {};

    if (!eventId || !UUID_RE.test(String(eventId)) || !/^\d{6}$/.test(String(verificationCode || ""))) {
      return json({ error: "Datos inválidos" }, 400);
    }
    if (!["state", "select", "reset"].includes(String(action))) {
      return json({ error: "Acción inválida" }, 400);
    }
    if (action === "select" && !VALID_GAMES.includes(String(gameCode))) {
      return json({ error: "Juego inválido" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: event } = await supabase
      .from("events")
      .select("id, tables, current_round, rounds, completed_rounds, preliminary_round, social_game, draft_round")
      .eq("id", eventId)
      .maybeSingle();
    if (!event) return json({ error: "Evento no encontrado" }, 404);

    const { data: participant } = await supabase
      .from("participants")
      .select("id, name, is_anonymous")
      .eq("event_id", eventId)
      .eq("verification_code", verificationCode)
      .maybeSingle();
    if (!participant) return json({ error: "Código de verificación incorrecto" }, 400);
    if ((participant as any).is_anonymous) return json({ activeGame: null, seat: null });

    const { rounds, currentRound } = resolveParticipantRounds(event as any, participant.id);
    const seat = [...rounds].reverse().find((r) => r.round <= Math.max(currentRound, 0)) ||
      rounds[rounds.length - 1];
    if (!seat) return json({ activeGame: null, seat: null });

    const loadSession = async () => {
      const { data } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("event_id", eventId)
        .eq("round", seat.round)
        .eq("table_number", seat.table)
        .eq("game_code", SELECTION_CODE)
        .maybeSingle();
      return data as any | null;
    };

    let session = await loadSession();
    if (!session) {
      const { data: created } = await supabase
        .from("game_sessions")
        .insert({
          event_id: eventId,
          round: seat.round,
          table_number: seat.table,
          game_code: SELECTION_CODE,
          status: "lobby",
          payload: {},
        })
        .select("*")
        .maybeSingle();
      session = created || (await loadSession());
    }

    const payload = (session?.payload || {}) as any;

    if (action === "select" && !payload.game) {
      await supabase
        .from("game_sessions")
        .update({
          payload: {
            game: String(gameCode),
            chosenBy: participant.id,
            chosenByName: participant.name,
            chosenAt: new Date().toISOString(),
          },
        })
        .eq("id", session.id);
      session = await loadSession();
    }

    if (action === "reset" && payload.game) {
      await supabase.from("game_sessions").update({ payload: {} }).eq("id", session.id);
      session = await loadSession();
    }

    const finalPayload = (session?.payload || {}) as any;
    return json({
      seat: { round: seat.round, table: seat.table },
      activeGame: finalPayload.game || null,
      chosenByMe: finalPayload.chosenBy === participant.id,
      chosenByName: finalPayload.chosenByName || null,
    });
  } catch (err) {
    console.error("[icebreaker-select] error", err);
    return json({ error: "Error interno" }, 500);
  }
});


export default async function handler(req: Request): Promise<Response> {
  if (!__handler) throw new Error("handler not registered");
  return await __handler(req);
}
