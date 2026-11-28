import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  HITSTER_CATEGORIES,
  HITSTER_COLORS,
  emptyMarks,
  evaluateGameOutcome,
  generateBoard,
  hasBingoLine,
  hasSubmittedAnswer,
  hitsterSlugSchema,
  isAvatarDataUrl,
  makeAccessCode,
  nicknameKey,
  normalizeHitsterSlug,
  pickRandomCategory,
  type HitsterColor,
  type HitsterLang,
  type HitsterRoundPhase,
  type HitsterSide,
  type HitsterStatus,
} from "./hitster";

const uuid = z.string().uuid();
const tokenS = z.string().min(10).max(80);
const colorS = z.enum(["green", "pink", "yellow", "purple", "blue"]);
const sideS = z.enum(["A", "B"]);
const langS = z.enum(["es", "ca", "en"]);

async function dbClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

function check<T = any>(r: { data: T; error: any }): T {
  if (r.error) throw new Error(r.error.code === "23505" ? "Ese valor ya está en uso." : r.error.message);
  return r.data;
}

async function assertSuperAdmin(context: { supabase: any; userId: string }) {
  const { data: role, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error || !role) throw new Error("Esta zona es solo para administradores.");
  return dbClient();
}

/** Authorizes either a logged-in super_admin or an invited collaborator with a valid token for this game. */
async function assertHost(gameId: string, collabToken?: string): Promise<{ db: any; isAdmin: boolean }> {
  const db = await dbClient();
  if (collabToken) {
    const collab = check(
      await db.from("hitster_collaborators").select("id,game_id").eq("token", collabToken).maybeSingle(),
    ) as { id: string; game_id: string } | null;
    if (!collab || collab.game_id !== gameId) throw new Error("Enlace de colaborador no válido.");
    return { db, isAdmin: false };
  }
  const auth = getRequestHeader("authorization") ?? "";
  const jwt = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!jwt) throw new Error("No autorizado.");
  const { data: userData, error: userErr } = await db.auth.getUser(jwt);
  if (userErr || !userData?.user?.id) throw new Error("Sesión no válida.");
  const { data: role } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "super_admin")
    .maybeSingle();
  if (!role) throw new Error("Solo administradores o colaboradores invitados.");
  return { db, isAdmin: true };
}

async function finalizeRoundIfOpen(db: any, game: any): Promise<any> {
  if (!game.current_round_id) return game;
  const round = check(
    await db.from("hitster_rounds").select("*").eq("id", game.current_round_id).maybeSingle(),
  ) as any;
  if (!round || round.phase === "closed") return game;

  check(await db.from("hitster_rounds").update({ phase: "closed" }).eq("id", round.id));

  const [participants, answers] = await Promise.all([
    db.from("hitster_participants").select("id,marks").eq("game_id", game.id).then(check),
    db.from("hitster_answers").select("participant_id,is_correct").eq("round_id", round.id).then(check),
  ]);

  const roundCorrectIds = (answers as any[]).filter((a) => a.is_correct === true).map((a) => a.participant_id as string);
  const outcome = evaluateGameOutcome({
    status: game.status as HitsterStatus,
    participants: (participants as any[]).map((p) => ({
      id: p.id as string,
      marks: Array.isArray(p.marks) ? (p.marks as boolean[]) : emptyMarks(),
    })),
    tiebreakIds: (game.tiebreak_participant_ids ?? []) as string[],
    roundCorrectIds,
  });

  const updated = check(
    await db
      .from("hitster_games")
      .update({
        status: outcome.status,
        winner_participant_ids: outcome.winnerIds,
        tiebreak_participant_ids: outcome.tiebreakIds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", game.id)
      .select("*")
      .single(),
  );
  return updated;
}

// ================= Super Admin CRUD =================

export const hitsterAdminList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertSuperAdmin(context);
    const rows = check(
      await db
        .from("hitster_games")
        .select("id,title,slug,side,status,timer_seconds,created_at,hitster_participants(count)")
        .order("created_at", { ascending: false }),
    ) as any[];
    return rows.map((r) => ({
      id: r.id as string,
      title: r.title as string,
      slug: r.slug as string,
      side: r.side as HitsterSide,
      status: r.status as HitsterStatus,
      timer_seconds: r.timer_seconds as number,
      created_at: r.created_at as string,
      participants: (r.hitster_participants?.[0]?.count ?? 0) as number,
    }));
  });

