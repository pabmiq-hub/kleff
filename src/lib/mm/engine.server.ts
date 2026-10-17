// Murder Mystery engine (server-only). All player reads/writes go through here
// with the service role; is_killer is never included in another player's payload.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = () => supabaseAdmin as any;

/* ----------------------------- player tokens ----------------------------- */

const TOKEN_TTL_SECONDS = 60 * 60 * 12;

function b64url(bytes: Uint8Array | string): string {
  const bin = typeof bytes === "string" ? unescape(encodeURIComponent(bytes)) : String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): string {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return decodeURIComponent(escape(atob(pad)));
}
async function hmac(data: string): Promise<string> {
  const secret = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "") + "::mm-player-token";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64url(new Uint8Array(sig));
}
export async function signPlayerToken(sp: string, s: string): Promise<string> {
  const body = b64url(JSON.stringify({ sp, s, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }));
  return `${body}.${await hmac(body)}`;
}
export async function verifyPlayerToken(token: string, sessionId?: string): Promise<{ sp: string; s: string }> {
  const [body, sig] = (token ?? "").split(".");
  if (!body || !sig || (await hmac(body)) !== sig) throw new Error("Sesión de jugador no válida");
  const p = JSON.parse(fromB64url(body)) as { sp: string; s: string; exp: number };
  if (p.exp < Date.now() / 1000) throw new Error("Tu sesión ha caducado. Vuelve a introducir tu código.");
  if (sessionId && p.s !== sessionId) throw new Error("Este código no pertenece a esta partida");
  return { sp: p.sp, s: p.s };
}

/* -------------------------------- helpers -------------------------------- */

const WORDS = ["LUNA", "SOMBRA", "NIEBLA", "DAGA", "VELA", "CUERVO", "RELOJ", "LLAVE", "ROSA", "ECO", "ORO", "MASCARA", "VENENO", "FARO", "BRUMA", "ZORRO"];
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function rand(n: number, chars = CODE_CHARS) {
  const a = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(a, (x) => chars[x % chars.length]).join("");
}
export async function newAccessCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const w = WORDS[crypto.getRandomValues(new Uint8Array(1))[0] % WORDS.length];
    const code = `${w}-${rand(4)}`;
    const { data } = await db().from("mm_session_players").select("id").eq("access_code", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("No se pudo generar un código");
}
export const newToken = () => rand(32, "abcdefghijkmnopqrstuvwxyz23456789");
export const normalizeCode = (c: string) => c.trim().toUpperCase().replace(/\s+/g, "");

export async function logEvent(sessionId: string, type: string, payload: Record<string, unknown> = {}, playerId: string | null = null) {
  await db().from("mm_event_log").insert({ session_id: sessionId, player_id: playerId, type, payload });
}

/** Fire-and-forget Realtime broadcast with no sensitive content. */
export async function broadcast(topic: string, event: string, payload: Record<string, unknown> = {}) {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return;
    const headers: Record<string, string> = { "Content-Type": "application/json", apikey: key };
    if (!key.startsWith("sb_")) headers.Authorization = `Bearer ${key}`;
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages: [{ topic, event, payload: { ...payload, at: new Date().toISOString() }, private: false }] }),
    });
  } catch (e) {
    console.error("[mm] broadcast failed", e);
  }
}
export const sessionTopic = (id: string) => `mm-session-${id}`;
export const playerTopic = (id: string) => `mm-player-${id}`;

/* ------------------------------- act engine ------------------------------ */

type Session = Record<string, any>;

async function loadActs(gameId: string) {
  const { data } = await db().from("mm_acts").select("*").eq("game_id", gameId).order("position");
  return (data ?? []) as any[];
}

export async function initPlayerRows(session: Session) {
  const { data: players } = await db().from("mm_session_players").select("id, character_id").eq("session_id", session.id);
  for (const p of players ?? []) {
    if (!p.character_id) continue;
    const [{ data: objs }, { data: abs }] = await Promise.all([
      db().from("mm_objectives").select("id").eq("character_id", p.character_id),
      db().from("mm_abilities").select("id, max_uses").eq("character_id", p.character_id),
    ]);
    if (objs?.length)
      await db().from("mm_player_objectives").upsert(objs.map((o: any) => ({ session_player_id: p.id, objective_id: o.id })), { ignoreDuplicates: true });
    if (abs?.length)
      await db().from("mm_player_abilities").upsert(abs.map((a: any) => ({ session_player_id: p.id, ability_id: a.id, uses_left: a.max_uses })), { ignoreDuplicates: true });
  }
}

