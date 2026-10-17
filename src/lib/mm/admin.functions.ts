import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { mmImportSchema, formatImportErrors } from "./import-schema";
import { isSessionLanguageLocked } from "./session-rules";

async function guard(userId: string) {
  const { assertSuperAdmin } = await import("@/lib/assert-role.server");
  await assertSuperAdmin(userId);
  return import("./engine.server");
}
const mmEmails = () => import("./emails.server");

const id = z.string().uuid();

export const mmListGames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { db } = await guard(context.userId);
    const { data, error } = await db().from("mm_games").select("id, slug, title, synopsis, cover_url, min_players, max_players, duration_minutes, status, theme, created_at").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data as any[];
  });

export const mmImportGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { json: unknown }) => d)
  .handler(async ({ data, context }) => {
    const { db } = await guard(context.userId);
    const parsed = mmImportSchema.safeParse(data.json);
    if (!parsed.success) return { ok: false as const, errors: formatImportErrors(parsed.error) };
    const g = parsed.data;
    const { data: exists } = await db().from("mm_games").select("id").eq("slug", g.game.slug).maybeSingle();
    if (exists) return { ok: false as const, errors: [`Ya existe un juego con el slug «${g.game.slug}»`] };
    const { data: game, error } = await db().from("mm_games").insert({ ...g.game, status: "draft" }).select("id").single();
    if (error) return { ok: false as const, errors: [error.message] };
    try {
      const must = (r: any) => {
        if (r.error) throw new Error(r.error.message);
        return r.data;
      };
      const acts = must(await db().from("mm_acts").insert(g.acts.map((a, i) => ({ ...a, game_id: game.id, position: i + 1 }))).select("id, key"));
      const actId = (k?: string) => (k ? acts.find((a: any) => a.key === k)?.id ?? null : null);
      const chars = must(
        await db()
          .from("mm_characters")
          .insert(g.characters.map((c) => ({ game_id: game.id, ref: c.ref, name: c.name, description: c.description, public_summary: c.public_summary ?? null, costume: c.costume ?? null, alibi: c.alibi, relationships: c.relationships, is_killer: c.is_killer, victim: c.victim, avatar_config: c.avatar_config, avatar_url: c.avatar_url ?? null })))
          .select("id, ref"),
      );
      const cid = (ref: string) => chars.find((c: any) => c.ref === ref)?.id;
      const rows = { secrets: [] as any[], objectives: [] as any[], abilities: [] as any[], items: [] as any[], fragments: [] as any[] };
      for (const c of g.characters) {
        const owner = cid(c.ref);
        c.secrets.forEach((s) => rows.secrets.push({ character_id: owner, content: s.content, known_by: s.known_by.map(cid), unlock_rule: s.unlock_rule ?? null }));
        c.objectives.forEach((o) => rows.objectives.push({ character_id: owner, act_id: actId(o.act), text: o.text, completion_type: o.completion_type, auto_rule: o.auto_rule ?? null, points: o.points }));
        c.abilities.forEach((a) => rows.abilities.push({ character_id: owner, name: a.name, description: a.description, effect_type: a.effect_type, effect_config: a.effect_config, max_uses: a.max_uses, available_from_act_id: actId(a.available_from_act) }));
        c.items.forEach((i) => rows.items.push({ character_id: owner, name: i.name, description: i.description, image_url: i.image_url, available_from_act_id: actId(i.available_from_act) }));
        c.fragments.forEach((f) => rows.fragments.push({ game_id: game.id, character_id: owner, label: f.label, value: f.value, group_key: f.group_key }));
      }
      for (const [t, list] of [["mm_secrets", rows.secrets], ["mm_objectives", rows.objectives], ["mm_abilities", rows.abilities], ["mm_items", rows.items], ["mm_fragments", rows.fragments]] as const)
        if (list.length) must(await db().from(t).insert(list));
      if (g.evidences.length)
        must(await db().from("mm_evidences").insert(g.evidences.map((e) => ({ game_id: game.id, act_id: actId(e.act), title: e.title, content: e.content, image_url: e.image_url, scope: e.scope, target_character_id: e.target ? cid(e.target) : null, unlock_rule: e.unlock_rule, reveal_style: e.reveal_style }))));
      if (g.joint_actions.length)
        must(
          await db()
            .from("mm_joint_actions")
            .insert(
              g.joint_actions.map((j) => ({
                game_id: game.id,
                name: j.name,
                description: j.description,
                available_from_act_id: actId(j.available_from_act),
                requirements: j.requirements.map((r: any) => ({ ...r, character_id: r.character && r.character !== "cualquiera" ? cid(r.character) : "cualquiera" })),
                results: j.results,
              })),
            ),
        );
      return { ok: true as const, gameId: game.id as string };
    } catch (e) {
      await db().from("mm_games").delete().eq("id", game.id); // cascades: all-or-nothing import
      return { ok: false as const, errors: [(e as Error).message] };
    }
  });