export const hitsterAdminCreate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; slug?: string; side?: HitsterSide; timer_seconds?: number }) =>
    z
      .object({
        title: z.string().trim().min(1).max(120),
        slug: hitsterSlugSchema,
        side: sideS.default("A"),
        timer_seconds: z.number().int().min(5).max(300).default(30),
      })
      .parse({
        title: d.title,
        slug: normalizeHitsterSlug(d.slug || d.title),
        side: d.side ?? "A",
        timer_seconds: d.timer_seconds ?? 30,
      }),
  )
  .handler(async ({ data, context }) => {
    const db = await assertSuperAdmin(context);
    const row = check(
      await db
        .from("hitster_games")
        .insert({ title: data.title, slug: data.slug, side: data.side, timer_seconds: data.timer_seconds })
        .select("id")
        .single(),
    ) as { id: string };
    return row;
  });

export const hitsterAdminDuplicate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertSuperAdmin(context);
    const src = check(await db.from("hitster_games").select("*").eq("id", data.id).single()) as any;
    let slug = normalizeHitsterSlug(`${src.slug}-copia`).slice(0, 42);
    const taken = check(await db.from("hitster_games").select("slug").like("slug", `${slug}%`)) as any[];
    if (taken.length) slug = `${slug}-${taken.length + 1}`;
    const row = check(
      await db
        .from("hitster_games")
        .insert({
          title: `${src.title} (copia)`,
          slug,
          side: src.side,
          timer_seconds: src.timer_seconds,
          status: "draft",
        })
        .select("id")
        .single(),
    ) as { id: string };
    return row;
  });

export const hitsterAdminDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertSuperAdmin(context);
    check(await db.from("hitster_games").delete().eq("id", data.id));
    return { ok: true };
  });

export const hitsterAdminInviteCollaborator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { gameId: string; email: string }) =>
    z.object({ gameId: uuid, email: z.string().trim().toLowerCase().email("Correo no válido.") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await assertSuperAdmin(context);
    const game = check(await db.from("hitster_games").select("id,title,slug").eq("id", data.gameId).single()) as any;
    const existing = check(
      await db
        .from("hitster_collaborators")
        .select("id,email,token,invited_at")
        .eq("game_id", data.gameId)
        .eq("email", data.email)
        .maybeSingle(),
    ) as any;

    const collab =
      existing ??
      check(
        await db
          .from("hitster_collaborators")
          .insert({
            game_id: data.gameId,
            email: data.email,
            token: crypto.randomUUID().replace(/-/g, ""),
          })
          .select("id,email,token,invited_at")
          .single(),
      );

    const baseUrl = (process.env["PUBLIC_APP_URL"] ?? "https://kleff.es").replace(/\/$/, "");
    const hostUrl = `${baseUrl}/hitster-host/${collab.token}`;

    let emailSent = false;
    let emailError: string | null = null;
    try {
      const { sendEmail } = await import("@/lib/email/send.server");
      const safeTitle = String(game.title).replace(/[<>&"]/g, "");
      await sendEmail({
        to: data.email,
        subject: `Invitación para gestionar Hitster: ${safeTitle}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;padding:24px;color:#1f2937;">
            <h2 style="margin:0 0 12px;">Te han invitado a gestionar una partida de Hitster</h2>
            <p style="margin:0 0 16px;">Puedes controlar las rondas, el temporizador y el progreso de los jugadores de <strong>${safeTitle}</strong> desde este enlace directo (no necesitas iniciar sesión):</p>
            <p style="margin:24px 0;">
              <a href="${hostUrl}" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Abrir panel de la partida</a>
            </p>
            <p style="font-size:12px;color:#6b7280;">O copia este enlace en tu navegador:<br/>${hostUrl}</p>
          </div>
        `,
        text: `Te han invitado a gestionar la partida de Hitster "${safeTitle}". Abre este enlace: ${hostUrl}`,
      });
      emailSent = true;
    } catch (err) {
      emailError = err instanceof Error ? err.message : "No se pudo enviar el correo.";
    }

    return { collaborator: collab as { id: string; email: string; token: string; invited_at: string }, hostUrl, emailSent, emailError };
  });

export const hitsterAdminRemoveCollaborator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertSuperAdmin(context);
    check(await db.from("hitster_collaborators").delete().eq("id", data.id));
    return { ok: true };
  });

