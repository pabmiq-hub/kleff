import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Encuestas y votaciones visibles para el socio, con su participación. */
export const listMyPolls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isPollOpen } = await import("@/lib/polls.server");

    const { data: polls, error } = await supabaseAdmin
      .from("polls")
      .select("*")
      .neq("status", "draft")
      .order("opens_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);

    const ids = (polls ?? []).map((p) => p.id);
    const { data: options } = ids.length
      ? await supabaseAdmin.from("poll_options").select("*").in("poll_id", ids).order("sort_order")
      : { data: [] };
    const { data: allVotes } = ids.length
      ? await supabaseAdmin.from("poll_votes").select("poll_id, option_id, user_id, weight").in("poll_id", ids)
      : { data: [] };
    const { data: myResponses } = ids.length
      ? await supabaseAdmin
          .from("poll_responses")
          .select("poll_id, answers")
          .eq("user_id", context.userId)
          .in("poll_id", ids)
      : { data: [] };

    const votes = allVotes ?? [];
    const responseMap = new Map((myResponses ?? []).map((r) => [r.poll_id, r.answers]));

    return {
      polls: (polls ?? []).map((p) => {
        const opts = (options ?? []).filter((o) => o.poll_id === p.id);
        const pollVotes = votes.filter((v) => v.poll_id === p.id);
        const myVotes = pollVotes.filter((v) => v.user_id === context.userId).map((v) => v.option_id);
        const totals: Record<string, number> = {};
        for (const v of pollVotes) totals[v.option_id] = (totals[v.option_id] ?? 0) + (v.weight ?? 1);
        const voters = new Set(pollVotes.map((v) => v.user_id)).size;
        return {
          id: p.id,
          kind: p.kind,
          status: p.status,
          title: p.title_es,
          description: p.description_es,
          opensAt: p.opens_at,
          closesAt: p.closes_at,
          maxChoices: p.max_choices,
          showResults: p.show_results,
          questions: (p.questions ?? []) as { id: string; label: string; type: string; help?: string | null; required?: boolean; options?: string[] }[],
          open: isPollOpen(p),
          options: opts.map((o) => ({
            id: o.id,
            label: o.label,
            description: o.description,
            imageUrl: o.game_image_url,
            year: o.game_year,
            votes: p.show_results ? (totals[o.id] ?? 0) : null,
          })),
          myVotes,
          myAnswers: (responseMap.get(p.id) ?? null) as Record<string, string> | null,
          participated: myVotes.length > 0 || responseMap.has(p.id),
          voters,
        };
      }),
    };
  });

/** Emite (o cambia) el voto del socio en una votación de adquisiciones. */
export const submitPollVote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ pollId: z.string().uuid(), optionIds: z.array(z.string().uuid()).min(1).max(10) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isPollOpen, consumeDoubleVotePerk, awardPollKarma } = await import("@/lib/polls.server");

    const { data: poll } = await supabaseAdmin.from("polls").select("*").eq("id", data.pollId).maybeSingle();
    if (!poll) throw new Error("Votación no encontrada");
    if (poll.kind !== "acquisition") throw new Error("Esta encuesta no admite votos");
    if (!isPollOpen(poll)) throw new Error("La votación está cerrada");
    if (data.optionIds.length > poll.max_choices)
      throw new Error(`Solo puedes elegir ${poll.max_choices} opción(es)`);

    const { data: valid } = await supabaseAdmin
      .from("poll_options")
      .select("id")
      .eq("poll_id", poll.id)
      .in("id", data.optionIds);
    if ((valid ?? []).length !== data.optionIds.length) throw new Error("Opción no válida");

    const { data: previous } = await supabaseAdmin
      .from("poll_votes")
      .select("id, weight")
      .eq("poll_id", poll.id)
      .eq("user_id", context.userId);

    // Mantiene el peso si ya había votado (el perk solo se consume una vez).
    let weight = previous && previous.length > 0 ? (previous[0]?.weight ?? 1) : await consumeDoubleVotePerk(context.userId);
    if (weight !== 2) weight = 1;

    await supabaseAdmin.from("poll_votes").delete().eq("poll_id", poll.id).eq("user_id", context.userId);
    const { error } = await supabaseAdmin.from("poll_votes").insert(
      data.optionIds.map((optionId) => ({
        poll_id: poll.id,
        option_id: optionId,
        user_id: context.userId,
        weight,
      })),
    );
    if (error) throw new Error(error.message);

    const karma = await awardPollKarma(context.userId, poll.id, poll.karma_category_id, poll.title_es, poll.kind as "survey" | "acquisition");
    return { success: true as const, weight, karma };
  });

/** Envía las respuestas de una encuesta general. */
export const submitPollResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        pollId: z.string().uuid(),
        answers: z.record(z.string().max(80), z.string().max(2000)),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isPollOpen, awardPollKarma } = await import("@/lib/polls.server");

    const { data: poll } = await supabaseAdmin.from("polls").select("*").eq("id", data.pollId).maybeSingle();
    if (!poll) throw new Error("Encuesta no encontrada");
    if (poll.kind !== "survey") throw new Error("Esta votación no admite respuestas");
    if (!isPollOpen(poll)) throw new Error("La encuesta está cerrada");

    const { error } = await supabaseAdmin
      .from("poll_responses")
      .upsert(
        { poll_id: poll.id, user_id: context.userId, answers: data.answers },
        { onConflict: "poll_id,user_id" },
      );
    if (error) throw new Error(error.message);

    const karma = await awardPollKarma(context.userId, poll.id, poll.karma_category_id, poll.title_es, poll.kind as "survey" | "acquisition");
    return { success: true as const, karma };
  });
