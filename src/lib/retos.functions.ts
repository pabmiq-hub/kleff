import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { defaultMissions, isAvatarDataUrl, makeAccessCode, nicknameKey, normalizeRetoSlug, pickMissions, pickTicket, retoSlugSchema } from "./retos";

async function admin(context: { supabase: any; userId: string }) {
  const { data: role, error } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "super_admin").maybeSingle();
  if (error || !role) throw new Error("Esta zona es solo para administradores.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}
async function pub() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}
function check<T = any>(r: { data: T; error: any }): T {
  if (r.error) throw new Error(r.error.code === "23505" ? "Ese nombre ya está en uso." : r.error.message);
  return r.data;
}
const uuid = z.string().uuid();
const tokenS = z.string().min(10).max(80);

async function award(db: any, eventId: string, participantId: string, count: number, source: string, completionId: string | null) {
  if (count <= 0) return [] as number[];
  return check(await db.rpc("reto_award_tickets", { _event: eventId, _participant: participantId, _count: count, _source: source, _completion: completionId })) as number[];
}

// ================= Admin =================
const eventInput = z.object({
  title: z.string().trim().min(1).max(120),
  slug: retoSlugSchema,
  event_date: z.string().max(40).nullish(),
  location: z.string().trim().max(200).nullish(),
  cover_url: z.string().url().max(1000).nullish().or(z.literal("")),
  status: z.enum(["draft", "open", "closed"]).default("open"),
  social_accounts: z.array(z.string().trim().min(1).max(60)).max(10).default(["kleff.bcn"]),
  connection_per_person: z.number().int().min(0).max(10).default(3),
});
const cleanEvent = (d: z.infer<typeof eventInput>) => ({
  ...d, cover_url: d.cover_url || null, location: d.location || null, event_date: d.event_date || null,
  social_accounts: d.social_accounts.map((a) => a.replace(/^@/, "")),
});

export const retosAdminList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context);
    const rows = check(await db.from("reto_events").select("id,title,slug,event_date,location,cover_url,status,created_at,reto_participants(count)").order("created_at", { ascending: false })) as any[];
    return rows.map((r) => ({ id: r.id as string, title: r.title as string, slug: r.slug as string, event_date: r.event_date as string | null, location: r.location as string | null, cover_url: r.cover_url as string | null, status: r.status as string, participants: (r.reto_participants?.[0]?.count ?? 0) as number }));
  });

export const retosAdminCreate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; slug?: string }) => z.object({ title: z.string().trim().min(1).max(120), slug: retoSlugSchema }).parse({ title: d.title, slug: normalizeRetoSlug(d.slug || d.title) }))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const ev = check(await db.from("reto_events").insert({ title: data.title, slug: data.slug }).select("id").single()) as { id: string };
    check(await db.from("reto_missions").insert(defaultMissions().map((m, i) => ({ ...m, event_id: ev.id, sort_order: i }))));
    return ev;
  });

export const retosAdminDuplicate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const src = check(await db.from("reto_events").select("*").eq("id", data.id).single()) as any;
    let slug = normalizeRetoSlug(`${src.slug}-copia`).slice(0, 40);
    const taken = check(await db.from("reto_events").select("slug").like("slug", `${slug}%`)) as any[];
    if (taken.length) slug = `${slug}-${taken.length + 1}`;
    const ev = check(await db.from("reto_events").insert({ title: `${src.title} (copia)`, slug, event_date: src.event_date, location: src.location, cover_url: src.cover_url, status: "draft", social_accounts: src.social_accounts, connection_per_person: src.connection_per_person }).select("id").single()) as any;
    const ms = check(await db.from("reto_missions").select("category,kind,title,tickets,active,sort_order").eq("event_id", data.id)) as any[];
    if (ms.length) check(await db.from("reto_missions").insert(ms.map((m) => ({ ...m, event_id: ev.id }))));
    return { id: ev.id as string };
  });

export const retosAdminDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    check(await db.from("reto_events").delete().eq("id", data.id));
    return { ok: true };
  });