/* --------------------------- character hand-out -------------------------- */

/** Email a player the character they have been given (localized to the session language). */
export async function notifyAssignment(playerId: string): Promise<boolean> {
  const { data: p } = await db().from("mm_session_players").select("id, email, display_name, access_code, character_id, session_id").eq("id", playerId).maybeSingle();
  if (!p?.email || !p.character_id) return false;
  const { data: s } = await db().from("mm_sessions").select("game_id, language, scheduled_at").eq("id", p.session_id).single();
  const { loadTr } = await import("./translate.server");
  const tr = await loadTr(s.game_id, s.language);
  const [{ data: g }, { data: c }] = await Promise.all([
    db().from("mm_games").select("id, title, briefing").eq("id", s.game_id).single(),
    db().from("mm_characters").select("*").eq("id", p.character_id).single(),
  ]);
  const game = tr.row("mm_games", g);
  const ch = tr.row("mm_characters", c);
  const { sendAssignmentEmail } = await import("./emails.server");
  await sendAssignmentEmail({
    email: p.email,
    name: p.display_name,
    code: p.access_code,
    gameTitle: game.title,
    character: { name: ch.name, summary: ch.public_summary || ch.description, costume: ch.costume },
    briefing: game.briefing,
    scheduledAt: s.scheduled_at,
    lang: s.language,
  });
  await db().from("mm_session_players").update({ assignment_notified_at: new Date().toISOString() }).eq("id", p.id);
  return true;
}

/**
 * Hand out characters to everyone registered (killer first, so the murderer is
 * always played), reveal them to players and email each one. Idempotent.
 */
export async function releaseCharacters(sessionId: string, reason: string) {
  const { data: s } = await db().from("mm_sessions").select("*").eq("id", sessionId).single();
  if (!s || s.characters_released_at) return { assigned: 0, notified: 0, missing: [] as string[], already: true };
  const [{ data: chars }, { data: players }] = await Promise.all([
    db().from("mm_characters").select("id, name, is_killer, victim").eq("game_id", s.game_id),
    db().from("mm_session_players").select("id, character_id, ready, registered_at").eq("session_id", sessionId).order("registered_at"),
  ]);
  const playable = (chars ?? []).filter((c: any) => !c.victim);
  const taken = new Set((players ?? []).map((p: any) => p.character_id).filter(Boolean));
  const free = playable.filter((c: any) => !taken.has(c.id));
  const others = free.filter((c: any) => !c.is_killer).sort(() => Math.random() - 0.5);
  const queue = [...others, ...free.filter((c: any) => c.is_killer)]; // pop() takes the killer first
  const waiting = (players ?? []).filter((p: any) => !p.character_id).sort((a: any, b: any) => Number(b.ready) - Number(a.ready));
  let assigned = 0;
  for (const p of waiting) {
    const c = queue.pop();
    if (!c) break;
    await db().from("mm_session_players").update({ character_id: c.id }).eq("id", p.id);
    assigned++;
  }
  const { data: upd } = await db().from("mm_sessions").update({ characters_released_at: new Date().toISOString(), release_at: null }).eq("id", sessionId).is("characters_released_at", null).select("id");
  if (!upd?.length) return { assigned, notified: 0, missing: [], already: true };
  await logEvent(sessionId, "characters_released", { reason, assigned });
  await broadcast(sessionTopic(sessionId), "characters_released", {});
  let notified = 0;
  const { data: all } = await db().from("mm_session_players").select("id, email, character_id").eq("session_id", sessionId);
  for (const p of all ?? []) if (p.email && p.character_id && (await notifyAssignment(p.id).catch(() => false))) notified++;
  return { assigned, notified, missing: queue.map((c: any) => c.name), already: false };
}

