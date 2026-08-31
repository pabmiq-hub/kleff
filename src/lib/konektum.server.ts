// Server-only access layer to the Konektum (Match Maker Pro) backend.
// Phase 1 of the integration: KLEFF reads/writes Konektum data in its own
// project, signing in server-side as the organizer account.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type AnyClient = SupabaseClient<any, "public", any>;

let cached: { client: AnyClient; userId: string; expiresAt: number } | null = null;

export async function getKonektumClient(): Promise<{ client: AnyClient; organizerId: string }> {
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60_000) {
    return { client: cached.client, organizerId: cached.userId };
  }

  const url = process.env["KONEKTUM_SUPABASE_URL"];
  const key = process.env["KONEKTUM_SUPABASE_PUBLISHABLE_KEY"];
  const email = process.env["KONEKTUM_ADMIN_EMAIL"];
  const password = process.env["KONEKTUM_ADMIN_PASSWORD"];

  if (!url || !key || !email || !password) {
    throw new Error("Konektum no está configurado (faltan credenciales).");
  }

  const client = createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    throw new Error(`No se pudo conectar con Konektum: ${error?.message ?? "sesión no disponible"}`);
  }

  const authed = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  cached = {
    client: authed,
    userId: data.user.id,
    expiresAt: (data.session.expires_at ?? Math.floor(now / 1000) + 3600) * 1000,
  };

  return { client: authed, organizerId: data.user.id };
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
  const { client, organizerId } = await getKonektumClient();

  const { data: organizer } = await client
    .from("organizers")
    .select("company_name")
    .eq("user_id", organizerId)
    .maybeSingle();

  const { data: eventRows, error: eventsError } = await client
    .from("events")
    .select("id, name, date, status, module, participants_count, is_test_event")
    .eq("organizer_id", organizerId)
    .order("date", { ascending: false });
  if (eventsError) throw new Error(eventsError.message);

  const events = (eventRows ?? []) as KonektumEvent[];
  const realEventIds = events.filter((e) => !e.is_test_event).map((e) => e.id);

  const { count: uniqueParticipants } = await client
    .from("global_participants")
    .select("*", { count: "exact", head: true })
    .eq("organizer_id", organizerId);

  let totalParticipants = 0;
  let submitted = 0;
  let mutualMatches = 0;

  if (realEventIds.length > 0) {
    const { count: tp } = await client
      .from("participants")
      .select("*", { count: "exact", head: true })
      .in("event_id", realEventIds)
      .eq("is_fake", false);
    const { count: sc } = await client
      .from("participants")
      .select("*", { count: "exact", head: true })
      .in("event_id", realEventIds)
      .eq("is_fake", false)
      .not("selection_submitted_at", "is", null);
    totalParticipants = tp ?? 0;
    submitted = sc ?? 0;

    const { data: selections } = await client
      .from("participant_selections")
      .select("selector_id, selected_id")
      .in("event_id", realEventIds);
    if (selections) {
      const set = new Set(selections.map((s) => `${s.selector_id}->${s.selected_id}`));
      const counted = new Set<string>();
      for (const s of selections) {
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
