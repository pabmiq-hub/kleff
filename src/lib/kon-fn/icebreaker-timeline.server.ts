// @ts-nocheck
// Ported from the original Konektum edge function `icebreaker-timeline`.
let __handler: any = null;
const serve = (h: any) => { __handler = h; };
const Deno = {
  env: { get: (k: string) => (globalThis as any).process?.env?.[k] },
  serve: (h: any) => { __handler = h; },
};

// «Timeline» icebreaker: each participant orders their own milestones and the
// table takes turns guessing the protagonist's real chronological order.
import {
} from "@/lib/kon-fn/_shared/icebreakers";

const GAME = "timeline";

interface Milestone {
  id: string;
  label_es: string;
  label_en: string;
}

const GENERIC_MOMENTS: Milestone[] = [
  { id: "m_trip", label_es: "El viaje más loco de su vida", label_en: "The wildest trip of their life" },
  { id: "m_move", label_es: "La primera vez que vivió fuera de casa", label_en: "First time living away from home" },
  { id: "m_gig", label_es: "El mejor concierto o evento al que ha ido", label_en: "The best gig or event they attended" },
  { id: "m_self", label_es: "Aprender algo importante por su cuenta", label_en: "Learning something big on their own" },
  { id: "m_friend", label_es: "Conocer a su mejor amistad actual", label_en: "Meeting their current best friend" },
];