export async function startSession(sessionId: string, reason: string) {
  const { data: s } = await db().from("mm_sessions").select("*").eq("id", sessionId).single();
  if (!s || s.status !== "lobby") return;
  if (!s.characters_released_at) await releaseCharacters(sessionId, "start");
  const acts = await loadActs(s.game_id);
  if (!acts.length) throw new Error("El juego no tiene actos");
  const first = acts[0];
  const now = new Date();
  const { data: upd } = await db()
    .from("mm_sessions")
    .update({ status: "running", current_act_id: first.id, act_started_at: now.toISOString(), act_ends_at: new Date(now.getTime() + first.duration_minutes * 60000).toISOString() })
    .eq("id", sessionId)
    .eq("status", "lobby")
    .select("id");
  if (!upd?.length) return;
  await initPlayerRows(s);
  await logEvent(sessionId, "session_started", { reason, act: first.name });
  await logEvent(sessionId, "act_changed", { act: first.name, position: first.position });
  await broadcast(sessionTopic(sessionId), "act_changed", { act_id: first.id });
}

/** Idempotent: only advances if the session is still on `fromActId`. */
export async function advanceAct(sessionId: string, fromActId: string | null, reason: string) {
  const { data: s } = await db().from("mm_sessions").select("*").eq("id", sessionId).single();
  if (!s || s.status === "finished" || s.status === "lobby") return;
  if ((s.current_act_id ?? null) !== fromActId) return;
  const acts = await loadActs(s.game_id);
  const idx = acts.findIndex((a) => a.id === s.current_act_id);
  const next = acts[idx + 1];
  if (!next) return finishSession(sessionId, reason);
  const now = new Date();
  const patch: Record<string, unknown> = {
    current_act_id: next.id,
    act_started_at: now.toISOString(),
    act_ends_at: s.status === "paused" ? null : new Date(now.getTime() + next.duration_minutes * 60000).toISOString(),
    paused_remaining_seconds: s.status === "paused" ? next.duration_minutes * 60 : null,
  };
  if (next.key === "investigation" && s.control_mode !== "manual" && !s.murder_triggered_at) patch.murder_triggered_at = now.toISOString();
  if (next.key === "conclusion") patch.voting_open = true;
  let q = db().from("mm_sessions").update(patch).eq("id", sessionId);
  q = fromActId ? q.eq("current_act_id", fromActId) : q.is("current_act_id", null);
  const { data: upd } = await q.select("id");
  if (!upd?.length) return;
  await logEvent(sessionId, "act_changed", { act: next.name, position: next.position, reason });
  if (patch.murder_triggered_at) await logEvent(sessionId, "murder_triggered", { reason: "auto" });
  if (patch.voting_open) await logEvent(sessionId, "voting_opened", {});
  await broadcast(sessionTopic(sessionId), "act_changed", { act_id: next.id });
}

export async function finishSession(sessionId: string, reason: string) {
  const now = new Date().toISOString();
  const { data: upd } = await db()
    .from("mm_sessions")
    .update({ status: "finished", voting_open: false, act_ends_at: null, revealed_at: now })
    .eq("id", sessionId)
    .neq("status", "finished")
    .select("id");
  if (!upd?.length) return;
  await logEvent(sessionId, "session_finished", { reason });
  await broadcast(sessionTopic(sessionId), "final_reveal", {});
}

/** Lazy scheduler: runs on every state read so timer/auto modes progress without an admin. */
export async function tick(sessionId: string) {
  const { data: s } = await db().from("mm_sessions").select("*").eq("id", sessionId).maybeSingle();
  if (!s || s.status === "finished") return;
  const now = Date.now();
  if (s.status === "lobby" && s.control_mode === "auto") {
    const { data: ps } = await db().from("mm_session_players").select("ready").eq("session_id", sessionId);
    const scheduled = s.scheduled_at && new Date(s.scheduled_at).getTime() <= now;
    if (ps?.length && (ps.every((p: any) => p.ready) || scheduled)) await startSession(sessionId, "auto");
    return;
  }
  if (s.status !== "running") return;
  if (s.control_mode === "auto" && s.voting_open) {
    const [{ count: players }, { count: votes }] = await Promise.all([
      db().from("mm_session_players").select("id", { count: "exact", head: true }).eq("session_id", sessionId),
      db().from("mm_votes").select("voter_player_id", { count: "exact", head: true }).eq("session_id", sessionId),
    ]);
    if (players && votes !== null && votes >= players) return finishSession(sessionId, "all_voted");
  }
  if (s.control_mode !== "manual" && s.act_ends_at && new Date(s.act_ends_at).getTime() <= now) {
    await advanceAct(sessionId, s.current_act_id, "timer");
  }
}