export const mmGetGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { gameId: string }) => ({ gameId: id.parse(d.gameId) }))
  .handler(async ({ data, context }) => {
    const { db } = await guard(context.userId);
    const g = data.gameId;
    const [{ data: game }, { data: acts }, { data: characters }, { data: evidences }, { data: joint }, { data: sessions }] = await Promise.all([
      db().from("mm_games").select("*").eq("id", g).single(),
      db().from("mm_acts").select("*").eq("game_id", g).order("position"),
      db().from("mm_characters").select("*").eq("game_id", g).order("name"),
      db().from("mm_evidences").select("*").eq("game_id", g),
      db().from("mm_joint_actions").select("id, name, description").eq("game_id", g),
      db().from("mm_sessions").select("id, name, status, control_mode, scheduled_at, created_at, archived").eq("game_id", g).order("created_at", { ascending: false }),
    ]);
    if (!game) throw new Error("Juego no encontrado");
    return { game, acts: acts ?? [], characters: characters ?? [], evidences: evidences ?? [], joint_actions: joint ?? [], sessions: sessions ?? [] } as any;
  });

export const mmUpdateGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { gameId: string; status?: "draft" | "published"; delete?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { db } = await guard(context.userId);
    if (data.delete) await db().from("mm_games").delete().eq("id", data.gameId);
    else if (data.status) await db().from("mm_games").update({ status: data.status }).eq("id", data.gameId);
    return { ok: true };
  });

export const mmUpdateCharacterAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { characterId: string; avatar_config: Record<string, unknown>; avatar_url: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { db } = await guard(context.userId);
    await db().from("mm_characters").update({ avatar_config: data.avatar_config, avatar_url: data.avatar_url || null }).eq("id", data.characterId);
    return { ok: true };
  });

export const mmCreateSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { gameId: string; name: string; scheduled_at?: string | null; control_mode: "manual" | "timer" | "auto"; blind_mode: boolean; language?: string; release_at?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { db } = await guard(context.userId);
    const { data: s, error } = await db()
      .from("mm_sessions")
      .insert({ game_id: data.gameId, name: data.name || "Partida", scheduled_at: data.scheduled_at || null, control_mode: data.control_mode, blind_mode: data.blind_mode, language: data.language || "es", release_at: data.release_at || null, created_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { sessionId: s.id as string };
  });

export const mmGetSessionAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string }) => ({ sessionId: id.parse(d.sessionId) }))
  .handler(async ({ data, context }) => {
    const eng = await guard(context.userId);
    await eng.tick(data.sessionId);
    return (await eng.buildAdminState(data.sessionId)) as any;
  });

export const mmViewAsPlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { playerId: string }) => ({ playerId: id.parse(d.playerId) }))
  .handler(async ({ data, context }) => {
    const eng = await guard(context.userId);
    return (await eng.buildPlayerState(data.playerId)) as any;
  });

const controlSchema = z.object({
  sessionId: id,
  action: z.enum(["start", "pause", "resume", "add_minutes", "advance", "murder", "voting_open", "voting_close", "finish", "archive", "set_mode", "set_blind", "admin_objective", "release", "schedule_release", "set_language"]),
  releaseAt: z.string().nullable().optional(),
  language: z.enum(["es", "ca", "en", "fr"]).optional(),
  minutes: z.number().int().optional(),
  mode: z.enum(["manual", "timer", "auto"]).optional(),
  blind: z.boolean().optional(),
  expectedActId: z.string().uuid().nullable().optional(),
  playerId: z.string().uuid().optional(),
  objectiveId: z.string().uuid().optional(),
});