// ================= Host (Super Admin OR Collaborator) =================

export const hitsterCollabResolve = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => z.object({ token: tokenS }).parse(d))
  .handler(async ({ data }) => {
    const db = await dbClient();
    const collab = check(
      await db.from("hitster_collaborators").select("game_id,email").eq("token", data.token).maybeSingle(),
    ) as { game_id: string; email: string } | null;
    if (!collab) return null;
    return collab;
  });

export const hitsterHostGet = createServerFn({ method: "GET" })
  .inputValidator((d: { gameId: string; collabToken?: string }) =>
    z.object({ gameId: uuid, collabToken: tokenS.optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { db, isAdmin } = await assertHost(data.gameId, data.collabToken);
    const game = check(await db.from("hitster_games").select("*").eq("id", data.gameId).single()) as any;
    const [participants, rounds, collaborators] = await Promise.all([
      db.from("hitster_participants").select("id,nickname,avatar_url,access_code,language,board,marks,created_at").eq("game_id", data.gameId).order("created_at").then(check),
      db.from("hitster_rounds").select("*").eq("game_id", data.gameId).order("round_number", { ascending: false }).limit(20).then(check),
      isAdmin
        ? db.from("hitster_collaborators").select("id,email,token,invited_at").eq("game_id", data.gameId).order("invited_at", { ascending: false }).then(check)
        : Promise.resolve([]),
    ]);

    const currentRound = (rounds as any[]).find((r) => r.id === game.current_round_id) ?? null;
    const answers = currentRound
      ? (check(await db.from("hitster_answers").select("*").eq("round_id", currentRound.id)) as any[])
      : [];
    const answerByP = new Map(answers.map((a) => [a.participant_id as string, a]));
    const now = Date.now();

    return {
      isAdmin,
      serverNow: now,
      game: {
        id: game.id as string,
        title: game.title as string,
        slug: game.slug as string,
        side: game.side as HitsterSide,
        status: game.status as HitsterStatus,
        timer_seconds: game.timer_seconds as number,
        current_round_id: game.current_round_id as string | null,
        play_number: game.play_number as number,
        winner_participant_ids: (game.winner_participant_ids ?? []) as string[],
        tiebreak_participant_ids: (game.tiebreak_participant_ids ?? []) as string[],
      },
      currentRound: currentRound
        ? {
            id: currentRound.id as string,
            round_number: Number(currentRound.round_number) - Number(game.round_offset ?? 0),
            category_key: currentRound.category_key as HitsterColor,
            phase: currentRound.phase as HitsterRoundPhase,
            started_at: currentRound.started_at as string,
            ends_at: currentRound.ends_at as string,
            remaining_ms: Math.max(0, new Date(currentRound.ends_at).getTime() - now),
          }
        : null,
      roundsCount: (rounds as any[]).length,
      participants: (participants as any[]).map((p) => {
        const marks = Array.isArray(p.marks) ? (p.marks as boolean[]) : emptyMarks();
        const a = answerByP.get(p.id);
        return {
          id: p.id as string,
          nickname: p.nickname as string,
          avatar_url: p.avatar_url as string,
          access_code: p.access_code as string,
          language: p.language as HitsterLang,
          board: p.board as HitsterColor[],
          marks,
          marksCount: marks.filter(Boolean).length,
          hasLine: hasBingoLine(marks) !== null,
          answer: a
            ? {
                answer_text: a.answer_text as string,
                is_correct: a.is_correct as boolean | null,
                is_exact_year: Boolean(a.is_exact_year),
                marked_cell: a.marked_cell as number | null,
                punished_participant_id: a.punished_participant_id as string | null,
              }
            : null,
        };
      }),
      collaborators: collaborators as { id: string; email: string; token: string; invited_at: string }[],
    };
  });

export const hitsterHostUpdateSettings = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { gameId: string; collabToken?: string; title?: string; slug?: string; side?: HitsterSide; timer_seconds?: number }) =>
      z
        .object({
          gameId: uuid,
          collabToken: tokenS.optional(),
          title: z.string().trim().min(1).max(120).optional(),
          slug: hitsterSlugSchema.optional(),
          side: sideS.optional(),
          timer_seconds: z.number().int().min(5).max(300).optional(),
        })
        .parse({
          ...d,
          slug: d.slug !== undefined ? normalizeHitsterSlug(d.slug) : undefined,
        }),
  )
  .handler(async ({ data }) => {
    const { db } = await assertHost(data.gameId, data.collabToken);
    const game = check(await db.from("hitster_games").select("status").eq("id", data.gameId).single()) as any;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) patch["title"] = data.title;
    if (data.slug !== undefined) patch["slug"] = data.slug;
    if (data.timer_seconds !== undefined) patch["timer_seconds"] = data.timer_seconds;
    if (data.side !== undefined && game.status === "draft") patch["side"] = data.side;
    check(await db.from("hitster_games").update(patch).eq("id", data.gameId));
    return { ok: true };
  });

