// @ts-nocheck
// Ported from the original Konektum edge function `icebreaker-emoji`.
let __handler: any = null;
const serve = (h: any) => { __handler = h; };
const Deno = {
  env: { get: (k: string) => (globalThis as any).process?.env?.[k] },
  serve: (h: any) => { __handler = h; },
};

// «Emoji Story» icebreaker: every participant answers a personalised prompt with
// 4-6 emojis; the table then guesses who wrote each sequence and the real story
// is revealed after voting.
import {
} from "@/lib/kon-fn/_shared/icebreakers";

const GAME = "emoji_story";

const PROMPTS: { es: string; en: string; needsTopic?: boolean }[] = [
  { es: "Cuéntanos tu mejor plan con «{topic}» usando solo emojis", en: "Tell us your best “{topic}” plan using emojis only", needsTopic: true },
  { es: "Resume tu último fin de semana ideal con emojis", en: "Sum up your ideal last weekend with emojis" },
  { es: "Cuenta con emojis la historia de cómo empezaste con «{topic}»", en: "Use emojis to tell how you got into “{topic}”", needsTopic: true },
  { es: "Describe tu viaje más memorable solo con emojis", en: "Describe your most memorable trip with emojis only" },
  { es: "Cuenta con emojis cómo es un día perfecto para ti", en: "Use emojis to tell what a perfect day looks like for you" },
  { es: "Cuéntanos una anécdota divertida con «{topic}» en emojis", en: "Tell us a funny story about “{topic}” in emojis", needsTopic: true },
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function buildPrompt(participantId: string, hobbies: string[], traits: string[]): { es: string; en: string } {
  const topics = [...hobbies, ...traits].filter((t) => t.length > 1 && t.length < 40);
  const h = hash(participantId);
  const candidates = topics.length > 0 ? PROMPTS : PROMPTS.filter((p) => !p.needsTopic);
  const tpl = candidates[h % candidates.length];
  const topic = topics.length > 0 ? topics[h % topics.length] : "";
  return {
    es: tpl.es.replace("{topic}", topic),
    en: tpl.en.replace("{topic}", topic),
  };
}

const EMOJI_RE = /\p{Extended_Pictographic}/u;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const action = String(body?.action || "");
    if (!["state", "save_story", "ready", "guess"].includes(action)) {
      return json({ error: "Acción inválida" }, 400);
    }

    const loaded = await loadContext(body, GAME);
    if ("error" in loaded) return loaded.error;
    const { ctx, settings } = loaded;

    const config = {
      compose_seconds: Number(settings.settings.compose_seconds) > 0 ? Number(settings.settings.compose_seconds) : 60,
      guess_seconds: Number(settings.settings.guess_seconds) > 0 ? Number(settings.settings.guess_seconds) : 45,
    };

    const signals = await profileSignals(ctx.supabase, ctx.participant);
    const myPrompt = buildPrompt(ctx.participant.id, signals.hobbies, signals.traits);

    const payload = (ctx.session?.payload || {}) as any;
    const entries = (payload.entries || {}) as Record<string, { emojis: string[]; story: string; prompt: { es: string; en: string } }>;

    if (action === "save_story") {
      const emojis = Array.isArray(body.emojis)
        ? body.emojis.map((e: unknown) => String(e)).filter((e: string) => e.length <= 8 && EMOJI_RE.test(e))
        : [];
      if (emojis.length < 4 || emojis.length > 6) {
        return json({ error: "Elige entre 4 y 6 emojis" }, 400);
      }
      const story = String(body.story || "").slice(0, 300);
      entries[ctx.participant.id] = { emojis, story, prompt: myPrompt };
      await ctx.supabase
        .from("game_sessions")
        .update({ payload: { ...payload, entries } })
        .eq("id", ctx.session.id);
      ctx.session = await ctx.reloadSession();
    }

    if (action === "ready") {
      if (!entries[ctx.participant.id]) return json({ error: "Primero envía tu historia" }, 400);
      await applyReady(ctx, (id) => !!entries[id]);
      ctx.session = await ctx.reloadSession();
    }

    if (action === "guess") {
      const freshEntries = ((ctx.session?.payload || {}).entries || {}) as Record<string, any>;
      const token = String(body.token || "");
      const guessedId = String(body.guessedParticipantId || "");
      if (!UUID_RE.test(guessedId) || !ctx.memberIds.includes(guessedId)) {
        return json({ error: "Selección inválida" }, 400);
      }
      let ownerId: string | null = null;
      for (const id of ctx.tablemateIds) {
        if ((await entryToken(ctx.event.id, ctx.round, GAME, id)) === token) {
          ownerId = id;
          break;
        }
      }
      if (!ownerId) return json({ error: "Historia no encontrada" }, 400);
      const total = ctx.tablemateIds.filter((id) => freshEntries[id]).length;
      const err = await registerVote(ctx, GAME, {
        questionId: `emoji:${ownerId}`,
        targetId: ownerId,
        guessedId,
        isCorrect: ownerId === guessedId,
        total,
      });
      if (err) return json({ error: err }, 400);
      ctx.session = await ctx.reloadSession();
    }

    // ---- state ---------------------------------------------------------
    const statePayload = (ctx.session?.payload || {}) as any;
    const stateEntries = (statePayload.entries || {}) as Record<string, any>;
    const readyIds: string[] = Array.isArray(ctx.session?.ready_participant_ids)
      ? ctx.session.ready_participant_ids
      : [];
    const status = await effectiveStatus(ctx, ctx.session);
    const { votes, rewards } = await fetchVotesAndRewards(ctx, GAME);
    const roundVotes = votes.filter((v) => v.round === ctx.round);

    const stories: unknown[] = [];
    if (status === "playing") {
      for (const id of ctx.tablemateIds) {
        const entry = stateEntries[id];
        if (!entry) continue;
        const vote = roundVotes.find((v) => v.target_participant_id === id && v.question_id === `emoji:${id}`);
        stories.push({
          token: await entryToken(ctx.event.id, ctx.round, GAME, id),
          emojis: entry.emojis || [],
          prompt: entry.prompt || null,
          vote: vote
            ? {
                guessedId: vote.guessed_participant_id,
                correct: !!vote.is_correct,
                ownerName: anonymizeName(ctx.mates.get(id) || ""),
                story: entry.story || "",
              }
            : null,
        });
      }
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
      myPrompt: stateEntries[ctx.participant.id]?.prompt || myPrompt,
      myEntry: stateEntries[ctx.participant.id]
        ? { emojis: stateEntries[ctx.participant.id].emojis || [], story: stateEntries[ctx.participant.id].story || "" }
        : null,
      tablemates: ctx.tablemateIds.map((id) => ({
        id,
        name: anonymizeName(ctx.mates.get(id) || ""),
        hasEntry: !!stateEntries[id],
        ready: readyIds.includes(id),
      })),
      iAmReady: readyIds.includes(ctx.participant.id),
      stories: shuffle(stories),
      rewards,
    });
  } catch (error) {
    console.error("[icebreaker-emoji] error", error);
    return json({ error: "Error interno del servidor" }, 500);
  }
});


export default async function handler(req: Request): Promise<Response> {
  if (!__handler) throw new Error("handler not registered");
  return await __handler(req);
}
