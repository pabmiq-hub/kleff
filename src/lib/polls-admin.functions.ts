import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const optionSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  label: z.string().min(1).max(200),
  description: z.string().max(500).nullable().optional(),
  gameRef: z.string().max(120).nullable().optional(),
  imageUrl: z.string().max(600).nullable().optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
});

const pollSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  kind: z.enum(["survey", "acquisition"]),
  status: z.enum(["draft", "published", "closed"]),
  titleEs: z.string().min(2).max(200),
  descriptionEs: z.string().max(2000).nullable().optional(),
  opensAt: z.string().min(4),
  closesAt: z.string().min(4).nullable().optional(),
  karmaCategoryId: z.string().uuid().nullable().optional(),
  maxChoices: z.number().int().min(1).max(10),
  showResults: z.boolean(),
  questions: z
    .array(
      z.object({
        id: z.string().max(40),
        label: z.string().min(1).max(300),
        type: z.enum(["text", "textarea", "email", "phone", "number", "date", "single", "multi", "select"]),
        help: z.string().max(300).nullable().optional(),
        required: z.boolean().optional(),
        options: z.array(z.string().max(200)).max(30).optional(),
      }),
    )
    .max(30),
  options: z.array(optionSchema).max(40),
});

export const adminListPolls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: polls, error } = await supabaseAdmin
      .from("polls")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const ids = (polls ?? []).map((p) => p.id);
    const { data: options } = ids.length
      ? await supabaseAdmin.from("poll_options").select("*").in("poll_id", ids).order("sort_order")
      : { data: [] };
    const { data: votes } = ids.length
      ? await supabaseAdmin.from("poll_votes").select("poll_id, option_id, user_id, weight").in("poll_id", ids)
      : { data: [] };
    const { data: responses } = ids.length
      ? await supabaseAdmin.from("poll_responses").select("poll_id, user_id, answers").in("poll_id", ids)
      : { data: [] };
    const { data: categories } = await supabaseAdmin
      .from("karma_categories")
      .select("id, name_es, points")
      .eq("is_active", true)
      .order("sort_order");

    return {
      categories: categories ?? [],
      polls: (polls ?? []).map((p) => {
        const pollVotes = (votes ?? []).filter((v) => v.poll_id === p.id);
        const totals: Record<string, number> = {};
        for (const v of pollVotes) totals[v.option_id] = (totals[v.option_id] ?? 0) + (v.weight ?? 1);
        return {
          id: p.id,
          kind: p.kind,
          status: p.status,
          titleEs: p.title_es,
          descriptionEs: p.description_es,
          opensAt: p.opens_at,
          closesAt: p.closes_at,
          karmaCategoryId: p.karma_category_id,
          maxChoices: p.max_choices,
          showResults: p.show_results,
          questions: (p.questions ?? []) as { id: string; label: string; type: string; options?: string[] }[],
          options: (options ?? [])
            .filter((o) => o.poll_id === p.id)
            .map((o) => ({
              id: o.id,
              label: o.label,
              description: o.description,
              gameRef: o.game_ref,
              imageUrl: o.game_image_url,
              year: o.game_year,
              votes: totals[o.id] ?? 0,
            })),
          voters: new Set(pollVotes.map((v) => v.user_id)).size,
          responses: (responses ?? [])
            .filter((r) => r.poll_id === p.id)
            .map((r) => ({ userId: r.user_id, answers: r.answers as Record<string, string> })),
        };
      }),
    };
  });

export const adminSavePoll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => pollSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const payload = {
      kind: data.kind,
      status: data.status,
      title_es: data.titleEs,
      description_es: data.descriptionEs ?? null,
      opens_at: new Date(data.opensAt).toISOString(),
      closes_at: data.closesAt ? new Date(data.closesAt).toISOString() : null,
      karma_category_id: data.karmaCategoryId ?? null,
      max_choices: data.maxChoices,
      show_results: data.showResults,
      questions: data.questions,
      created_by: context.userId,
    };

    let pollId = data.id ?? null;
    let wasPublished = false;
    if (pollId) {
      const { data: before } = await supabaseAdmin.from("polls").select("status").eq("id", pollId).maybeSingle();
      wasPublished = before?.status === "published";
      const { error } = await supabaseAdmin.from("polls").update(payload).eq("id", pollId);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await supabaseAdmin.from("polls").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      pollId = created.id;
    }

    // Opciones: se reemplazan por completo (los votos de opciones eliminadas caen en cascada).
    const keepIds = data.options.map((o) => o.id).filter(Boolean) as string[];
    let del = supabaseAdmin.from("poll_options").delete().eq("poll_id", pollId);
    if (keepIds.length) del = del.not("id", "in", `(${keepIds.join(",")})`);
    await del;

    for (const [index, o] of data.options.entries()) {
      const row = {
        poll_id: pollId,
        label: o.label,
        description: o.description ?? null,
        game_ref: o.gameRef ?? null,
        game_image_url: o.imageUrl ?? null,
        game_year: o.year ?? null,
        sort_order: index,
      };
      if (o.id) await supabaseAdmin.from("poll_options").update(row).eq("id", o.id);
      else await supabaseAdmin.from("poll_options").insert(row);
    }

    let notified = 0;
    if (data.status === "published" && !wasPublished) {
      const { notifyAllMembers } = await import("@/lib/polls.server");
      notified = await notifyAllMembers(
        data.kind === "survey" ? "Nueva encuesta" : "Nueva votación de adquisiciones",
        data.titleEs,
        "/app/votaciones",
        "poll_created",
      );
    }

    return { success: true as const, id: pollId, notified };
  });

export const adminDeletePoll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("polls").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true as const };
  });

export const adminSetPollStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["draft", "published", "closed"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: before } = await supabaseAdmin
      .from("polls")
      .select("status, kind, title_es")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await supabaseAdmin.from("polls").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);

    let notified = 0;
    if (data.status === "published" && before?.status !== "published") {
      const { notifyAllMembers } = await import("@/lib/polls.server");
      notified = await notifyAllMembers(
        before?.kind === "survey" ? "Nueva encuesta" : "Nueva votación de adquisiciones",
        before?.title_es ?? "",
        "/app/votaciones",
        "poll_created",
      );
    }
    return { success: true as const, notified };
  });