/* ------------------------------- read models ----------------------------- */

const ONLINE_MS = 35_000;

function publicSession(s: Session, acts: any[], game: any) {
  const act = acts.find((a) => a.id === s.current_act_id) ?? null;
  return {
    id: s.id,
    name: s.name,
    status: s.status,
    control_mode: s.control_mode,
    act: act ? { id: act.id, key: act.key, name: act.name, position: act.position, narrative_text: act.narrative_text, duration_minutes: act.duration_minutes } : null,
    acts: acts.map((a) => ({ id: a.id, key: a.key, name: a.name, position: a.position })),
    act_started_at: s.act_started_at,
    act_ends_at: s.act_ends_at,
    paused_remaining_seconds: s.paused_remaining_seconds,
    murder_triggered_at: s.murder_triggered_at,
    murder_event: s.murder_triggered_at ? game.murder_event : null,
    voting_open: s.voting_open,
    revealed_at: s.revealed_at,
    server_now: new Date().toISOString(),
    game: { id: game.id, title: game.title, theme: game.theme, cover_url: game.cover_url },
  };
}

export async function computeResults(sessionId: string) {
  const [{ data: players }, { data: votes }, { data: pobj }] = await Promise.all([
    db().from("mm_session_players").select("id, display_name, character_id").eq("session_id", sessionId),
    db().from("mm_votes").select("*").eq("session_id", sessionId),
    db().from("mm_player_objectives").select("session_player_id, completed, mm_objectives(points)").in(
      "session_player_id",
      ((await db().from("mm_session_players").select("id").eq("session_id", sessionId)).data ?? []).map((p: any) => p.id),
    ),
  ]);
  const { data: s } = await db().from("mm_sessions").select("game_id").eq("id", sessionId).single();
  const { data: chars } = await db().from("mm_characters").select("id, name, is_killer, avatar_config, avatar_url").eq("game_id", s.game_id);
  const killer = (chars ?? []).find((c: any) => c.is_killer) ?? null;
  const rows = (players ?? []).map((p: any) => {
    const v = (votes ?? []).find((x: any) => x.voter_player_id === p.id);
    const objs = (pobj ?? []).filter((o: any) => o.session_player_id === p.id);
    const objPoints = objs.filter((o: any) => o.completed).reduce((n: number, o: any) => n + (o.mm_objectives?.points ?? 0), 0);
    const correct = !!v && !!killer && v.accused_character_id === killer.id;
    const ch = (chars ?? []).find((c: any) => c.id === p.character_id);
    return {
      player_id: p.id,
      display_name: p.display_name,
      character: ch ? { id: ch.id, name: ch.name, avatar_config: ch.avatar_config, avatar_url: ch.avatar_url } : null,
      accused: v ? (chars ?? []).find((c: any) => c.id === v.accused_character_id)?.name ?? "?" : null,
      motive_text: v?.motive_text ?? null,
      method_text: v?.method_text ?? null,
      correct,
      objectives_done: objs.filter((o: any) => o.completed).length,
      objectives_total: objs.length,
      score: objPoints + (correct ? 3 : 0),
    };
  });
  rows.sort((a: any, b: any) => b.score - a.score);
  return { killer: killer ? { id: killer.id, name: killer.name, avatar_config: killer.avatar_config, avatar_url: killer.avatar_url } : null, rows };
}

