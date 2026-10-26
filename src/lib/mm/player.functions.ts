// Public player endpoints. No platform login: every call carries the signed
// player token and is validated server-side before touching any data.
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const eng = () => import("./engine.server");

export const mmGetInvitation = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => ({ token: z.string().min(10).max(80).parse(d.token) }))
  .handler(async ({ data }) => {
    const { db } = await eng();
    const { data: inv } = await db().from("mm_invitations").select("id, email, status, session_id, mm_sessions(name, status, language, scheduled_at, game_id, mm_games(id, title, synopsis, briefing, cover_url, theme))").eq("token", data.token).maybeSingle();
    if (!inv) return { found: false as const };
    return {
      found: true as const,
      email: inv.email as string,
      registered: inv.status === "registered",
      session_name: inv.mm_sessions?.name as string,
      finished: inv.mm_sessions?.status === "finished",
      language: (inv.mm_sessions?.language ?? "es") as string,
      scheduled_at: (inv.mm_sessions?.scheduled_at ?? null) as string | null,
      game: (await (await import("./translate.server")).loadTr(inv.mm_sessions?.game_id, inv.mm_sessions?.language)).row("mm_games", inv.mm_sessions?.mm_games) as {
        title: string;
        synopsis: string | null;
        briefing: string | null;
        cover_url: string | null;
        theme: Record<string, string>;
      },
    };
  });

export const mmRegisterInvitation = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; displayName: string }) => ({ token: z.string().min(10).max(80).parse(d.token), displayName: z.string().trim().min(1).max(60).parse(d.displayName) }))
  .handler(async ({ data }) => {
    const e = await eng();
    const { db } = e;
    const { data: inv } = await db().from("mm_invitations").select("*, mm_sessions(id, game_id, status, language, characters_released_at, mm_games(id, title))").eq("token", data.token).maybeSingle();
    if (!inv) throw new Error("Invitación no válida");
    if (inv.status === "registered") throw new Error("Esta invitación ya se ha usado. Entra con tu código personal.");
    const s = inv.mm_sessions;
    if (s.status === "finished") throw new Error("Esta partida ya ha terminado");
    const code = await e.newAccessCode();
    const { data: playerId, error } = await db().rpc("mm_register_player", { _invitation: inv.id, _name: data.displayName, _code: code });
    if (error) throw new Error(error.message);
    const { data: p, error: readError } = await db().from("mm_session_players").select("id,character_id").eq("id", playerId).single();
    if (readError || !p) throw new Error("No se pudo recuperar tu inscripción");
    const characterId = p.character_id;
    if (s.status !== "lobby" && characterId) {
      // late join: create objective/ability rows
      const [{ data: objs }, { data: abs }] = await Promise.all([
        db().from("mm_objectives").select("id").eq("character_id", characterId),
        db().from("mm_abilities").select("id, max_uses").eq("character_id", characterId),
      ]);
      if (objs?.length) await db().from("mm_player_objectives").upsert(objs.map((o: any) => ({ session_player_id: p.id, objective_id: o.id })), { ignoreDuplicates: true });
      if (abs?.length) await db().from("mm_player_abilities").upsert(abs.map((a: any) => ({ session_player_id: p.id, ability_id: a.id, uses_left: a.max_uses })), { ignoreDuplicates: true });
    }
    await e.logEvent(s.id, "player_registered", { name: data.displayName }, p.id);
    const { sendCodeEmail } = await import("./emails.server");
    const { loadTr } = await import("./translate.server");
    const title = (await loadTr(s.game_id, s.language)).row("mm_games", s.mm_games ?? { id: s.game_id, title: "Murder Mystery" }).title;
    await sendCodeEmail(inv.email, data.displayName, code, title, s.language);
    if (s.characters_released_at && characterId) await e.notifyAssignment(p.id).catch(() => false);
    await e.broadcast(e.sessionTopic(s.id), "players", {});
    return { code, sessionId: s.id as string, token: await e.signPlayerToken(p.id, s.id) };
  });