export const retosAdminGet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const [ev, ms, ps, cs, ts, ds] = await Promise.all([
      db.from("reto_events").select("*").eq("id", data.id).single(),
      db.from("reto_missions").select("id,category,kind,title,tickets,active,sort_order").eq("event_id", data.id).order("sort_order"),
      db.from("reto_participants").select("id,nickname,avatar_url,extra_tickets,created_at,access_code").eq("event_id", data.id).order("created_at"),
      db.from("reto_completions").select("id,mission_id,participant_id,partner_ids,evidence,status,created_at").eq("event_id", data.id).order("created_at", { ascending: false }),
      db.from("reto_tickets").select("id,participant_id,number,source").eq("event_id", data.id).order("number"),
      db.from("reto_draws").select("id,ticket_id,prize,created_at").eq("event_id", data.id).order("created_at"),
    ]);
    const event = check(ev) as any;
    return {
      event: { id: event.id, title: event.title, slug: event.slug, event_date: event.event_date, location: event.location, cover_url: event.cover_url, status: event.status, social_accounts: event.social_accounts as string[], connection_per_person: event.connection_per_person as number },
      missions: check(ms) as { id: string; category: string; kind: string; title: string; tickets: number; active: boolean; sort_order: number }[],
      participants: check(ps) as { id: string; nickname: string; avatar_url: string | null; extra_tickets: number; created_at: string; access_code: string }[],
      completions: check(cs) as { id: string; mission_id: string; participant_id: string; partner_ids: string[]; evidence: string | null; status: string; created_at: string }[],
      tickets: check(ts) as { id: string; participant_id: string; number: number; source: string }[],
      draws: check(ds) as { id: string; ticket_id: string; prize: string | null; created_at: string }[],
    };
  });

export const retosAdminUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => eventInput.extend({ id: uuid }).parse({ ...(d as any), slug: normalizeRetoSlug((d as any)?.slug ?? "") }))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { id, ...rest } = data;
    check(await db.from("reto_events").update(cleanEvent(rest)).eq("id", id));
    return { ok: true };
  });

export const retosAdminSaveMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ eventId: uuid, id: uuid.nullish(), category: z.enum(["social", "conexion"]), title: z.string().trim().min(3).max(400), tickets: z.number().int().min(0).max(100), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const row = { title: data.title, tickets: data.tickets, active: data.active };
    if (data.id) check(await db.from("reto_missions").update(row).eq("id", data.id).eq("event_id", data.eventId));
    else check(await db.from("reto_missions").insert({ ...row, event_id: data.eventId, category: data.category, kind: data.category === "conexion" ? "connection" : "custom", sort_order: 1000 + (Date.now() % 1e6) }));
    return { ok: true };
  });

export const retosAdminDeleteMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    check(await db.from("reto_missions").delete().eq("id", data.id));
    return { ok: true };
  });

export const retosAdminExtraTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { participantId: string; count: number }) => z.object({ participantId: uuid, count: z.number().int().min(1).max(50) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const p = check(await db.from("reto_participants").select("id,event_id,extra_tickets").eq("id", data.participantId).single()) as any;
    const numbers = await award(db, p.event_id, p.id, data.count, "extra", null);
    check(await db.from("reto_participants").update({ extra_tickets: p.extra_tickets + data.count }).eq("id", p.id));
    return { numbers };
  });

export const retosAdminRejectCompletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    check(await db.from("reto_tickets").delete().eq("completion_id", data.id));
    check(await db.from("reto_completions").update({ status: "rejected", decided_at: new Date().toISOString() }).eq("id", data.id));
    return { ok: true };
  });

export const retosAdminDeleteParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    check(await db.from("reto_participants").delete().eq("id", data.id));
    return { ok: true };
  });

export const retosAdminDraw = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { eventId: string; prize?: string }) => z.object({ eventId: uuid, prize: z.string().trim().max(120).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const tickets = check(await db.from("reto_tickets").select("id,number,participant_id").eq("event_id", data.eventId)) as any[];
    const draws = check(await db.from("reto_draws").select("ticket_id").eq("event_id", data.eventId)) as any[];
    const t = pickTicket(tickets, new Set(draws.map((d) => d.ticket_id)));
    if (!t) throw new Error("No quedan números para sortear.");
    check(await db.from("reto_draws").insert({ event_id: data.eventId, ticket_id: t.id, prize: data.prize || null }));
    return { number: t.number as number, participantId: t.participant_id as string };
  });