export async function buildPlayerState(playerId: string) {
  const { data: me } = await db().from("mm_session_players").select("*").eq("id", playerId).single();
  if (!me) throw new Error("Jugador no encontrado");
  const { data: s } = await db().from("mm_sessions").select("*").eq("id", me.session_id).single();
  const [{ data: game }, acts, { data: chars }, { data: players }] = await Promise.all([
    db().from("mm_games").select("*").eq("id", s.game_id).single(),
    loadActs(s.game_id),
    db().from("mm_characters").select("*").eq("game_id", s.game_id),
    db().from("mm_session_players").select("id, display_name, character_id, last_seen_at, ready").eq("session_id", s.id),
  ]);
  const actPos = (id: string | null) => (id ? acts.find((a) => a.id === id)?.position ?? 0 : 0);
  const curPos = s.status === "lobby" ? 0 : actPos(s.current_act_id);
  const reached = (actId: string | null) => !actId || actPos(actId) <= curPos;
  const myChar = (chars ?? []).find((c: any) => c.id === me.character_id) ?? null;
  const charIds = (chars ?? []).map((c: any) => c.id);

  const [{ data: secrets }, { data: objectives }, { data: pobj }, { data: items }, { data: abilities }, { data: pab }, { data: evidences }, { data: unlocks }, { data: vote }] =
    await Promise.all([
      charIds.length ? db().from("mm_secrets").select("*").in("character_id", charIds) : { data: [] },
      myChar ? db().from("mm_objectives").select("*").eq("character_id", myChar.id) : { data: [] },
      db().from("mm_player_objectives").select("*").eq("session_player_id", me.id),
      myChar ? db().from("mm_items").select("*").eq("character_id", myChar.id) : { data: [] },
      myChar ? db().from("mm_abilities").select("*").eq("character_id", myChar.id) : { data: [] },
      db().from("mm_player_abilities").select("*").eq("session_player_id", me.id),
      db().from("mm_evidences").select("*").eq("game_id", s.game_id),
      db().from("mm_player_unlocks").select("*").eq("session_player_id", me.id),
      db().from("mm_votes").select("accused_character_id, motive_text, method_text, submitted_at").eq("session_id", s.id).eq("voter_player_id", me.id).maybeSingle(),
    ]);
  const unlockedSecret = new Set((unlocks ?? []).map((u: any) => u.secret_id).filter(Boolean));
  const unlockedEv = new Set((unlocks ?? []).map((u: any) => u.evidence_id).filter(Boolean));
  const charName = (id: string) => (chars ?? []).find((c: any) => c.id === id)?.name ?? "";
  const murdered = !!s.murder_triggered_at;
  const now = Date.now();

  const visibleSecrets = (secrets ?? [])
    .filter((x: any) => x.character_id === me.character_id || (me.character_id && (x.known_by ?? []).includes(me.character_id)) || unlockedSecret.has(x.id))
    .map((x: any) => ({ id: x.id, content: x.content, owner: charName(x.character_id), own: x.character_id === me.character_id }));

  const visibleEvidences = (evidences ?? [])
    .filter((e: any) => {
      if (unlockedEv.has(e.id)) return true;
      if (s.status === "lobby") return false;
      const auto = !e.unlock_rule || e.unlock_rule.type === "auto" || !e.unlock_rule.type;
      if (!auto || !reached(e.act_id)) return false;
      return e.scope === "common" || e.target_character_id === me.character_id;
    })
    .map((e: any) => ({ id: e.id, title: e.title, content: e.content, image_url: e.image_url, scope: e.scope, reveal_style: e.reveal_style, act: acts.find((a) => a.id === e.act_id)?.name ?? null }));

  return {
    session: publicSession(s, acts, game),
    me: {
      id: me.id,
      display_name: me.display_name,
      ready: me.ready,
      character: myChar
        ? {
            id: myChar.id,
            name: myChar.name,
            description: myChar.description,
            alibi: myChar.alibi,
            relationships: myChar.relationships,
            avatar_config: myChar.avatar_config,
            avatar_url: myChar.avatar_url,
            // Only the owner ever receives their own killer flag.
            is_killer: !!myChar.is_killer,
          }
        : null,
    },
    cast: (chars ?? [])
      .filter((c: any) => !c.victim || murdered)
      .map((c: any) => {
        const p = (players ?? []).find((x: any) => x.character_id === c.id);
        return {
          character_id: c.id,
          name: c.name,
          avatar_config: c.avatar_config,
          avatar_url: c.avatar_url,
          is_victim: murdered && !!c.victim,
          player: p ? { id: p.id, display_name: p.display_name, online: !!p.last_seen_at && now - new Date(p.last_seen_at).getTime() < ONLINE_MS, ready: p.ready } : null,
        };
      }),
    secrets: visibleSecrets,
    objectives: (objectives ?? [])
      .filter((o: any) => s.status !== "lobby" && reached(o.act_id))
      .map((o: any) => {
        const po = (pobj ?? []).find((x: any) => x.objective_id === o.id);
        const act = acts.find((a) => a.id === o.act_id);
        return { id: o.id, text: o.text, completion_type: o.completion_type, points: o.points, act: act?.name ?? null, act_position: act?.position ?? 0, current: act?.id === s.current_act_id, completed: !!po?.completed };
      }),
    items: (items ?? []).filter((i: any) => reached(i.available_from_act_id)).map((i: any) => ({ id: i.id, name: i.name, description: i.description, image_url: i.image_url })),
    abilities: (abilities ?? [])
      .filter((a: any) => reached(a.available_from_act_id))
      .map((a: any) => ({ id: a.id, name: a.name, description: a.description, effect_type: a.effect_type, max_uses: a.max_uses, uses_left: (pab ?? []).find((x: any) => x.ability_id === a.id)?.uses_left ?? a.max_uses })),
    evidences: visibleEvidences,
    vote: vote ?? null,
    results: s.status === "finished" ? { ...(await computeResults(s.id)), final_reveal: game.final_reveal } : null,
  };
}

