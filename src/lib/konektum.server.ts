// Server-only access layer to the Konektum data, now living inside the KLEFF
// database under the `kon_` table prefix.

const KONEKTUM_ORGANIZER_USER_ID = "e68889b2-a7c8-4bbc-84d9-501786ad10fa";

async function getClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as {
    from: (t: string) => any;
  };
}

export interface KonektumEvent {
  id: string;
  name: string;
  date: string;
  status: string;
  module: string | null;
  participants_count: number;
  is_test_event: boolean | null;
}

export interface KonektumOverview {
  organizerName: string | null;
  events: KonektumEvent[];
  stats: {
    totalEvents: number;
    activeEvents: number;
    uniqueParticipants: number;
    mutualMatches: number;
    selectionRate: number;
  };
}

export async function loadKonektumOverview(): Promise<KonektumOverview> {
  const client = await getClient();
  const organizerId = KONEKTUM_ORGANIZER_USER_ID;

  const { data: organizer } = await client
    .from("kon_organizers")
    .select("company_name")
    .eq("user_id", organizerId)
    .maybeSingle();

  const { data: eventRows, error: eventsError } = await client
    .from("kon_events")
    .select("id, name, date, status, module, participants_count, is_test_event")
    .eq("organizer_id", organizerId)
    .order("date", { ascending: false });
  if (eventsError) throw new Error(eventsError.message);

  const events = (eventRows ?? []) as KonektumEvent[];
  const realEventIds = events.filter((e) => !e.is_test_event).map((e) => e.id);

  const { count: uniqueParticipants } = await client
    .from("kon_global_participants")
    .select("*", { count: "exact", head: true })
    .eq("organizer_id", organizerId);

  let totalParticipants = 0;
  let submitted = 0;
  let mutualMatches = 0;

  if (realEventIds.length > 0) {
    const { count: tp } = await client
      .from("kon_participants")
      .select("*", { count: "exact", head: true })
      .in("event_id", realEventIds)
      .eq("is_fake", false);
    const { count: sc } = await client
      .from("kon_participants")
      .select("*", { count: "exact", head: true })
      .in("event_id", realEventIds)
      .eq("is_fake", false)
      .not("selection_submitted_at", "is", null);
    totalParticipants = tp ?? 0;
    submitted = sc ?? 0;

    const { data: selections } = await client
      .from("kon_participant_selections")
      .select("selector_id, selected_id")
      .in("event_id", realEventIds);
    if (selections) {
      const set = new Set(
        (selections as { selector_id: string; selected_id: string }[]).map(
          (s) => `${s.selector_id}->${s.selected_id}`,
        ),
      );
      const counted = new Set<string>();
      for (const s of selections as { selector_id: string; selected_id: string }[]) {
        const pair = [s.selector_id, s.selected_id].sort().join(":");
        if (set.has(`${s.selected_id}->${s.selector_id}`) && !counted.has(pair)) {
          counted.add(pair);
          mutualMatches++;
        }
      }
    }
  }

  return {
    organizerName: organizer?.company_name ?? null,
    events,
    stats: {
      totalEvents: events.length,
      activeEvents: events.filter((e) => e.status === "active" || e.status === "pending").length,
      uniqueParticipants: uniqueParticipants ?? 0,
      mutualMatches,
      selectionRate: totalParticipants ? Math.round((submitted / totalParticipants) * 100) : 0,
    },
  };
}