export const retosAdminDeleteDraw = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    check(await db.from("reto_draws").delete().eq("id", data.id));
    return { ok: true };
  });

// ================= Público =================
export const retosResolveSlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().max(60) }).parse(d))
  .handler(async ({ data }) => {
    const db = await pub();
    const r = check(await db.from("reto_events").select("slug,status").eq("slug", data.slug.toLowerCase()).maybeSingle()) as any;
    return r && r.status !== "draft" ? { slug: r.slug as string } : null;
  });

export const retosPublicEvent = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().max(60) }).parse(d))
  .handler(async ({ data }) => {
    const db = await pub();
    const e = check(await db.from("reto_events").select("id,title,slug,event_date,location,cover_url,status").eq("slug", data.slug).maybeSingle()) as any;
    if (!e || e.status === "draft") return null;
    return { title: e.title as string, slug: e.slug as string, event_date: e.event_date as string | null, location: e.location as string | null, cover_url: e.cover_url as string | null, open: e.status === "open" };
  });

async function me(db: any, token: string) {
  const p = check(await db.from("reto_participants").select("id,event_id,nickname,avatar_url,access_code").eq("token", token).maybeSingle()) as any;
  if (!p) throw new Error("Tu acceso ha caducado. Vuelve a entrar con tu código.");
  return p as { id: string; event_id: string; nickname: string; avatar_url: string | null; access_code: string };
}

export const retosJoin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().max(60), nickname: z.string().trim().min(2).max(30), avatar: z.string().max(300_000) }).parse(d))
  .handler(async ({ data }) => {
    if (!isAvatarDataUrl(data.avatar)) throw new Error("Elige una imagen de perfil.");
    const db = await pub();
    const ev = check(await db.from("reto_events").select("id,status,connection_per_person").eq("slug", data.slug).maybeSingle()) as any;
    if (!ev || ev.status !== "open") throw new Error("Este reto no está abierto.");
    const key = nicknameKey(data.nickname);
    const dup = check(await db.from("reto_participants").select("id").eq("event_id", ev.id).eq("nickname_key", key).maybeSingle());
    if (dup) throw new Error("Ese pseudónimo ya está en uso. Prueba con otro.");
    let p: any = null;
    for (let i = 0; i < 5 && !p; i++) {
      const r = await db.from("reto_participants").insert({ event_id: ev.id, nickname: data.nickname, nickname_key: key, avatar_url: data.avatar, token: crypto.randomUUID() + crypto.randomUUID(), access_code: makeAccessCode() }).select("id,token,access_code").single();
      if (r.error?.code === "23505" && /nickname/.test(r.error.message)) throw new Error("Ese pseudónimo ya está en uso. Prueba con otro.");
      if (!r.error) p = r.data;
    }
    if (!p) throw new Error("No se ha podido crear tu perfil. Inténtalo de nuevo.");
    const pool = check(await db.from("reto_missions").select("id").eq("event_id", ev.id).eq("category", "conexion").eq("active", true)) as any[];
    const used = check(await db.from("reto_assignments").select("mission_id,reto_missions!inner(event_id)").eq("reto_missions.event_id", ev.id)) as any[];
    const usage = new Map<string, number>();
    for (const u of used) usage.set(u.mission_id, (usage.get(u.mission_id) ?? 0) + 1);
    const picks = pickMissions(pool, usage, ev.connection_per_person ?? 3);
    if (picks.length) check(await db.from("reto_assignments").insert(picks.map((m) => ({ participant_id: p.id, mission_id: m.id }))));
    return { token: p.token as string, accessCode: p.access_code as string };
  });

export const retosRecover = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().max(60), code: z.string().trim().min(4).max(12) }).parse(d))
  .handler(async ({ data }) => {
    const db = await pub();
    const ev = check(await db.from("reto_events").select("id").eq("slug", data.slug).maybeSingle()) as any;
    if (!ev) throw new Error("Reto no encontrado.");
    const p = check(await db.from("reto_participants").select("token").eq("event_id", ev.id).eq("access_code", data.code.toUpperCase().replace(/[^A-Z0-9]/g, "")).maybeSingle()) as any;
    if (!p) throw new Error("Código no válido.");
    return { token: p.token as string };
  });

