// @ts-nocheck
// Ported from the original Konektum shared helpers.
const Deno = { env: { get: (k: string) => (globalThis as any).process?.env?.[k] } };

// Shared helpers for the «Rompe-hielos» games (timeline, emoji story, …).
import { createClient } from "@/lib/kon-fn/client.server";
import { resolveParticipantRounds } from "./participantRounds";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const COUNTDOWN_SECONDS = 5;

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deterministic shuffle so every client sees the same order for the same seed. */
export function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return Math.abs(h % 100000) / 100000;
  };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function anonymizeName(fullName: string): string {
  const parts = String(fullName || "").trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export function rewardsForRound(correct: number, total: number): string[] {
  const rewards: string[] = [];
  if (total <= 0 || correct <= 0) return rewards;
  rewards.push("super_like");
  if (correct >= 3) rewards.push("repeat");
  if (correct >= total) rewards.push("crush");
  return rewards;
}

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

export async function entryToken(
  eventId: string,
  round: number,
  gameCode: string,
  participantId: string,
): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${eventId}|${round}|${gameCode}|${participantId}`),
  );
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

export interface GameSettings {
  enabled: boolean;
  gameEnabled: boolean;
  settings: Record<string, unknown>;
}

export function gameSettings(socialGame: unknown, gameCode: string): GameSettings {
  const cfg = (socialGame || {}) as any;
  const games = cfg?.games || {};
  const own = games?.[gameCode] || {};
  return {
    enabled: !!cfg?.enabled,
    gameEnabled: !!cfg?.enabled && !!own?.enabled,
    settings: own,
  };
}

export interface IcebreakerContext {
  supabase: any;
  event: any;
  participant: any;
  round: number;
  table: number;
  tablemateIds: string[];
  memberIds: string[];
  session: any;
  reloadSession: () => Promise<any>;
  mates: Map<string, string>;
}

/** Validates the request, resolves the participant's current seat and the table session. */
export async function loadContext(
  body: any,
  gameCode: string,
): Promise<{ error: Response } | { ctx: IcebreakerContext; settings: GameSettings }> {
  const { eventId, verificationCode } = body || {};
  if (!eventId || !UUID_RE.test(String(eventId)) || !/^\d{6}$/.test(String(verificationCode || ""))) {
    return { error: json({ error: "Datos inválidos" }, 400) };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, status, language, tables, current_round, rounds, completed_rounds, preliminary_round, social_game, draft_round, organizer_id",
    )
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return { error: json({ error: "Evento no encontrado" }, 404) };

  const settings = gameSettings((event as any).social_game, gameCode);

  const { data: participant } = await supabase
    .from("participants")
    .select("id, name, email, is_anonymous, wrapped_profile_id, game_answers")
    .eq("event_id", eventId)
    .eq("verification_code", verificationCode)
    .maybeSingle();
  if (!participant) return { error: json({ error: "Código de verificación incorrecto" }, 400) };
  if ((participant as any).is_anonymous) return { error: json({ enabled: false, gameEnabled: false }) };
  if (!settings.gameEnabled) {
    return { error: json({ enabled: settings.enabled, gameEnabled: false }) };
  }

  const { rounds, currentRound } = resolveParticipantRounds(event, participant.id);
  const seat = [...rounds].reverse().find((r) => r.round <= Math.max(currentRound, 0)) || rounds[rounds.length - 1];
  if (!seat) return { error: json({ enabled: true, gameEnabled: true, seat: null }) };

  const loadSession = async () => {
    const { data } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("event_id", eventId)
      .eq("round", seat.round)
      .eq("table_number", seat.table)
      .eq("game_code", gameCode)
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
        game_code: gameCode,
        status: "lobby",
        payload: { entries: {} },
      })
      .select("*")
      .maybeSingle();
    session = created || (await loadSession());
  }

  const { data: mateRows } = seat.tablemateIds.length
    ? await supabase.from("participants").select("id, name").in("id", seat.tablemateIds)
    : { data: [] as any[] };
  const mates = new Map<string, string>();
  for (const m of (mateRows || []) as any[]) mates.set(m.id, m.name);

  return {
    settings,
    ctx: {
      supabase,
      event,
      participant,
      round: seat.round,
      table: seat.table,
      tablemateIds: seat.tablemateIds,
      memberIds: [participant.id, ...seat.tablemateIds],
      session,
      reloadSession: loadSession,
      mates,
    },
  };
}

/** Advances a lobby session to countdown/playing based on ready participants. */
export async function applyReady(ctx: IcebreakerContext, hasEntry: (id: string) => boolean) {
  const readyIds: string[] = Array.isArray(ctx.session?.ready_participant_ids)
    ? ctx.session.ready_participant_ids
    : [];
  const next = readyIds.includes(ctx.participant.id) ? readyIds : [...readyIds, ctx.participant.id];
  const withEntry = ctx.memberIds.filter(hasEntry);
  const everyoneReady = withEntry.length >= 2 && withEntry.every((id) => next.includes(id));
  const update: Record<string, unknown> = { ready_participant_ids: next };
  if (everyoneReady && ctx.session.status === "lobby") {
    update.status = "countdown";
    update.started_at = new Date().toISOString();
  }
  await ctx.supabase.from("game_sessions").update(update).eq("id", ctx.session.id);
}

/** Resolves the effective status, promoting countdown → playing when the timer elapsed. */
export async function effectiveStatus(ctx: IcebreakerContext, session: any): Promise<string> {
  let status: string = session?.status || "lobby";
  if (status === "countdown" && session?.started_at) {
    const elapsed = (Date.now() - new Date(session.started_at).getTime()) / 1000;
    if (elapsed >= COUNTDOWN_SECONDS) {
      status = "playing";
      if (session.status !== "playing") {
        await ctx.supabase.from("game_sessions").update({ status: "playing" }).eq("id", session.id);
      }
    }
  }
  return status;
}

/** Stores the vote and recomputes this round's rewards for the voter. */
export async function registerVote(
  ctx: IcebreakerContext,
  gameCode: string,
  opts: { questionId: string; targetId: string; guessedId: string; isCorrect: boolean; total: number },
): Promise<string | null> {
  const { error: voteError } = await ctx.supabase.from("game_votes").insert({
    event_id: ctx.event.id,
    round: ctx.round,
    game_code: gameCode,
    voter_participant_id: ctx.participant.id,
    question_id: opts.questionId,
    target_participant_id: opts.targetId,
    guessed_participant_id: opts.guessedId,
    is_correct: opts.isCorrect,
  });
  if (voteError && !String(voteError.message || "").includes("duplicate")) {
    console.error(`[${gameCode}] vote error`, voteError);
    return "No se pudo guardar el voto";
  }

  const { data: roundVotes } = await ctx.supabase
    .from("game_votes")
    .select("is_correct")
    .eq("event_id", ctx.event.id)
    .eq("round", ctx.round)
    .eq("game_code", gameCode)
    .eq("voter_participant_id", ctx.participant.id);
  const correct = (roundVotes || []).filter((v: any) => v.is_correct).length;
  const earned = rewardsForRound(correct, opts.total);
  if (earned.length > 0) {
    await ctx.supabase.from("game_rewards").upsert(
      earned.map((type) => ({
        event_id: ctx.event.id,
        participant_id: ctx.participant.id,
        round: ctx.round,
        game_code: gameCode,
        reward_type: type,
      })),
      { onConflict: "event_id,participant_id,round,reward_type,game_code", ignoreDuplicates: true },
    );
  }
  return null;
}

/** Profile signals used to personalise prompts and milestones. */
export async function profileSignals(
  supabase: any,
  participant: any,
): Promise<{ hobbies: string[]; traits: string[] }> {
  const traits: string[] = [];
  const hobbies: string[] = [];
  for (const v of Object.values(participant.game_answers || {})) {
    if (typeof v === "string" && v.trim()) traits.push(v.trim());
  }
  if (participant.wrapped_profile_id) {
    const { data } = await supabase
      .from("wrapped_profiles")
      .select("answers, hobbies_ranked")
      .eq("id", participant.wrapped_profile_id)
      .maybeSingle();
    if (data) {
      for (const h of data.hobbies_ranked || []) if (typeof h === "string" && h.trim()) hobbies.push(h.trim());
      for (const v of Object.values(data.answers || {})) {
        if (typeof v === "string" && v.trim()) traits.push(v.trim());
        else if (Array.isArray(v)) v.forEach((x) => typeof x === "string" && x.trim() && traits.push(x.trim()));
      }
    }
  }
  return { hobbies, traits };
}

export async function fetchVotesAndRewards(ctx: IcebreakerContext, gameCode: string) {
  const [{ data: votes }, { data: rewards }] = await Promise.all([
    ctx.supabase
      .from("game_votes")
      .select("round, question_id, target_participant_id, guessed_participant_id, is_correct")
      .eq("event_id", ctx.event.id)
      .eq("game_code", gameCode)
      .eq("voter_participant_id", ctx.participant.id),
    ctx.supabase
      .from("game_rewards")
      .select("round, reward_type")
      .eq("event_id", ctx.event.id)
      .eq("game_code", gameCode)
      .eq("participant_id", ctx.participant.id),
  ]);
  return {
    votes: (votes || []) as any[],
    rewards: ((rewards || []) as any[]).map((r) => ({ round: r.round, type: r.reward_type })),
  };
}