export const hitsterHostStartGame = createServerFn({ method: "POST" })
  .inputValidator((d: { gameId: string; collabToken?: string }) =>
    z.object({ gameId: uuid, collabToken: tokenS.optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await assertHost(data.gameId, data.collabToken);
    check(
      await db
        .from("hitster_games")
        .update({ status: "playing", updated_at: new Date().toISOString() })
        .eq("id", data.gameId)
        .eq("status", "draft"),
    );
    return { ok: true };
  });

export const hitsterHostRestartGame = createServerFn({ method: "POST" })
  .inputValidator((d: { gameId: string; playNumber: number; collabToken?: string }) =>
    z.object({ gameId: uuid, playNumber: z.number().int().positive(), collabToken: tokenS.optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await assertHost(data.gameId, data.collabToken);
    check(await db.rpc("hitster_restart_game", { p_game_id: data.gameId, p_expected_play: data.playNumber }));
    return { ok: true };
  });

export const hitsterHostAnswerHistory = createServerFn({ method: "GET" })
  .inputValidator((d: { gameId: string; participantId: string; collabToken?: string }) =>
    z.object({ gameId: uuid, participantId: uuid, collabToken: tokenS.optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await assertHost(data.gameId, data.collabToken);
    const rows = check(await db.from("hitster_answers")
      .select("answer_text,is_correct,is_exact_year,marked_cell,created_at,hitster_rounds!inner(round_number,category_key,play_number)")
      .eq("game_id", data.gameId).eq("participant_id", data.participantId)
      .order("created_at", { ascending: false })) as any[];
    const rounds = check(await db.from("hitster_rounds").select("round_number,play_number")
      .eq("game_id", data.gameId).order("round_number")) as { round_number: number; play_number: number }[];
    const first = new Map<number, number>();
    for (const r of rounds) if (!first.has(r.play_number)) first.set(r.play_number, r.round_number);
    return rows.map((a) => ({
      answer_text: String(a.answer_text),
      is_correct: a.is_correct as boolean | null,
      is_exact_year: Boolean(a.is_exact_year),
      marked_cell: a.marked_cell as number | null,
      created_at: String(a.created_at),
      category_key: a.hitster_rounds.category_key as HitsterColor,
      play_number: Number(a.hitster_rounds.play_number),
      round_number: Number(a.hitster_rounds.round_number) - (first.get(a.hitster_rounds.play_number) ?? 1) + 1,
    }));
  });

export const hitsterHostTriggerCategory = createServerFn({ method: "POST" })
  .inputValidator((d: { gameId: string; collabToken?: string; category?: HitsterColor }) =>
    z.object({ gameId: uuid, collabToken: tokenS.optional(), category: colorS.optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await assertHost(data.gameId, data.collabToken);
    let game = check(await db.from("hitster_games").select("*").eq("id", data.gameId).single()) as any;
    if (game.status === "draft") throw new Error("Pulsa Empezar partida antes de disparar una categoría.");
    if (game.status === "finished") throw new Error("La partida ya tiene ganador.");

    // Close previous open round and evaluate victory/tiebreak before starting a new one.
    game = await finalizeRoundIfOpen(db, game);
    if (game.status === "finished") {
      return { finished: true, status: game.status as HitsterStatus, round: null };
    }

    const lastRound = check(
      await db.from("hitster_rounds").select("round_number,category_key").eq("game_id", game.id).order("round_number", { ascending: false }).limit(1).maybeSingle(),
    ) as { round_number: number; category_key: HitsterColor } | null;

    const category = data.category ?? pickRandomCategory(lastRound?.category_key ?? null);
    const now = new Date();
    const endsAt = new Date(now.getTime() + Number(game.timer_seconds ?? 30) * 1000);

    const round = check(
      await db
        .from("hitster_rounds")
        .insert({
          game_id: game.id,
          round_number: (lastRound?.round_number ?? 0) + 1,
          play_number: game.play_number,
          category_key: category,
          phase: "answering",
          started_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
        })
        .select("*")
        .single(),
    );

    check(
      await db
        .from("hitster_games")
        .update({ current_round_id: round.id, updated_at: now.toISOString() })
        .eq("id", game.id),
    );

    return { finished: false, status: game.status as HitsterStatus, round };
  });

export const hitsterHostRevealAnswer = createServerFn({ method: "POST" })
  .inputValidator((d: { gameId: string; collabToken?: string }) =>
    z.object({ gameId: uuid, collabToken: tokenS.optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await assertHost(data.gameId, data.collabToken);
    const game = check(await db.from("hitster_games").select("current_round_id").eq("id", data.gameId).single()) as any;
    if (!game.current_round_id) throw new Error("No hay ninguna ronda activa.");
    check(
      await db
        .from("hitster_rounds")
        .update({ phase: "validating", revealed_at: new Date().toISOString() })
        .eq("id", game.current_round_id),
    );
    return { ok: true };
  });

export const hitsterHostCloseRound = createServerFn({ method: "POST" })
  .inputValidator((d: { gameId: string; collabToken?: string }) =>
    z.object({ gameId: uuid, collabToken: tokenS.optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await assertHost(data.gameId, data.collabToken);
    const game = check(await db.from("hitster_games").select("*").eq("id", data.gameId).single()) as any;
    const updated = await finalizeRoundIfOpen(db, game);
    return { status: updated.status as HitsterStatus, winnerIds: (updated.winner_participant_ids ?? []) as string[], tiebreakIds: (updated.tiebreak_participant_ids ?? []) as string[] };
  });

export const hitsterHostDeleteParticipant = createServerFn({ method: "POST" })
  .inputValidator((d: { gameId: string; participantId: string; collabToken?: string }) =>
    z.object({ gameId: uuid, participantId: uuid, collabToken: tokenS.optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await assertHost(data.gameId, data.collabToken);
    check(await db.from("hitster_participants").delete().eq("id", data.participantId).eq("game_id", data.gameId));
    return { ok: true };
  });

// ================= Public / Player =================

export const hitsterResolveSlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const db = await dbClient();
    const { data: row } = await db.from("hitster_games").select("slug").eq("slug", data.slug).maybeSingle();
    return row ? { slug: row.slug as string } : null;
  });

export const hitsterPublicGame = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const db = await dbClient();
    const game = check(
      await db.from("hitster_games").select("id,title,slug,side,status,timer_seconds").eq("slug", data.slug).maybeSingle(),
    ) as any;
    if (!game) return null;
    return {
      id: game.id as string,
      title: game.title as string,
      slug: game.slug as string,
      side: game.side as HitsterSide,
      status: game.status as HitsterStatus,
      timer_seconds: game.timer_seconds as number,
    };
  });

export const hitsterJoin = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string; nickname: string; avatar_url: string; language?: HitsterLang }) =>
    z
      .object({
        slug: z.string().min(1).max(60),
        nickname: z.string().trim().min(2, "Mínimo 2 caracteres.").max(30, "Máximo 30 caracteres."),
        avatar_url: z.string().refine(isAvatarDataUrl, "Avatar no válido."),
        language: langS.default("es"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await dbClient();
    const game = check(await db.from("hitster_games").select("id,status").eq("slug", data.slug).maybeSingle()) as any;
    if (!game) throw new Error("Partida no encontrada.");
    if (game.status === "finished") throw new Error("Esta partida ya ha terminado.");

    const token = crypto.randomUUID().replace(/-/g, "");
    const access_code = makeAccessCode(6);
    const board = generateBoard();
    const marks = emptyMarks();

    const p = check(
      await db
        .from("hitster_participants")
        .insert({
          game_id: game.id,
          nickname: data.nickname,
          nickname_key: nicknameKey(data.nickname),
          avatar_url: data.avatar_url,
          token,
          access_code,
          language: data.language,
          board,
          marks,
        })
        .select("id,nickname,avatar_url,token,access_code,language")
        .single(),
    );
    return p as { id: string; nickname: string; avatar_url: string; token: string; access_code: string; language: HitsterLang };
  });

export const hitsterRecover = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string; code: string }) =>
    z.object({ slug: z.string().min(1).max(60), code: z.string().trim().toUpperCase().min(4).max(12) }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = await dbClient();
    const game = check(await db.from("hitster_games").select("id").eq("slug", data.slug).maybeSingle()) as any;
    if (!game) throw new Error("Partida no encontrada.");
    const p = check(
      await db
        .from("hitster_participants")
        .select("id,nickname,avatar_url,token,access_code,language")
        .eq("game_id", game.id)
        .eq("access_code", data.code)
        .maybeSingle(),
    ) as any;
    if (!p) throw new Error("Código no encontrado.");
    return p as { id: string; nickname: string; avatar_url: string; token: string; access_code: string; language: HitsterLang };
  });