export async function buildAdminState(sessionId: string) {
  const { data: s } = await db().from("mm_sessions").select("*").eq("id", sessionId).single();
  if (!s) throw new Error("Partida no encontrada");
  const [{ data: game }, acts, { data: chars }, { data: players }, { data: invites }, { data: log }, { data: votes }, { data: reqs }] = await Promise.all([
    db().from("mm_games").select("*").eq("id", s.game_id).single(),
    loadActs(s.game_id),
    db().from("mm_characters").select("*").eq("game_id", s.game_id),
    db().from("mm_session_players").select("*").eq("session_id", s.id).order("registered_at"),
    db().from("mm_invitations").select("*").eq("session_id", s.id).order("created_at"),
    db().from("mm_event_log").select("*").eq("session_id", s.id).order("created_at", { ascending: false }).limit(300),
    db().from("mm_votes").select("voter_player_id, submitted_at").eq("session_id", s.id),
    db().from("mm_action_requests").select("*").eq("session_id", s.id).order("created_at", { ascending: false }).limit(100),
  ]);
  const hideKiller = s.blind_mode && s.status !== "finished";
  const pids = (players ?? []).map((p: any) => p.id);
  const [{ data: pobj }, { data: unlocks }, { data: pab }] = pids.length
    ? await Promise.all([
        db().from("mm_player_objectives").select("*").in("session_player_id", pids),
        db().from("mm_player_unlocks").select("*").in("session_player_id", pids),
        db().from("mm_player_abilities").select("*, mm_abilities(max_uses)").in("session_player_id", pids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const now = Date.now();
  return {
    session: { ...publicSession(s, acts, game), murder_event: game.murder_event, blind_mode: s.blind_mode, scheduled_at: s.scheduled_at, archived: s.archived },
    final_reveal: game.final_reveal,
    characters: (chars ?? []).map((c: any) => ({ id: c.id, name: c.name, victim: c.victim, avatar_config: c.avatar_config, avatar_url: c.avatar_url, is_killer: hideKiller ? null : c.is_killer })),
    players: (players ?? []).map((p: any) => {
      const objs = (pobj ?? []).filter((o: any) => o.session_player_id === p.id);
      const abs = (pab ?? []).filter((o: any) => o.session_player_id === p.id);
      const ul = (unlocks ?? []).filter((u: any) => u.session_player_id === p.id);
      return {
        id: p.id,
        display_name: p.display_name,
        email: p.email,
        character_id: p.character_id,
        access_code: p.access_code,
        ready: p.ready,
        online: !!p.last_seen_at && now - new Date(p.last_seen_at).getTime() < ONLINE_MS,
        last_seen_at: p.last_seen_at,
        voted: (votes ?? []).some((v: any) => v.voter_player_id === p.id),
        progress: {
          objectives_done: objs.filter((o: any) => o.completed).length,
          objectives_total: objs.length,
          evidences: ul.filter((u: any) => u.evidence_id).length,
          secrets: ul.filter((u: any) => u.secret_id).length,
          abilities_used: abs.reduce((n: number, a: any) => n + Math.max(0, (a.mm_abilities?.max_uses ?? 0) - a.uses_left), 0),
          joint_actions: (reqs ?? []).filter((r: any) => r.status === "completed" && (r.from_player === p.id || (r.to_players ?? []).includes(p.id))).length,
        },
      };
    }),
    invitations: invites ?? [],
    log: log ?? [],
    action_requests: reqs ?? [],
    results: s.status === "finished" ? await computeResults(s.id) : null,
  };
}