function buildMilestones(participantId: string, hobbies: string[], traits: string[]): Milestone[] {
  const items: Milestone[] = [];
  hobbies.slice(0, 3).forEach((h, i) => {
    items.push({
      id: `h${i}`,
      label_es: `Cuando empezó con «${h}»`,
      label_en: `When they started with “${h}”`,
    });
  });
  if (items.length < 3) {
    traits.slice(0, 3 - items.length).forEach((tr, i) => {
      items.push({
        id: `t${i}`,
        label_es: `El momento en el que «${tr}» se volvió parte de su vida`,
        label_en: `The moment “${tr}” became part of their life`,
      });
    });
  }
  const extras = seededShuffle(GENERIC_MOMENTS, participantId);
  for (const m of extras) {
    if (items.length >= 5) break;
    items.push(m);
  }
  return items.slice(0, 5);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const action = String(body?.action || "");
    if (!["state", "save_order", "ready", "guess", "next_turn"].includes(action)) {
      return json({ error: "Acción inválida" }, 400);
    }

    const loaded = await loadContext(body, GAME);
    if ("error" in loaded) return loaded.error;
    const { ctx, settings } = loaded;

    const config = {
      create_seconds: Number(settings.settings.create_seconds) > 0 ? Number(settings.settings.create_seconds) : 60,
      guess_seconds: Number(settings.settings.guess_seconds) > 0 ? Number(settings.settings.guess_seconds) : 60,
    };

    const payload = (ctx.session?.payload || {}) as any;
    const entries = (payload.entries || {}) as Record<string, { items: Milestone[]; order: string[] }>;
    const signals = await profileSignals(ctx.supabase, ctx.participant);
    const myItems: Milestone[] = entries[ctx.participant.id]?.items?.length
      ? entries[ctx.participant.id].items
      : buildMilestones(ctx.participant.id, signals.hobbies, signals.traits);

    const sortedMembers = [...ctx.memberIds].sort();

    if (action === "save_order") {
      const order = Array.isArray(body.order) ? body.order.map((x: unknown) => String(x)) : [];
      const validIds = myItems.map((i) => i.id);
      if (order.length !== validIds.length || order.some((id) => !validIds.includes(id)) ||
        new Set(order).size !== order.length) {
        return json({ error: "Orden inválido" }, 400);
      }
      entries[ctx.participant.id] = { items: myItems, order };
      await ctx.supabase
        .from("game_sessions")
        .update({ payload: { ...payload, entries } })
        .eq("id", ctx.session.id);
      ctx.session = await ctx.reloadSession();
    }

    if (action === "ready") {
      if (!entries[ctx.participant.id]) return json({ error: "Primero ordena tu timeline" }, 400);
      await applyReady(ctx, (id) => !!entries[id]);
      ctx.session = await ctx.reloadSession();
    }

    const freshPayload = (ctx.session?.payload || {}) as any;
    const freshEntries = (freshPayload.entries || {}) as Record<string, { items: Milestone[]; order: string[] }>;
    const turn = Number(freshPayload.turn) > 0 ? Math.floor(Number(freshPayload.turn)) : 0;
    const playable = sortedMembers.filter((id) => freshEntries[id]);
    const protagonistId = playable.length > 0 ? playable[turn % playable.length] : null;

    if (action === "guess" && protagonistId) {
      const token = String(body.token || "");
      const expected = await entryToken(ctx.event.id, ctx.round, GAME, protagonistId);
      if (token !== expected || protagonistId === ctx.participant.id) {
        return json({ error: "Turno inválido" }, 400);
      }
      const guessOrder = Array.isArray(body.order) ? body.order.map((x: unknown) => String(x)) : [];
      const realOrder = freshEntries[protagonistId]?.order || [];
      if (guessOrder.length !== realOrder.length || new Set(guessOrder).size !== guessOrder.length) {
        return json({ error: "Orden inválido" }, 400);
      }
      const isCorrect = guessOrder.every((id, i) => id === realOrder[i]);
      const err = await registerVote(ctx, GAME, {
        questionId: `timeline:${protagonistId}`,
        targetId: protagonistId,
        guessedId: isCorrect ? protagonistId : ctx.participant.id,
        isCorrect,
        total: Math.max(1, playable.length - 1),
      });
      if (err) return json({ error: err }, 400);
      // Remember the submitted order so the participant can see their attempt.
      const guesses = (freshPayload.guesses || {}) as Record<string, Record<string, string[]>>;
      guesses[protagonistId] = { ...(guesses[protagonistId] || {}), [ctx.participant.id]: guessOrder };
      await ctx.supabase
        .from("game_sessions")
        .update({ payload: { ...freshPayload, guesses } })
        .eq("id", ctx.session.id);
      ctx.session = await ctx.reloadSession();
    }

    if (action === "next_turn") {
      await ctx.supabase
        .from("game_sessions")
        .update({ payload: { ...(ctx.session?.payload || {}), turn: turn + 1 } })
        .eq("id", ctx.session.id);
      ctx.session = await ctx.reloadSession();
    }

    // ---- state ---------------------------------------------------------
    const statePayload = (ctx.session?.payload || {}) as any;
    const stateEntries = (statePayload.entries || {}) as Record<string, { items: Milestone[]; order: string[] }>;
    const stateGuesses = (statePayload.guesses || {}) as Record<string, Record<string, string[]>>;
    const stateTurn = Number(statePayload.turn) > 0 ? Math.floor(Number(statePayload.turn)) : 0;
    const statePlayable = sortedMembers.filter((id) => stateEntries[id]);
    const currentProtagonist = statePlayable.length > 0 ? statePlayable[stateTurn % statePlayable.length] : null;

    const readyIds: string[] = Array.isArray(ctx.session?.ready_participant_ids)
      ? ctx.session.ready_participant_ids
      : [];
    const status = await effectiveStatus(ctx, ctx.session);
    const { votes, rewards } = await fetchVotesAndRewards(ctx, GAME);
    const roundVotes = votes.filter((v) => v.round === ctx.round);

    let target: unknown = null;
    if (status === "playing" && currentProtagonist) {
      const isMe = currentProtagonist === ctx.participant.id;
      const entry = stateEntries[currentProtagonist];
      const myVote = roundVotes.find((v) => v.question_id === `timeline:${currentProtagonist}`);
      const others = statePlayable.filter((id) => id !== currentProtagonist);
      const votesCount = Object.keys(stateGuesses[currentProtagonist] || {}).length;
      target = {
        token: await entryToken(ctx.event.id, ctx.round, GAME, currentProtagonist),
        isMe,
        name: isMe ? null : anonymizeName(ctx.mates.get(currentProtagonist) || ""),
        items: seededShuffle(entry?.items || [], `${currentProtagonist}:${ctx.round}`),
        myGuess: stateGuesses[currentProtagonist]?.[ctx.participant.id] || null,
        answered: !!myVote,
        correct: myVote ? !!myVote.is_correct : null,
        // The real order is only revealed once this participant has voted (or is the owner).
        revealedOrder: isMe || myVote ? entry?.order || [] : null,
        votesCount,
        totalVoters: others.length,
        turnComplete: others.length > 0 && votesCount >= others.length,
      };
    }

    return json({
      enabled: true,
      gameEnabled: true,
      config,
      language: (ctx.event as any).language || "es",
      participantId: ctx.participant.id,
      seat: { round: ctx.round, table: ctx.table },
      status,
      startedAt: ctx.session?.started_at || null,
      countdownSeconds: 5,
      myItems: stateEntries[ctx.participant.id]?.items || myItems,
      myOrder: stateEntries[ctx.participant.id]?.order || null,
      tablemates: ctx.tablemateIds.map((id) => ({
        id,
        name: anonymizeName(ctx.mates.get(id) || ""),
        hasEntry: !!stateEntries[id],
        ready: readyIds.includes(id),
      })),
      iAmReady: readyIds.includes(ctx.participant.id),
      turn: stateTurn,
      totalTurns: statePlayable.length,
      target,
      rewards,
    });
  } catch (error) {
    console.error("[icebreaker-timeline] error", error);
    return json({ error: "Error interno del servidor" }, 500);
  }
});


export default async function handler(req: Request): Promise<Response> {
  if (!__handler) throw new Error("handler not registered");
  return await __handler(req);
}