export const retosDashboard = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => z.object({ token: tokenS }).parse(d))
  .handler(async ({ data }) => {
    const db = await pub();
    const p = await me(db, data.token);
    const [ev, ps, ms, as, cs, ts, ds, msgs] = await Promise.all([
      db.from("reto_events").select("title,slug,status,social_accounts,event_date,location").eq("id", p.event_id).single(),
      db.from("reto_participants").select("id,nickname,avatar_url").eq("event_id", p.event_id).order("nickname"),
      db.from("reto_missions").select("id,category,kind,title,tickets").eq("event_id", p.event_id).eq("active", true).order("sort_order"),
      db.from("reto_assignments").select("mission_id").eq("participant_id", p.id),
      db.from("reto_completions").select("id,mission_id,participant_id,partner_ids,status,evidence,created_at").eq("event_id", p.event_id).or(`participant_id.eq.${p.id},partner_ids.cs.{${p.id}}`),
      db.from("reto_tickets").select("id,number,source").eq("participant_id", p.id).order("number"),
      db.from("reto_draws").select("id,prize,created_at,reto_tickets(number,participant_id)").eq("event_id", p.event_id).order("created_at"),
      db.from("reto_messages").select("from_id,to_id,read_at").eq("event_id", p.event_id).or(`from_id.eq.${p.id},to_id.eq.${p.id}`),
    ]);
    const event = check(ev) as any;
    const assigned = new Set((check(as) as any[]).map((a) => a.mission_id));
    const allMissions = check(ms) as any[];
    const missions = allMissions.filter((m) => m.category === "social" || assigned.has(m.id));
    const completions = check(cs) as any[];
    const mine = completions.filter((c) => c.participant_id === p.id);
    const ludoyaTagged = completions.filter((c) => c.participant_id !== p.id && c.status === "confirmed");
    const toConfirm = completions.filter((c) => c.participant_id !== p.id && c.status === "pending");
    const unread = new Map<string, number>();
    for (const m of check(msgs) as any[]) if (m.to_id === p.id && !m.read_at) unread.set(m.from_id, (unread.get(m.from_id) ?? 0) + 1);
    const titleOf = new Map(allMissions.map((m) => [m.id, m.title]));
    return {
      me: { id: p.id, nickname: p.nickname, avatar_url: p.avatar_url, access_code: p.access_code },
      event: { title: event.title as string, slug: event.slug as string, open: event.status === "open", social_accounts: event.social_accounts as string[], event_date: event.event_date as string | null, location: event.location as string | null },
      participants: (check(ps) as any[]).map((x) => ({ id: x.id as string, nickname: x.nickname as string, avatar_url: x.avatar_url as string | null, unread: unread.get(x.id) ?? 0 })),
      missions: missions.map((m) => {
        const c = mine.find((x) => x.mission_id === m.id && x.status !== "rejected") ?? ludoyaTagged.find((x) => x.mission_id === m.id && m.kind === "ludoya");
        return { id: m.id as string, category: m.category as string, kind: m.kind as string, title: m.title as string, tickets: m.tickets as number, status: (c?.status ?? "todo") as "todo" | "pending" | "confirmed", partnerIds: (c?.partner_ids ?? []) as string[] };
      }),
      toConfirm: toConfirm.map((c) => ({ id: c.id as string, from: c.participant_id as string, title: (titleOf.get(c.mission_id) ?? "Misión") as string })),
      tickets: (check(ts) as any[]).map((t) => ({ number: t.number as number, source: t.source as string })),
      draws: (check(ds) as any[]).map((d) => ({ id: d.id as string, prize: d.prize as string | null, number: d.reto_tickets?.number as number, mine: d.reto_tickets?.participant_id === p.id })),
    };
  });

