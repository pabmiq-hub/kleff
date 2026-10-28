import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { contestSlugSchema, normalizeContestSlug, pickRaffleWinner, tally, validVotes } from "./contests";

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
function check<T>(r: { data: T; error: any }): T {
  if (r.error) throw new Error(r.error.code === "23505" ? "Ese enlace ya está en uso." : r.error.message);
  return r.data;
}

async function loadContest(db: any, contestId: string) {
  const [cats, entries] = await Promise.all([
    db.from("contest_categories").select("id,name,sort_order").eq("contest_id", contestId).order("sort_order"),
    db.from("contest_entries").select("id,name,photo_url,created_at,contest_entry_categories(category_id)").eq("contest_id", contestId).order("created_at"),
  ]);
  const categories = check(cats) as { id: string; name: string }[];
  const list = (check(entries) as any[]).map((e) => ({ id: e.id, name: e.name, photo_url: e.photo_url, categoryIds: e.contest_entry_categories.map((c: any) => c.category_id) as string[] }));
  return { categories, entries: list };
}

// ---------- Admin ----------
export const adminListContests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context);
    return check(await db.from("contests").select("id,name,slug,status,created_at").order("created_at", { ascending: false })) as { id: string; name: string; slug: string; status: string; created_at: string }[];
  });

export const adminCreateContest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string; slug: string; categories: string[] }) =>
    z.object({ name: z.string().trim().min(1).max(120), slug: contestSlugSchema, categories: z.array(z.string().trim().min(1).max(80)).min(1).max(20) }).parse({ ...d, slug: normalizeContestSlug(d.slug || d.name) }))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const c = check(await db.from("contests").insert({ name: data.name, slug: data.slug }).select("id").single()) as { id: string };
    check(await db.from("contest_categories").insert(data.categories.map((name, i) => ({ contest_id: c.id, name, sort_order: i }))));
    return c;
  });

export const adminGetContest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const contest = check(await db.from("contests").select("*").eq("id", data.id).single()) as any;
    const { categories, entries } = await loadContest(db, data.id);
    const voters = check(await db.from("contest_voters").select("id,nickname,contest_votes(category_id,entry_id)").eq("contest_id", data.id)) as any[];
    const votes = voters.flatMap((v) => v.contest_votes);
    const ec = entries.flatMap((e) => e.categoryIds.map((category_id) => ({ entry_id: e.id, category_id })));
    const winner = voters.find((v) => v.id === contest.raffle_winner_id);
    return {
      contest: { id: contest.id, name: contest.name, slug: contest.slug, status: contest.status as string, raffled_at: contest.raffled_at as string | null },
      categories, entries, results: tally(categories, ec, votes),
      voterCount: voters.filter((v) => v.contest_votes.length).length,
      raffleWinner: winner ? (winner.nickname as string) : null,
    };
  });

export const adminUpdateContest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; name: string; slug: string; status: string }) =>
    z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(120), slug: contestSlugSchema, status: z.enum(["draft", "open", "closed"]) }).parse({ ...d, slug: normalizeContestSlug(d.slug) }))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    check(await db.from("contests").update({ name: data.name, slug: data.slug, status: data.status }).eq("id", data.id));
    return { ok: true };
  });

export const adminDeleteContest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    check(await db.from("contests").delete().eq("id", data.id));
    return { ok: true };
  });