export const hitsterSetLanguage = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; language: HitsterLang }) => z.object({ token: tokenS, language: langS }).parse(d))
  .handler(async ({ data }) => {
    const db = await dbClient();
    check(await db.from("hitster_participants").update({ language: data.language }).eq("token", data.token));
    return { ok: true };
  });

export const hitsterPlayerState = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => z.object({ token: tokenS }).parse(d))
  .handler(async ({ data }) => {
    const db = await dbClient();
    const me = check(await db.from("hitster_participants").select("*").eq("token", data.token).maybeSingle()) as any;
    if (!me) return null;

    const [game, others] = await Promise.all([
      db.from("hitster_games").select("*").eq("id", me.game_id).single().then(check),
      db.from("hitster_participants").select("id,nickname,avatar_url,board,marks").eq("game_id", me.game_id).order("created_at").then(check),
    ]);

    const currentRound = game.current_round_id
      ? (check(await db.from("hitster_rounds").select("*").eq("id", game.current_round_id).maybeSingle()) as any)
      : null;

    const myAnswer = currentRound
      ? (check(
          await db
            .from("hitster_answers")
            .select("*")
            .eq("round_id", currentRound.id)
            .eq("participant_id", me.id)
            .maybeSingle(),
        ) as any)
      : null;

    const now = Date.now();
    const myMarks = Array.isArray(me.marks) ? (me.marks as boolean[]) : emptyMarks();

    return {
      serverNow: now,
      game: {
        id: game.id as string,
        title: game.title as string,
        slug: game.slug as string,
        side: game.side as HitsterSide,
        status: game.status as HitsterStatus,
        timer_seconds: game.timer_seconds as number,
        winner_participant_ids: (game.winner_participant_ids ?? []) as string[],
        tiebreak_participant_ids: (game.tiebreak_participant_ids ?? []) as string[],
      },
      me: {
        id: me.id as string,
        nickname: me.nickname as string,
        avatar_url: me.avatar_url as string,
        access_code: me.access_code as string,
        language: me.language as HitsterLang,
        board: me.board as HitsterColor[],
        marks: myMarks,
        winningLine: hasBingoLine(myMarks),
      },
      currentRound: currentRound
        ? {
            id: currentRound.id as string,
            round_number: Number(currentRound.round_number) - Number(game.round_offset ?? 0),
            category_key: currentRound.category_key as HitsterColor,
            phase: currentRound.phase as HitsterRoundPhase,
            ends_at: currentRound.ends_at as string,
            remaining_ms: Math.max(0, new Date(currentRound.ends_at).getTime() - now),
          }
        : null,
      myAnswer: myAnswer
        ? {
            answer_text: myAnswer.answer_text as string,
            is_correct: myAnswer.is_correct as boolean | null,
            is_exact_year: Boolean(myAnswer.is_exact_year),
            marked_cell: myAnswer.marked_cell as number | null,
            punished_participant_id: myAnswer.punished_participant_id as string | null,
            punished_cell: myAnswer.punished_cell as number | null,
          }
        : null,
      participants: (others as any[]).map((p) => {
        const marks = Array.isArray(p.marks) ? (p.marks as boolean[]) : emptyMarks();
        return {
          id: p.id as string,
          nickname: p.nickname as string,
          avatar_url: p.avatar_url as string,
          board: p.board as HitsterColor[],
          marks,
          marksCount: marks.filter(Boolean).length,
          hasLine: hasBingoLine(marks) !== null,
        };
      }),
    };
  });

