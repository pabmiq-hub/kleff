// @ts-nocheck
// Ported from the original Konektum edge function `icebreakers`.
let __handler: any = null;
const serve = (h: any) => { __handler = h; };
const Deno = {
  env: { get: (k: string) => (globalThis as any).process?.env?.[k] },
  serve: (h: any) => { __handler = h; },
};

import { createClient } from "@/lib/kon-fn/client.server";
import { resolveParticipantRounds } from "@/lib/kon-fn/_shared/participantRounds";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GAME = "build_yourself";
const COUNTDOWN_SECONDS = 5;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

let cachedKey: CryptoKey | null = null;
async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "fallback-social-game-key";
  cachedKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`icebreakers::${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return cachedKey;
}

async function avatarToken(eventId: string, round: number, participantId: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${eventId}|${round}|${GAME}|${participantId}`),
  );
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

function anonymizeName(fullName: string): string {
  const parts = String(fullName || "").trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rewardsForRound(correct: number, total: number): string[] {
  const rewards: string[] = [];
  if (total <= 0 || correct <= 0) return rewards;
  rewards.push("super_like");
  if (correct >= 3) rewards.push("repeat");
  if (correct >= total) rewards.push("crush");
  return rewards;
}

function gamesConfig(cfg: any) {
  const enabled = !!cfg?.enabled;
  const games = cfg?.games;
  return {
    enabled,
    who_is_who: enabled && (games ? !!games?.who_is_who?.enabled : true),
    build_yourself: enabled && !!games?.build_yourself?.enabled,
    build: {
      build_seconds: Number(games?.build_yourself?.build_seconds) > 0
        ? Math.round(Number(games.build_yourself.build_seconds))
        : 90,
      allow_drawing: games?.build_yourself?.allow_drawing !== false,
      prefill: games?.build_yourself?.prefill !== false,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { eventId, verificationCode, action } = body || {};

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!eventId || !uuidRegex.test(String(eventId)) || !/^\d{6}$/.test(String(verificationCode || ""))) {
      return json({ error: "Datos inválidos" }, 400);
    }
    const allowed = ["state", "save_avatar", "ready", "guess"];
    if (!allowed.includes(String(action))) return json({ error: "Acción inválida" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: event } = await supabase
      .from("events")
      .select("id, status, language, tables, current_round, rounds, completed_rounds, preliminary_round, social_game, draft_round, organizer_id")
      .eq("id", eventId)
      .maybeSingle();

    if (!event) return json({ error: "Evento no encontrado" }, 404);

    const cfg = gamesConfig((event as any).social_game);

    const { data: participant } = await supabase
      .from("participants")
      .select("id, name, email, is_anonymous, wrapped_profile_id, game_answers")
      .eq("event_id", eventId)
      .eq("verification_code", verificationCode)
      .maybeSingle();

    if (!participant) return json({ error: "Código de verificación incorrecto" }, 400);
    if ((participant as any).is_anonymous) return json({ enabled: false, games: [] });

    if (!cfg.enabled || !cfg.build_yourself) {
      return json({ enabled: cfg.enabled, whoIsWho: cfg.who_is_who, buildYourself: false });
    }

    const { rounds, currentRound } = resolveParticipantRounds(event, participant.id);
    // Play the round the participant is actually sitting at right now.
    const seat = [...rounds].reverse().find((r) => r.round <= Math.max(currentRound, 0)) || rounds[rounds.length - 1];
    if (!seat) {
      return json({ enabled: true, buildYourself: true, seat: null, config: cfg.build });
    }

    const round = seat.round;
    const table = seat.table;
    const memberIds = [participant.id, ...seat.tablemateIds];

    const loadSession = async () => {
      const { data } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("event_id", eventId)
        .eq("round", round)
        .eq("table_number", table)
        .eq("game_code", GAME)
        .maybeSingle();
      return data as any | null;
    };

    let session = await loadSession();

    if (!session) {
      const { data: created } = await supabase
        .from("game_sessions")
        .insert({
          event_id: eventId,
          round,
          table_number: table,
          game_code: GAME,
          status: "lobby",
          payload: { avatars: {} },
        })
        .select("*")
        .maybeSingle();
      session = created || (await loadSession());
    }

    const payload = (session?.payload || {}) as any;
    const avatars = (payload.avatars || {}) as Record<string, { layers?: any; drawing?: string | null }>;

    // ---- actions that mutate state -------------------------------------
    if (action === "save_avatar") {
      const layers = body.layers && typeof body.layers === "object" ? body.layers : {};
      const drawing = typeof body.drawing === "string" && body.drawing.startsWith("data:image/")
        ? body.drawing.slice(0, 400_000)
        : null;
      const cleanLayers: Record<string, string> = {};
      for (const [k, v] of Object.entries(layers)) {
        if (typeof k === "string" && typeof v === "string" && k.length < 40 && v.length < 40) {
          cleanLayers[k] = v;
        }
      }
      avatars[participant.id] = { layers: cleanLayers, drawing };
      await supabase
        .from("game_sessions")
        .update({ payload: { ...payload, avatars } })
        .eq("id", session.id);

      const email = String((participant as any).email || "").trim().toLowerCase();
      const organizerId = (event as any).organizer_id;
      if (email && organizerId) {
        await supabase
          .from("participant_avatars")
          .upsert(
            { organizer_id: organizerId, email, layers: cleanLayers, drawing, updated_at: new Date().toISOString() },
            { onConflict: "organizer_id,email" },
          );
      }
      session = await loadSession();
    }

    if (action === "ready") {
      if (!avatars[participant.id]) return json({ error: "Primero termina tu avatar" }, 400);
      const readyIds: string[] = Array.isArray(session.ready_participant_ids) ? session.ready_participant_ids : [];
      const nextReady = readyIds.includes(participant.id) ? readyIds : [...readyIds, participant.id];
      const withAvatar = memberIds.filter((id) => avatars[id]);
      const everyoneReady = withAvatar.length >= 2 && withAvatar.every((id) => nextReady.includes(id));
      const update: Record<string, unknown> = { ready_participant_ids: nextReady };
      if (everyoneReady && session.status === "lobby") {
        update.status = "countdown";
        update.started_at = new Date().toISOString();
      }
      await supabase.from("game_sessions").update(update).eq("id", session.id);
      session = await loadSession();
    }

    if (action === "guess") {
      const token = String(body.token || "");
      const guessedId = String(body.guessedParticipantId || "");
      if (!uuidRegex.test(guessedId) || !memberIds.includes(guessedId)) {
        return json({ error: "Selección inválida" }, 400);
      }
      let ownerId: string | null = null;
      for (const id of seat.tablemateIds) {
        if ((await avatarToken(eventId, round, id)) === token) {
          ownerId = id;
          break;
        }
      }
      if (!ownerId) return json({ error: "Avatar no encontrado" }, 400);

      const isCorrect = ownerId === guessedId;
      const { error: voteError } = await supabase.from("game_votes").insert({
        event_id: eventId,
        round,
        game_code: GAME,
        voter_participant_id: participant.id,
        question_id: "avatar",
        target_participant_id: ownerId,
        guessed_participant_id: guessedId,
        is_correct: isCorrect,
      });
      if (voteError && !String(voteError.message || "").includes("duplicate")) {
        console.error("[icebreakers] vote error", voteError);
        return json({ error: "No se pudo guardar el voto" }, 400);
      }

      // Recompute rewards for this round/game.
      const { data: roundVotes } = await supabase
        .from("game_votes")
        .select("is_correct")
        .eq("event_id", eventId)
        .eq("round", round)
        .eq("game_code", GAME)
        .eq("voter_participant_id", participant.id);
      const correct = (roundVotes || []).filter((v: any) => v.is_correct).length;
      const total = seat.tablemateIds.filter((id) => avatars[id]).length;
      const earned = rewardsForRound(correct, total);
      if (earned.length > 0) {
        await supabase.from("game_rewards").upsert(
          earned.map((type) => ({
            event_id: eventId,
            participant_id: participant.id,
            round,
            game_code: GAME,
            reward_type: type,
          })),
          { onConflict: "event_id,participant_id,round,reward_type,game_code", ignoreDuplicates: true },
        );
      }
      session = await loadSession();
    }

    // ---- state ---------------------------------------------------------
    const freshPayload = (session?.payload || {}) as any;
    const freshAvatars = (freshPayload.avatars || {}) as Record<string, any>;
    const readyIds: string[] = Array.isArray(session?.ready_participant_ids) ? session.ready_participant_ids : [];

    let status: string = session?.status || "lobby";
    if (status === "countdown" && session?.started_at) {
      const elapsed = (Date.now() - new Date(session.started_at).getTime()) / 1000;
      if (elapsed >= COUNTDOWN_SECONDS) {
        status = "playing";
        if (session.status !== "playing") {
          await supabase.from("game_sessions").update({ status: "playing" }).eq("id", session.id);
        }
      }
    }

    const { data: mateRows } = seat.tablemateIds.length
      ? await supabase.from("participants").select("id, name").in("id", seat.tablemateIds)
      : { data: [] as any[] };
    const mates = new Map<string, string>();
    for (const m of (mateRows || []) as any[]) mates.set(m.id, m.name);

    const [{ data: votes }, { data: rewards }] = await Promise.all([
      supabase
        .from("game_votes")
        .select("round, target_participant_id, guessed_participant_id, is_correct")
        .eq("event_id", eventId)
        .eq("game_code", GAME)
        .eq("voter_participant_id", participant.id),
      supabase
        .from("game_rewards")
        .select("round, reward_type")
        .eq("event_id", eventId)
        .eq("game_code", GAME)
        .eq("participant_id", participant.id),
    ]);

    const myVotes = (votes || []).filter((v: any) => v.round === round);

    const entries: any[] = [];
    if (status === "playing") {
      for (const id of seat.tablemateIds) {
        if (!freshAvatars[id]) continue;
        const vote = myVotes.find((v: any) => v.target_participant_id === id);
        entries.push({
          token: await avatarToken(eventId, round, id),
          layers: freshAvatars[id].layers || {},
          drawing: freshAvatars[id].drawing || null,
          vote: vote
            ? { guessedId: vote.guessed_participant_id, correct: !!vote.is_correct, ownerId: id, ownerName: anonymizeName(mates.get(id) || "") }
            : null,
        });
      }
    }

    return json({
      enabled: true,
      whoIsWho: cfg.who_is_who,
      buildYourself: true,
      config: cfg.build,
      language: (event as any).language || "es",
      participantId: participant.id,
      seat: { round, table },
      status,
      startedAt: session?.started_at || null,
      countdownSeconds: COUNTDOWN_SECONDS,
      myAvatar: freshAvatars[participant.id] || null,
      prefillHints: cfg.build.prefill ? await prefillHints(supabase, participant) : [],
      tablemates: seat.tablemateIds.map((id) => ({
        id,
        name: anonymizeName(mates.get(id) || ""),
        hasAvatar: !!freshAvatars[id],
        ready: readyIds.includes(id),
      })),
      iAmReady: readyIds.includes(participant.id),
      entries: shuffle(entries),
      rewards: (rewards || []).map((r: any) => ({ round: r.round, type: r.reward_type })),
    });
  } catch (error) {
    console.error("[icebreakers] error", error);
    return json({ error: "Error interno del servidor" }, 500);
  }
});

async function prefillHints(supabase: any, participant: any): Promise<string[]> {
  const hints: string[] = [];
  const answers = participant.game_answers || {};
  for (const v of Object.values(answers)) if (typeof v === "string") hints.push(v);
  if (participant.wrapped_profile_id) {
    const { data } = await supabase
      .from("wrapped_profiles")
      .select("answers, hobbies_ranked")
      .eq("id", participant.wrapped_profile_id)
      .maybeSingle();
    if (data) {
      for (const h of (data.hobbies_ranked || [])) if (typeof h === "string") hints.push(h);
      for (const v of Object.values(data.answers || {})) {
        if (typeof v === "string") hints.push(v);
        else if (Array.isArray(v)) v.forEach((x) => typeof x === "string" && hints.push(x));
      }
    }
  }
  return hints;
}


export default async function handler(req: Request): Promise<Response> {
  if (!__handler) throw new Error("handler not registered");
  return await __handler(req);
}