export const mmPlayerLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => ({ code: z.string().min(4).max(40).parse(d.code) }))
  .handler(async ({ data }) => {
    const e = await eng();
    const { db } = e;
    const ip = (getRequestHeader("cf-connecting-ip") || getRequestHeader("x-forwarded-for") || "unknown").split(",")[0].trim();
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await db().from("mm_login_attempts").select("id", { count: "exact", head: true }).eq("ip", ip).eq("success", false).gte("created_at", since);
    if ((count ?? 0) >= 10) throw new Error("Demasiados intentos. Espera unos minutos y vuelve a probar.");
    const { data: p } = await db().from("mm_session_players").select("id, session_id").eq("access_code", e.normalizeCode(data.code)).maybeSingle();
    await db().from("mm_login_attempts").insert({ ip, success: !!p });
    if (!p) throw new Error("Código no válido");
    await db().from("mm_session_players").update({ last_seen_at: new Date().toISOString() }).eq("id", p.id);
    await e.logEvent(p.session_id, "player_login", {}, p.id);
    return { sessionId: p.session_id as string, token: await e.signPlayerToken(p.id, p.session_id) };
  });

const auth = z.object({ token: z.string().min(10), sessionId: z.string().uuid() });

export const mmPlayerState = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof auth>) => auth.parse(d))
  .handler(async ({ data }) => {
    const e = await eng();
    const { sp, s } = await e.verifyPlayerToken(data.token, data.sessionId);
    await e.tick(s);
    const income = await e.db().rpc("mm_apply_income", { _session: s });
    if (income.error) throw new Error("No se pudieron actualizar los ingresos de la partida");
    await e.db().from("mm_session_players").update({ last_seen_at: new Date().toISOString() }).eq("id", sp);
    const state = await e.buildPlayerState(sp);
    return { ...state, token: await e.signPlayerToken(sp, s) } as any;
  });

const actionSchema = auth.extend({
  action: z.enum(["confirm", "ready", "toggle_objective", "vote"]),
  objectiveId: z.string().uuid().optional(),
  accusedCharacterId: z.string().uuid().optional(),
  motive: z.string().max(1000).optional(),
  method: z.string().max(1000).optional(),
});

export const mmPlayerAction = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof actionSchema>) => actionSchema.parse(d))
  .handler(async ({ data }) => {
    const e = await eng();
    const { db } = e;
    const { sp, s } = await e.verifyPlayerToken(data.token, data.sessionId);
    const { data: session } = await db().from("mm_sessions").select("status, voting_open, game_id").eq("id", s).single();
    switch (data.action) {
      case "confirm":
        await db().from("mm_session_players").update({ confirmed_at: new Date().toISOString() }).eq("id", sp).is("confirmed_at", null);
        await e.logEvent(s, "player_confirmed", {}, sp);
        await e.broadcast(e.sessionTopic(s), "players", {});
        break;
      case "ready":
        await db().from("mm_session_players").update({ ready: true, confirmed_at: new Date().toISOString() }).eq("id", sp);
        await e.logEvent(s, "player_ready", {}, sp);
        await e.broadcast(e.sessionTopic(s), "players", {});
        await e.tick(s);
        break;
      case "toggle_objective": {
        const { data: me } = await db().from("mm_session_players").select("character_id").eq("id", sp).single();
        const { data: obj } = await db().from("mm_objectives").select("id, character_id, completion_type, text").eq("id", data.objectiveId).single();
        if (!obj || obj.character_id !== me.character_id || obj.completion_type !== "manual") throw new Error("No puedes marcar este objetivo");
        const { data: row } = await db().from("mm_player_objectives").select("completed").eq("session_player_id", sp).eq("objective_id", obj.id).maybeSingle();
        const completed = !row?.completed;
        await db().from("mm_player_objectives").upsert({ session_player_id: sp, objective_id: obj.id, completed, completed_at: completed ? new Date().toISOString() : null });
        await e.logEvent(s, "objective_toggled", { text: obj.text, completed }, sp);
        break;
      }
      case "vote": {
        if (!session.voting_open || session.status === "finished") throw new Error("La votación no está abierta");
        const { data: ch } = await db().from("mm_characters").select("id, name").eq("id", data.accusedCharacterId).eq("game_id", session.game_id).maybeSingle();
        if (!ch) throw new Error("Personaje no válido");
        const { error } = await db().from("mm_votes").insert({ session_id: s, voter_player_id: sp, accused_character_id: ch.id, motive_text: data.motive ?? null, method_text: data.method ?? null });
        if (error) throw new Error("Ya has enviado tu acusación");
        await e.logEvent(s, "vote_submitted", {}, sp); // the accused name is not logged to keep the admin feed spoiler-free
        await e.broadcast(e.sessionTopic(s), "votes", {});
        await e.tick(s);
        break;
      }
    }
    return { ok: true };
  });

