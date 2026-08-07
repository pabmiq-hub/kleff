import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PollRow = {
  id: string;
  kind: "survey" | "acquisition";
  status: "draft" | "published" | "closed";
  title_es: string;
  description_es: string | null;
  opens_at: string;
  closes_at: string | null;
  karma_category_id: string | null;
  max_choices: number;
  questions: unknown;
  show_results: boolean;
};

export function isPollOpen(poll: { status: string; opens_at: string; closes_at: string | null }): boolean {
  if (poll.status !== "published") return false;
  const now = Date.now();
  if (new Date(poll.opens_at).getTime() > now) return false;
  if (poll.closes_at && new Date(poll.closes_at).getTime() < now) return false;
  return true;
}

/** Devuelve el peso del voto (2 si el socio tiene un perk `double_vote` disponible) y lo consume. */
export async function consumeDoubleVotePerk(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("karma_perks")
    .select("id, expires_at, consumed_at")
    .eq("user_id", userId)
    .eq("kind", "double_vote")
    .is("consumed_at", null)
    .order("created_at", { ascending: true });
  const now = Date.now();
  const perk = (data ?? []).find((p) => !p.expires_at || new Date(p.expires_at).getTime() > now);
  if (!perk) return 1;
  await supabaseAdmin
    .from("karma_perks")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", perk.id);
  return 2;
}

/** Categoría de karma por defecto según el tipo de votación. */
export const DEFAULT_POLL_KARMA_CODE = { survey: "survey", acquisition: "poll_vote" } as const;

export async function defaultKarmaCategoryId(kind: "survey" | "acquisition"): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("karma_categories")
    .select("id")
    .eq("code", DEFAULT_POLL_KARMA_CODE[kind])
    .eq("is_active", true)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Crea (una sola vez por votación y socio) la contribución de karma asociada a la encuesta.
 * Si la votación no tiene categoría asignada, usa la categoría por defecto de su tipo.
 */
export async function awardPollKarma(
  userId: string,
  pollId: string,
  categoryId: string | null,
  pollTitle: string,
  kind?: "survey" | "acquisition",
): Promise<{ awarded: boolean; points?: number }> {
  const resolvedId = categoryId ?? (kind ? await defaultKarmaCategoryId(kind) : null);
  if (!resolvedId) return { awarded: false };
  const eventRef = `poll:${pollId}`;
  const { data: existing } = await supabaseAdmin
    .from("karma_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("event_ref", eventRef)
    .maybeSingle();
  if (existing) return { awarded: false };

  const { data: category } = await supabaseAdmin
    .from("karma_categories")
    .select("id, points, is_active")
    .eq("id", resolvedId)
    .maybeSingle();
  if (!category || !category.is_active) return { awarded: false };

  const { activeSeasonId } = await import("@/lib/karma.server");
  const seasonId = await activeSeasonId();
  const { error } = await supabaseAdmin.from("karma_entries").insert({
    user_id: userId,
    category_id: category.id,
    season_id: seasonId,
    points: category.points,
    status: "approved",
    description: `Participación en «${pollTitle}»`,
    event_ref: eventRef,
    created_by: userId,
    decided_at: new Date().toISOString(),
  });
  if (error) return { awarded: false };
  return { awarded: true, points: category.points };
}

/** Notifica a todos los socios que hay una nueva encuesta o votación. */
export async function notifyAllMembers(title: string, body: string, url: string, type: string): Promise<number> {
  const { data: profiles } = await supabaseAdmin.from("profiles").select("id");
  const rows = (profiles ?? []).map((p) => ({
    user_id: p.id,
    type,
    title,
    body,
    url,
  }));
  if (rows.length === 0) return 0;
  await supabaseAdmin.from("notifications").insert(rows);
  return rows.length;
}