export const hitsterSubmitAnswer = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; roundId: string; answer_text: string }) =>
    z
      .object({
        token: tokenS,
        roundId: uuid,
        answer_text: z.string().trim().min(1, "Escribe una respuesta antes de guardar.").max(200),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await dbClient();
    const me = check(await db.from("hitster_participants").select("id,game_id").eq("token", data.token).maybeSingle()) as any;
    if (!me) throw new Error("Sesión no encontrada.");
    const round = check(await db.from("hitster_rounds").select("*").eq("id", data.roundId).eq("game_id", me.game_id).maybeSingle()) as any;
    if (!round || round.phase !== "answering") throw new Error("El tiempo para responder ha terminado.");
    if (Date.now() > new Date(round.ends_at).getTime() + 1500) throw new Error("El tiempo se ha agotado.");

    check(
      await db
        .from("hitster_answers")
        .upsert(
          {
            game_id: me.game_id,
            round_id: round.id,
            participant_id: me.id,
            answer_text: data.answer_text,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "round_id,participant_id" },
        ),
    );
    return { ok: true };
  });

export const hitsterValidateAnswer = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; roundId: string; is_correct: boolean; is_exact_year?: boolean }) =>
    z
      .object({
        token: tokenS,
        roundId: uuid,
        is_correct: z.boolean(),
        is_exact_year: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await dbClient();
    const me = check(await db.from("hitster_participants").select("id,game_id").eq("token", data.token).maybeSingle()) as any;
    if (!me) throw new Error("Sesión no encontrada.");
    const [game, round, existing] = await Promise.all([
      db.from("hitster_games").select("side,status,tiebreak_participant_ids").eq("id", me.game_id).single().then(check),
      db.from("hitster_rounds").select("*").eq("id", data.roundId).eq("game_id", me.game_id).maybeSingle().then(check),
      db.from("hitster_answers").select("id,answer_text").eq("round_id", data.roundId).eq("participant_id", me.id).maybeSingle().then(check),
    ]);
    if (!round || round.phase !== "validating") throw new Error("Aún no se puede validar esta ronda.");
    if (game.status === "tiebreak" && !(game.tiebreak_participant_ids as string[]).includes(me.id)) {
      throw new Error("Solo los jugadores empatados compiten en el desempate.");
    }
    if (!hasSubmittedAnswer(existing)) {
      throw new Error("No enviaste respuesta en esta ronda.");
    }

    const cat = HITSTER_CATEGORIES[game.side as HitsterSide][round.category_key as HitsterColor];
    const exact = data.is_correct && data.is_exact_year && cat.allowExactBonus && game.status !== "tiebreak";

    check(
      await db
        .from("hitster_answers")
        .update({
          is_correct: data.is_correct,
          is_exact_year: exact,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id),
    );
    return { ok: true, is_exact_year: exact };
  });

export const hitsterMarkCell = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; roundId: string; cellIndex: number }) =>
    z.object({ token: tokenS, roundId: uuid, cellIndex: z.number().int().min(0).max(24) }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = await dbClient();
    const me = check(await db.from("hitster_participants").select("*").eq("token", data.token).maybeSingle()) as any;
    if (!me) throw new Error("Sesión no encontrada.");
    const [round, ans] = await Promise.all([
      db.from("hitster_rounds").select("*").eq("id", data.roundId).eq("game_id", me.game_id).maybeSingle().then(check),
      db.from("hitster_answers").select("*").eq("round_id", data.roundId).eq("participant_id", me.id).maybeSingle().then(check),
    ]);
    if (!round || round.phase !== "validating") throw new Error("Esta ronda no permite marcar casillas ahora.");
    if (!hasSubmittedAnswer(ans) || ans.is_correct !== true) {
      throw new Error("Primero valida tu respuesta como correcta.");
    }
    if (ans.marked_cell !== null) throw new Error("Ya has marcado una casilla en esta ronda.");

    const board = me.board as HitsterColor[];
    const marks = Array.isArray(me.marks) ? [...(me.marks as boolean[])] : emptyMarks();
    if (board[data.cellIndex] !== round.category_key) throw new Error("Solo puedes marcar una casilla del color activo.");
    if (marks[data.cellIndex]) throw new Error("Esa casilla ya está marcada.");

    marks[data.cellIndex] = true;
    check(await db.from("hitster_participants").update({ marks }).eq("id", me.id));
    check(await db.from("hitster_answers").update({ marked_cell: data.cellIndex, updated_at: new Date().toISOString() }).eq("id", ans.id));
    return { ok: true, hasLine: hasBingoLine(marks) !== null };
  });