export const retosComplete = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: tokenS, missionId: uuid, partnerIds: z.array(uuid).max(10).default([]), evidence: z.string().trim().max(200).optional() }).parse(d))
  .handler(async ({ data }) => {
    const db = await pub();
    const p = await me(db, data.token);
    const ev = check(await db.from("reto_events").select("status").eq("id", p.event_id).single()) as any;
    if (ev.status !== "open") throw new Error("El reto está cerrado.");
    const m = check(await db.from("reto_missions").select("id,category,kind,tickets,active").eq("id", data.missionId).eq("event_id", p.event_id).maybeSingle()) as any;
    if (!m || !m.active) throw new Error("Misión no disponible.");
    if (m.category === "conexion") {
      const a = check(await db.from("reto_assignments").select("mission_id").eq("participant_id", p.id).eq("mission_id", m.id).maybeSingle());
      if (!a) throw new Error("Esta misión no es tuya.");
    }
    const partners = [...new Set(data.partnerIds)].filter((x) => x !== p.id);
    if (partners.length) {
      const ok = check(await db.from("reto_participants").select("id").eq("event_id", p.event_id).in("id", partners)) as any[];
      if (ok.length !== partners.length) throw new Error("Participante no válido.");
    }
    if ((m.category === "conexion" || m.kind === "ludoya") && !partners.length) throw new Error("Elige con quién la has hecho.");
    if (m.category === "conexion" && partners.length !== 1) throw new Error("Elige a una sola persona para confirmarla.");
    if (m.kind === "ludoya" && !data.evidence) throw new Error("Indica qué partida has registrado.");
    if ((m.kind === "follow" || m.kind === "post" || m.kind === "story") && !data.evidence) throw new Error("Indica tu usuario de Instagram.");
    const auto = m.category === "social";
    const r = await db.from("reto_completions").insert({ event_id: p.event_id, mission_id: m.id, participant_id: p.id, partner_ids: partners, evidence: data.evidence || null, status: auto ? "confirmed" : "pending", decided_at: auto ? new Date().toISOString() : null }).select("id").single();
    if (r.error?.code === "23505") throw new Error("Ya has enviado esta misión.");
    const c = check(r) as any;
    if (auto) {
      await award(db, p.event_id, p.id, m.tickets, m.kind, c.id);
      if (m.kind === "ludoya") for (const q of partners) await award(db, p.event_id, q, m.tickets, "ludoya", c.id);
    }
    return { status: auto ? "confirmed" : "pending" };
  });

export const retosConfirm = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: tokenS, completionId: uuid, accept: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const db = await pub();
    const p = await me(db, data.token);
    const c = check(await db.from("reto_completions").select("id,event_id,mission_id,participant_id,partner_ids,status").eq("id", data.completionId).maybeSingle()) as any;
    if (!c || c.event_id !== p.event_id || !c.partner_ids.includes(p.id)) throw new Error("No puedes confirmar esta misión.");
    if (c.status !== "pending") return { ok: true };
    const upd = check(await db.from("reto_completions").update({ status: data.accept ? "confirmed" : "rejected", confirmed_by: p.id, decided_at: new Date().toISOString() }).eq("id", c.id).eq("status", "pending").select("id")) as any[];
    if (data.accept && upd.length) {
      const m = check(await db.from("reto_missions").select("tickets").eq("id", c.mission_id).single()) as any;
      await award(db, c.event_id, c.participant_id, m.tickets, "mission", c.id);
    }
    return { ok: true };
  });

export const retosMessages = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: tokenS, withId: uuid }).parse(d))
  .handler(async ({ data }) => {
    const db = await pub();
    const p = await me(db, data.token);
    const rows = check(await db.from("reto_messages").select("id,from_id,body,created_at").eq("event_id", p.event_id)
      .or(`and(from_id.eq.${p.id},to_id.eq.${data.withId}),and(from_id.eq.${data.withId},to_id.eq.${p.id})`).order("created_at").limit(300)) as any[];
    await db.from("reto_messages").update({ read_at: new Date().toISOString() }).eq("to_id", p.id).eq("from_id", data.withId).is("read_at", null);
    return rows.map((r) => ({ id: r.id as string, mine: r.from_id === p.id, body: r.body as string, created_at: r.created_at as string }));
  });

export const retosSendMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: tokenS, toId: uuid, body: z.string().trim().min(1).max(1000) }).parse(d))
  .handler(async ({ data }) => {
    const db = await pub();
    const p = await me(db, data.token);
    if (data.toId === p.id) throw new Error("No puedes escribirte a ti.");
    const to = check(await db.from("reto_participants").select("id").eq("id", data.toId).eq("event_id", p.event_id).maybeSingle());
    if (!to) throw new Error("Participante no encontrado.");
    check(await db.from("reto_messages").insert({ event_id: p.event_id, from_id: p.id, to_id: data.toId, body: data.body }));
    return { ok: true };
  });