/* ------------------------- open join link (public) ------------------------ */

export const mmGetJoinInfo = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId: string }) => ({ sessionId: z.string().uuid().parse(d.sessionId) }))
  .handler(async ({ data }) => {
    const { db } = await eng();
    const { data: s } = await db()
      .from("mm_sessions")
      .select("id, name, status, language, scheduled_at, join_enabled, game_id, mm_games(id, title, synopsis, cover_url, theme, min_players, max_players, duration_minutes, genre, difficulty)")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (!s) return { found: false as const };
    const [{ count: registered }, { count: playable }] = await Promise.all([
      db().from("mm_session_players").select("id", { count: "exact", head: true }).eq("session_id", s.id),
      db().from("mm_characters").select("id", { count: "exact", head: true }).eq("game_id", s.game_id).eq("victim", false),
    ]);
    const capacity = Math.min(s.mm_games?.max_players ?? 0, playable ?? 0);
    const game = (await (await import("./translate.server")).loadTr(s.game_id, s.language)).row("mm_games", s.mm_games);
    return {
      found: true as const,
      open: !!s.join_enabled && s.status === "lobby",
      status: s.status as string,
      session_name: s.name as string,
      language: (s.language ?? "es") as string,
      scheduled_at: (s.scheduled_at ?? null) as string | null,
      spots_left: Math.max(0, capacity - (registered ?? 0)),
      game: game as { title: string; synopsis: string | null; cover_url: string | null; theme: Record<string, string>; min_players: number; max_players: number; duration_minutes: number; genre: string | null; difficulty: string | null },
    };
  });

export const mmJoinSession = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId: string; displayName: string; email: string }) => ({
    sessionId: z.string().uuid().parse(d.sessionId),
    displayName: z.string().trim().min(1).max(60).parse(d.displayName),
    email: z.string().trim().toLowerCase().max(120).regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Email no válido").parse(d.email),
  }))
  .handler(async ({ data }) => {
    const e = await eng();
    const { db } = e;
    const code = await e.newAccessCode();
    const { data: playerId, error } = await db().rpc("mm_join_session", { _session: data.sessionId, _name: data.displayName, _email: data.email, _code: code });
    if (error) throw new Error(error.message);
    const { data: p, error: readError } = await db().from("mm_session_players").select("id, character_id").eq("id", playerId).single();
    if (readError || !p) throw new Error("No se pudo recuperar tu inscripción");
    const { data: s } = await db().from("mm_sessions").select("id, game_id, language, characters_released_at, mm_games(id, title)").eq("id", data.sessionId).single();
    await e.logEvent(s.id, "player_registered", { name: data.displayName, via: "link" }, p.id);
    const { sendCodeEmail } = await import("./emails.server");
    const { loadTr } = await import("./translate.server");
    const title = (await loadTr(s.game_id, s.language)).row("mm_games", s.mm_games ?? { id: s.game_id, title: "Murder Mystery" }).title;
    await sendCodeEmail(data.email, data.displayName, code, title, s.language);
    if (s.characters_released_at && p.character_id) await e.notifyAssignment(p.id).catch(() => false);
    await e.broadcast(e.sessionTopic(s.id), "players", {});
    return { code, sessionId: s.id as string, token: await e.signPlayerToken(p.id, s.id) };
  });