export const hitsterPunishRival = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; roundId: string; rivalId: string; cellIndex: number }) =>
    z.object({ token: tokenS, roundId: uuid, rivalId: uuid, cellIndex: z.number().int().min(0).max(24) }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = await dbClient();
    const me = check(await db.from("hitster_participants").select("id,game_id").eq("token", data.token).maybeSingle()) as any;
    if (!me) throw new Error("Sesión no encontrada.");
    if (me.id === data.rivalId) throw new Error("Elige a otro jugador.");

    const [round, ans, rival] = await Promise.all([
      db.from("hitster_rounds").select("phase").eq("id", data.roundId).eq("game_id", me.game_id).maybeSingle().then(check),
      db.from("hitster_answers").select("*").eq("round_id", data.roundId).eq("participant_id", me.id).maybeSingle().then(check),
      db.from("hitster_participants").select("id,marks").eq("id", data.rivalId).eq("game_id", me.game_id).maybeSingle().then(check),
    ]);
    if (!round || round.phase !== "validating") throw new Error("Ya no se puede aplicar el castigo en esta ronda.");
    if (!ans || !ans.is_exact_year) throw new Error("No tienes bonificación de año exacto en esta ronda.");
    if (ans.punished_participant_id) throw new Error("Ya has usado tu bonificación en esta ronda.");
    if (!rival) throw new Error("Rival no encontrado.");

    const rivalMarks = Array.isArray(rival.marks) ? [...(rival.marks as boolean[])] : emptyMarks();
    if (!rivalMarks[data.cellIndex]) throw new Error("Esa casilla del rival no tiene cruz.");
    rivalMarks[data.cellIndex] = false;

    check(await db.from("hitster_participants").update({ marks: rivalMarks }).eq("id", rival.id));
    check(
      await db
        .from("hitster_answers")
        .update({ punished_participant_id: rival.id, punished_cell: data.cellIndex, updated_at: new Date().toISOString() })
        .eq("id", ans.id),
    );
    return { ok: true };
  });