export const adminAddCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { contestId: string; name: string }) => z.object({ contestId: z.string().uuid(), name: z.string().trim().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    check(await db.from("contest_categories").insert({ contest_id: data.contestId, name: data.name, sort_order: Date.now() % 1e9 }));
    return { ok: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    check(await db.from("contest_categories").delete().eq("id", data.id));
    return { ok: true };
  });

export const adminSaveEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { contestId: string; id?: string | null; name: string; photoUrl: string; categoryIds: string[] }) =>
    z.object({ contestId: z.string().uuid(), id: z.string().uuid().nullish(), name: z.string().trim().min(1).max(120), photoUrl: z.string().url(), categoryIds: z.array(z.string().uuid()).min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const cats = check(await db.from("contest_categories").select("id").eq("contest_id", data.contestId).in("id", data.categoryIds)) as any[];
    if (cats.length !== data.categoryIds.length) throw new Error("Categoría no válida.");
    let id = data.id;
    if (id) check(await db.from("contest_entries").update({ name: data.name, photo_url: data.photoUrl }).eq("id", id).eq("contest_id", data.contestId));
    else id = (check(await db.from("contest_entries").insert({ contest_id: data.contestId, name: data.name, photo_url: data.photoUrl }).select("id").single()) as any).id;
    check(await db.from("contest_entry_categories").delete().eq("entry_id", id));
    check(await db.from("contest_entry_categories").insert(data.categoryIds.map((category_id) => ({ entry_id: id, category_id }))));
    return { ok: true };
  });

export const adminDeleteEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    check(await db.from("contest_entries").delete().eq("id", data.id));
    return { ok: true };
  });

export const adminRunRaffle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const voters = (check(await db.from("contest_voters").select("id,nickname,contest_votes(category_id)").eq("contest_id", data.id)) as any[]).filter((v) => v.contest_votes.length);
    const rand = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
    const w = pickRaffleWinner(voters, rand);
    if (!w) throw new Error("Todavía no ha votado nadie.");
    check(await db.from("contests").update({ raffle_winner_id: w.id, raffled_at: new Date().toISOString() }).eq("id", data.id));
    return { winner: w.nickname as string };
  });

// ---------- Public ----------
export const getPublicContest = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string; token?: string | null }) => ({ slug: String(d.slug ?? "").slice(0, 60), token: d.token ? String(d.token).slice(0, 80) : null }))
  .handler(async ({ data }) => {
    const db = await pub();
    const contest = check(await db.from("contests").select("id,name,status").eq("slug", data.slug).maybeSingle()) as any;
    if (!contest || contest.status === "draft") return null;
    const { categories, entries } = await loadContest(db, contest.id);
    let mine: { nickname: string; votes: { category_id: string; entry_id: string }[] } | null = null;
    if (data.token) {
      const v = check(await db.from("contest_voters").select("nickname,contest_votes(category_id,entry_id)").eq("contest_id", contest.id).eq("token", data.token).maybeSingle()) as any;
      if (v) mine = { nickname: v.nickname, votes: v.contest_votes };
    }
    return { name: contest.name as string, open: contest.status === "open", categories, entries, mine };
  });

export const submitContestVotes = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string; nickname: string; votes: { category_id: string; entry_id: string }[]; token?: string | null }) =>
    z.object({ slug: z.string().max(60), nickname: z.string().trim().min(1).max(60), votes: z.array(z.object({ category_id: z.string().uuid(), entry_id: z.string().uuid() })).max(500), token: z.string().max(80).nullish() }).parse(d))
  .handler(async ({ data }) => {
    const db = await pub();
    const contest = check(await db.from("contests").select("id,status").eq("slug", data.slug).maybeSingle()) as any;
    if (!contest || contest.status !== "open") throw new Error("La votación está cerrada.");
    const { entries } = await loadContest(db, contest.id);
    const votes = validVotes(data.votes, entries.flatMap((e) => e.categoryIds.map((category_id) => ({ entry_id: e.id, category_id }))));
    if (!votes.length) throw new Error("Elige al menos un voto.");
    let voter = data.token ? (check(await db.from("contest_voters").select("id,token").eq("contest_id", contest.id).eq("token", data.token).maybeSingle()) as any) : null;
    if (voter) check(await db.from("contest_voters").update({ nickname: data.nickname }).eq("id", voter.id));
    else voter = check(await db.from("contest_voters").insert({ contest_id: contest.id, nickname: data.nickname, token: crypto.randomUUID() }).select("id,token").single());
    check(await db.from("contest_votes").delete().eq("voter_id", voter.id));
    check(await db.from("contest_votes").insert(votes.map((v) => ({ ...v, voter_id: voter.id }))));
    return { token: voter.token as string };
  });