export const mmControlSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof controlSchema>) => controlSchema.parse(d))
  .handler(async ({ data, context }) => {
    const eng = await guard(context.userId);
    const { db, logEvent, broadcast, sessionTopic } = eng;
    const sid = data.sessionId;
    const { data: s } = await db().from("mm_sessions").select("*").eq("id", sid).single();
    if (!s) throw new Error("Partida no encontrada");
    const pub = (event: string) => broadcast(sessionTopic(sid), event, {});
    const now = Date.now();
    switch (data.action) {
      case "start":
        await eng.startSession(sid, "admin");
        break;
      case "pause":
        if (s.status !== "running") break;
        await db().from("mm_sessions").update({ status: "paused", paused_remaining_seconds: s.act_ends_at ? Math.max(0, Math.round((new Date(s.act_ends_at).getTime() - now) / 1000)) : null, act_ends_at: null }).eq("id", sid);
        await logEvent(sid, "paused");
        await pub("paused");
        break;
      case "resume":
        if (s.status !== "paused") break;
        await db().from("mm_sessions").update({ status: "running", act_ends_at: s.paused_remaining_seconds != null ? new Date(now + s.paused_remaining_seconds * 1000).toISOString() : null, paused_remaining_seconds: null }).eq("id", sid);
        await logEvent(sid, "resumed");
        await pub("resumed");
        break;
      case "add_minutes": {
        const m = data.minutes ?? 0;
        if (s.status === "paused") await db().from("mm_sessions").update({ paused_remaining_seconds: Math.max(0, (s.paused_remaining_seconds ?? 0) + m * 60) }).eq("id", sid);
        else if (s.act_ends_at) await db().from("mm_sessions").update({ act_ends_at: new Date(Math.max(now, new Date(s.act_ends_at).getTime() + m * 60000)).toISOString() }).eq("id", sid);
        await logEvent(sid, "time_changed", { minutes: m });
        await pub("timer");
        break;
      }
      case "advance":
        await eng.advanceAct(sid, data.expectedActId ?? s.current_act_id, "admin");
        break;
      case "murder":
        if (s.murder_triggered_at) break;
        await db().from("mm_sessions").update({ murder_triggered_at: new Date().toISOString() }).eq("id", sid).is("murder_triggered_at", null);
        await logEvent(sid, "murder_triggered", { reason: "admin" });
        await pub("murder");
        break;
      case "voting_open":
      case "voting_close":
        await db().from("mm_sessions").update({ voting_open: data.action === "voting_open" }).eq("id", sid);
        await logEvent(sid, data.action === "voting_open" ? "voting_opened" : "voting_closed");
        await pub("voting");
        break;
      case "finish":
        await eng.finishSession(sid, "admin");
        break;
      case "archive":
        await db().from("mm_sessions").update({ archived: true }).eq("id", sid);
        break;
      case "set_mode":
        await db().from("mm_sessions").update({ control_mode: data.mode }).eq("id", sid);
        await logEvent(sid, "mode_changed", { mode: data.mode });
        await pub("mode");
        break;
      case "set_blind":
        await db().from("mm_sessions").update({ blind_mode: !!data.blind }).eq("id", sid);
        break;
      case "release": {
        const r = await eng.releaseCharacters(sid, "admin");
        return { ok: true, ...r };
      }
      case "schedule_release":
        if (isSessionLanguageLocked(s)) throw new Error("El reparto solo se puede programar antes del reparto y del inicio");
        await db().from("mm_sessions").update({ release_at: data.releaseAt || null }).eq("id", sid);
        await logEvent(sid, "release_scheduled", { at: data.releaseAt ?? null });
        break;
      case "set_language": {
        if (isSessionLanguageLocked(s)) throw new Error("El idioma está fijado: ya se han repartido los personajes o se ha iniciado la partida.");
        const lang = data.language ?? "es";
        if (lang !== "es") {
          const { translateGame } = await import("./translate.server");
          await translateGame(s.game_id, lang);
        }
        const { data: updated, error } = await db().from("mm_sessions").update({ language: lang }).eq("id", sid).eq("status", "lobby").is("characters_released_at", null).select("id");
        if (error || !updated?.length) throw new Error("El idioma no se ha cambiado: la partida ya ha repartido personajes o ha comenzado.");
        await logEvent(sid, "language_changed", { language: lang });
        await pub("language");
        break;
      }
      case "admin_objective": {
        const { data: row } = await db().from("mm_player_objectives").select("completed").eq("session_player_id", data.playerId).eq("objective_id", data.objectiveId).maybeSingle();
        const completed = !row?.completed;
        await db().from("mm_player_objectives").upsert({ session_player_id: data.playerId, objective_id: data.objectiveId, completed, completed_at: completed ? new Date().toISOString() : null });
        await logEvent(sid, "objective_toggled", { by: "admin", completed }, data.playerId ?? null);
        break;
      }
    }
    return { ok: true };
  });

export const mmManagePlayers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      sessionId: string;
      action: "invite" | "resend" | "assign" | "random_assign" | "add_player" | "regenerate_code" | "remove_player" | "remove_invitation";
      emails?: string[];
      invitationId?: string;
      playerId?: string;
      characterId?: string | null;
      displayName?: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const eng = await guard(context.userId);
    const { db, logEvent } = eng;
    const sid = id.parse(data.sessionId);
    const { data: s } = await db().from("mm_sessions").select("id, name, game_id, language, scheduled_at, mm_games(title)").eq("id", sid).single();
    if (!s) throw new Error("Partida no encontrada");
    const { loadTr } = await import("./translate.server");
    const title = (await loadTr(s.game_id, s.language)).row("mm_games", { id: s.game_id, title: s.mm_games?.title ?? "Murder Mystery" }).title;
    switch (data.action) {
      case "invite": {
        const emails = Array.from(new Set((data.emails ?? []).map((e) => e.trim().toLowerCase()).filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))));
        if (!emails.length) throw new Error("Introduce al menos un email válido");
        for (const email of emails) {
          const token = eng.newToken();
          await db().from("mm_invitations").insert({ session_id: sid, email, token, sent_at: new Date().toISOString() });
          await (await mmEmails()).sendInviteEmail(email, token, title, s.name, s.language, s.scheduled_at);
        }
        await logEvent(sid, "invitations_sent", { count: emails.length });
        return { ok: true, count: emails.length };
      }
      case "resend": {
        if (data.invitationId) {
          const { data: inv } = await db().from("mm_invitations").select("*").eq("id", data.invitationId).single();
          await (await mmEmails()).sendInviteEmail(inv.email, inv.token, title, s.name, s.language, s.scheduled_at);
          await db().from("mm_invitations").update({ sent_at: new Date().toISOString() }).eq("id", inv.id);
        } else if (data.playerId) {
          const { data: p } = await db().from("mm_session_players").select("*").eq("id", data.playerId).single();
          if (!p?.email) throw new Error("Este jugador no tiene email");
          await (await mmEmails()).sendCodeEmail(p.email, p.display_name, p.access_code, title, s.language);
        }
        return { ok: true };
      }
      case "assign": {
        if (data.invitationId) await db().from("mm_invitations").update({ character_id: data.characterId ?? null }).eq("id", data.invitationId);
        if (data.playerId) {
          if (data.characterId) await db().from("mm_session_players").update({ character_id: null }).eq("session_id", sid).eq("character_id", data.characterId);
          await db().from("mm_session_players").update({ character_id: data.characterId ?? null }).eq("id", data.playerId);
          // Substitution after the hand-out: brief the new player and set up their game rows.
          const { data: ss } = await db().from("mm_sessions").select("*").eq("id", sid).single();
          if (data.characterId && ss?.characters_released_at) {
            if (ss.status !== "lobby") await eng.initPlayerRows(ss);
            const sent = await eng.notifyAssignment(data.playerId).catch(() => false);
            await logEvent(sid, "character_reassigned", {}, data.playerId);
            await eng.broadcast(eng.sessionTopic(sid), "players", {});
            return { ok: true, notified: sent };
          }
        }
        return { ok: true };
      }
      case "random_assign": {
        const [{ data: chars }, { data: players }, { data: invs }] = await Promise.all([
          db().from("mm_characters").select("id").eq("game_id", s.game_id).eq("victim", false),
          db().from("mm_session_players").select("id, character_id").eq("session_id", sid),
          db().from("mm_invitations").select("id, character_id, status").eq("session_id", sid).eq("status", "sent"),
        ]);
        const taken = new Set([...(players ?? []), ...(invs ?? [])].map((x: any) => x.character_id).filter(Boolean));
        const free = (chars ?? []).map((c: any) => c.id).filter((c: string) => !taken.has(c)).sort(() => Math.random() - 0.5);
        for (const p of (players ?? []).filter((p: any) => !p.character_id)) if (free.length) await db().from("mm_session_players").update({ character_id: free.pop() }).eq("id", p.id);
        for (const i of (invs ?? []).filter((i: any) => !i.character_id)) if (free.length) await db().from("mm_invitations").update({ character_id: free.pop() }).eq("id", i.id);
        return { ok: true };
      }
      case "add_player": {
        const code = await eng.newAccessCode();
        await db().from("mm_session_players").insert({ session_id: sid, display_name: data.displayName?.trim() || "Jugador", character_id: data.characterId ?? null, access_code: code });
        await logEvent(sid, "player_added", { name: data.displayName });
        return { ok: true, code };
      }
      case "regenerate_code": {
        const code = await eng.newAccessCode();
        await db().from("mm_session_players").update({ access_code: code }).eq("id", data.playerId);
        await logEvent(sid, "code_regenerated", {}, data.playerId ?? null);
        return { ok: true, code };
      }
      case "remove_player":
        await db().from("mm_session_players").delete().eq("id", data.playerId).eq("session_id", sid);
        return { ok: true };
      case "remove_invitation":
        await db().from("mm_invitations").delete().eq("id", data.invitationId).eq("session_id", sid);
        return { ok: true };
    }
  });


export const mmTranslateGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { gameId: string; lang: "ca" | "en" | "fr"; force?: boolean }) => ({ gameId: id.parse(d.gameId), lang: z.enum(["ca", "en", "fr"]).parse(d.lang), force: !!d.force }))
  .handler(async ({ data, context }) => {
    await guard(context.userId);
    const { translateGame } = await import("./translate.server");
    return translateGame(data.gameId, data.lang, data.force);
  });
