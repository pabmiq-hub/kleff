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

/* ------------------------------------------------------------------ *
 * Event detail
 * ------------------------------------------------------------------ */

export interface KonParticipant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  age: number | null;
  age_range: string | null;
  preference: string | null;
  dating_preference: string | null;
  company_name: string | null;
  sector: string | null;
  entity_type: string | null;
  checked_in: boolean | null;
  payment_status: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  is_fake: boolean | null;
  is_anonymous: boolean | null;
  is_returning_participant: boolean | null;
  selection_submitted_at: string | null;
  verification_code: string | null;
  spoken_languages: string[] | null;
  created_at: string;
}

const PARTICIPANT_COLS =
  "id, name, email, phone, gender, age, age_range, preference, dating_preference, company_name, sector, entity_type, checked_in, payment_status, paid_at, cancelled_at, is_fake, is_anonymous, is_returning_participant, selection_submitted_at, verification_code, spoken_languages, created_at";

export interface KonPair {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  reason: string | null;
}

export interface KonSelection {
  id: string;
  selector_id: string;
  selected_id: string;
  is_super_like: boolean | null;
  selection_type: string | null;
  created_at: string;
}

export interface KonRequest {
  id: string;
  requester_id: string;
  target_id: string;
  status: string;
  created_at: string;
  scheduled_round: number | null;
}

export interface KonWaitlistEntry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  status: string;
  position: number | null;
  promoted_at: string | null;
  created_at: string;
}

export interface KonEventDetail {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: Record<string, any> & { id: string; name: string; date: string; status: string };
  participants: KonParticipant[];
  selections: KonSelection[];
  waitlist: KonWaitlistEntry[];
  exclusions: KonPair[];
  inclusions: KonPair[];
  crushRequests: KonRequest[];
  repeatRequests: KonRequest[];
}

export async function loadKonektumEvent(eventId: string): Promise<KonEventDetail> {
  const client = await getClient();

  const { data: event, error } = await client
    .from("kon_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!event) throw new Error("Evento no encontrado");

  const [participants, selections, waitlist, exclusions, inclusions, crush, repeat] = await Promise.all([
    client.from("kon_participants").select(PARTICIPANT_COLS).eq("event_id", eventId).order("created_at"),
    client
      .from("kon_participant_selections")
      .select("id, selector_id, selected_id, is_super_like, selection_type, created_at")
      .eq("event_id", eventId),
    client
      .from("kon_event_waitlist")
      .select("id, name, email, phone, gender, status, position, promoted_at, created_at")
      .eq("event_id", eventId)
      .order("position"),
    client
      .from("kon_participant_exclusions")
      .select("id, participant_1_id, participant_2_id, reason")
      .eq("event_id", eventId),
    client
      .from("kon_participant_inclusions")
      .select("id, participant_1_id, participant_2_id, reason")
      .eq("event_id", eventId),
    client
      .from("kon_crush_requests")
      .select("id, requester_id, target_id, status, created_at, scheduled_round")
      .eq("event_id", eventId),
    client
      .from("kon_repeat_requests")
      .select("id, requester_id, target_id, status, created_at, scheduled_round")
      .eq("event_id", eventId),
  ]);

  return {
    event: event as KonEventDetail["event"],
    participants: (participants.data ?? []) as KonParticipant[],
    selections: (selections.data ?? []) as KonSelection[],
    waitlist: (waitlist.data ?? []) as KonWaitlistEntry[],
    exclusions: (exclusions.data ?? []) as KonPair[],
    inclusions: (inclusions.data ?? []) as KonPair[],
    crushRequests: (crush.data ?? []) as KonRequest[],
    repeatRequests: (repeat.data ?? []) as KonRequest[],
  };
}

/* ------------------------------------------------------------------ *
 * Mutations
 * ------------------------------------------------------------------ */

const EVENT_EDITABLE = new Set([
  "name",
  "slug",
  "date",
  "event_time",
  "event_location",
  "status",
  "module",
  "language",
  "registration_open",
  "registration_description",
  "registration_subtitle",
  "checkin_open",
  "checkin_opens_minutes_before",
  "waitlist_enabled",
  "crush_enabled",
  "repeat_request_enabled",
  "super_like_enabled",
  "wrapped_enabled",
  "gender_parity",
  "table_size",
  "rounds",
  "round_duration",
  "current_round",
  "rotation_mode",
  "tables_generation_mode",
  "selection_deadline_hours",
  "avoid_previous_encounters",
  "is_test_event",
  "tables",
]);

export async function updateKonektumEvent(eventId: string, patch: Record<string, unknown>) {
  const client = await getClient();
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) if (EVENT_EDITABLE.has(k)) clean[k] = v;
  if (Object.keys(clean).length === 0) return { ok: true };
  const { error } = await client.from("kon_events").update(clean).eq("id", eventId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

const PARTICIPANT_EDITABLE = new Set([
  "name",
  "slug",
  "email",
  "phone",
  "gender",
  "age",
  "age_range",
  "preference",
  "dating_preference",
  "company_name",
  "sector",
  "entity_type",
  "checked_in",
  "payment_status",
  "paid_at",
  "cancelled_at",
  "is_fake",
  "spoken_languages",
]);

export async function updateKonektumParticipant(participantId: string, patch: Record<string, unknown>) {
  const client = await getClient();
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) if (PARTICIPANT_EDITABLE.has(k)) clean[k] = v;
  if (Object.keys(clean).length === 0) return { ok: true };
  const { error } = await client.from("kon_participants").update(clean).eq("id", participantId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function createKonektumParticipant(eventId: string, values: Record<string, unknown>) {
  const client = await getClient();
  const clean: Record<string, unknown> = { event_id: eventId };
  for (const [k, v] of Object.entries(values)) if (PARTICIPANT_EDITABLE.has(k)) clean[k] = v;
  const { data, error } = await client.from("kon_participants").insert(clean).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  await syncParticipantsCount(eventId);
  return { id: data?.id as string | undefined };
}

export async function deleteKonektumParticipant(participantId: string) {
  const client = await getClient();
  const { data: row } = await client
    .from("kon_participants")
    .select("event_id")
    .eq("id", participantId)
    .maybeSingle();
  const { error } = await client.from("kon_participants").delete().eq("id", participantId);
  if (error) throw new Error(error.message);
  if (row?.event_id) await syncParticipantsCount(row.event_id as string);
  return { ok: true };
}

async function syncParticipantsCount(eventId: string) {
  const client = await getClient();
  const { count } = await client
    .from("kon_participants")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .is("cancelled_at", null);
  await client.from("kon_events").update({ participants_count: count ?? 0 }).eq("id", eventId);
}

export async function addKonektumPair(
  kind: "exclusion" | "inclusion",
  eventId: string,
  p1: string,
  p2: string,
  reason: string | null,
) {
  const client = await getClient();
  const table = kind === "exclusion" ? "kon_participant_exclusions" : "kon_participant_inclusions";
  const { error } = await client
    .from(table)
    .insert({ event_id: eventId, participant_1_id: p1, participant_2_id: p2, reason });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteKonektumPair(kind: "exclusion" | "inclusion", id: string) {
  const client = await getClient();
  const table = kind === "exclusion" ? "kon_participant_exclusions" : "kon_participant_inclusions";
  const { error } = await client.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function promoteKonektumWaitlist(entryId: string) {
  const client = await getClient();
  const { data: entry, error } = await client
    .from("kon_event_waitlist")
    .select("*")
    .eq("id", entryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!entry) throw new Error("Entrada no encontrada");

  const e = entry as Record<string, unknown>;
  const { error: insErr } = await client.from("kon_participants").insert({
    event_id: e['event_id'],
    name: e['name'],
    email: e['email'],
    phone: e['phone'],
    gender: e['gender'],
    age_range: e['age_range'],
    birth_date: e['birth_date'],
    preference: e['preference'],
    dating_preference: e['dating_preference'],
    preferred_age_range: e['preferred_age_range'],
    company_name: e['company_name'],
    company_size: e['company_size'],
    sector: e['sector'],
    entity_type: e['entity_type'],
    needs: e['needs'],
    solutions: e['solutions'],
    spoken_languages: e['spoken_languages'],
    marketing_consent: e['marketing_consent'],
    is_returning_participant: e['is_returning_participant'],
    game_answers: e['game_answers'],
    wrapped_answers: e['wrapped_answers'],
  });
  if (insErr) throw new Error(insErr.message);

  await client
    .from("kon_event_waitlist")
    .update({ status: "promoted", promoted_at: new Date().toISOString() })
    .eq("id", entryId);
  await syncParticipantsCount(e['event_id'] as string);
  return { ok: true };
}

/* ------------------------------------------------------------------ *
 * Table generation
 * ------------------------------------------------------------------ */

interface TableSeat {
  id: string;
  name: string;
}

export async function generateKonektumTables(eventId: string) {
  const detail = await loadKonektumEvent(eventId);
  const event = detail.event as Record<string, unknown>;
  const rounds = Number(event['rounds'] ?? 1) || 1;
  const tableSize = Number(event['table_size'] ?? 4) || 4;
  const genderParity = Boolean(event['gender_parity']);

  const active = detail.participants.filter((p) => !p.cancelled_at);
  const exclusionKeys = new Set(
    detail.exclusions.map((x) => [x.participant_1_id, x.participant_2_id].sort().join(":")),
  );

  const met = new Map<string, Set<string>>();
  const markMet = (a: string, b: string) => {
    if (!met.has(a)) met.set(a, new Set());
    if (!met.has(b)) met.set(b, new Set());
    met.get(a)!.add(b);
    met.get(b)!.add(a);
  };
  const overlap = (seat: TableSeat[], id: string) =>
    seat.filter((s) => met.get(id)?.has(s.id) || exclusionKeys.has([s.id, id].sort().join(":"))).length;

  const roundsOut: { round: number; tables: TableSeat[][] }[] = [];

  for (let r = 1; r <= rounds; r++) {
    const pool = [...active].sort(() => Math.random() - 0.5);
    const tableCount = Math.max(1, Math.ceil(pool.length / tableSize));
    const tables: TableSeat[][] = Array.from({ length: tableCount }, () => []);

    const ordered = genderParity
      ? interleaveByGender(pool)
      : pool;

    for (const p of ordered) {
      const seat: TableSeat = { id: p.id, name: p.name };
      let best = 0;
      let bestScore = Number.POSITIVE_INFINITY;
      for (let t = 0; t < tableCount; t++) {
        if (tables[t]!.length >= tableSize) continue;
        const score = overlap(tables[t]!, p.id) * 100 + tables[t]!.length;
        if (score < bestScore) {
          bestScore = score;
          best = t;
        }
      }
      if (tables[best]!.length >= tableSize) {
        const idx = tables.findIndex((t) => t.length < tableSize);
        tables[idx === -1 ? 0 : idx]!.push(seat);
      } else {
        tables[best]!.push(seat);
      }
    }

    for (const t of tables) for (const a of t) for (const b of t) if (a.id !== b.id) markMet(a.id, b.id);
    roundsOut.push({ round: r, tables: tables.filter((t) => t.length > 0) });
  }

  const client = await getClient();
  const { error } = await client.from("kon_events").update({ tables: roundsOut }).eq("id", eventId);
  if (error) throw new Error(error.message);
  return roundsOut;
}

function interleaveByGender(pool: KonParticipant[]): KonParticipant[] {
  const a = pool.filter((p) => p.gender === "male");
  const b = pool.filter((p) => p.gender === "female");
  const rest = pool.filter((p) => p.gender !== "male" && p.gender !== "female");
  const out: KonParticipant[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i]) out.push(a[i]!);
    if (b[i]) out.push(b[i]!);
  }
  return [...out, ...rest];
}

export async function createKonektumEvent(values: {
  name: string;
  date: string;
  event_time?: string | null;
  event_location?: string | null;
  module?: string | null;
}) {
  const client = await getClient();
  const { data, error } = await client
    .from("kon_events")
    .insert({
      organizer_id: KONEKTUM_ORGANIZER_USER_ID,
      name: values.name,
      date: values.date,
      event_time: values.event_time ?? null,
      event_location: values.event_location ?? null,
      module: values.module ?? "social",
      status: "pending",
      participants_count: 0,
    })
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { id: data?.id as string };
}

/* ------------------------------------------------------------------ *
 * Analytics
 * ------------------------------------------------------------------ */

export interface KonAnalytics {
  monthly: { month: string; events: number; participants: number }[];
  totals: {
    events: number;
    participants: number;
    checkedIn: number;
    submitted: number;
    selections: number;
    superLikes: number;
    matches: number;
    cancelled: number;
  };
  genders: { label: string; count: number }[];
  retention: { attended: number; people: number }[];
  topEvents: { id: string; name: string; date: string; participants: number; matches: number }[];
}

export async function loadKonektumAnalytics(): Promise<KonAnalytics> {
  const client = await getClient();
  const organizerId = KONEKTUM_ORGANIZER_USER_ID;

  const { data: eventRows } = await client
    .from("kon_events")
    .select("id, name, date, is_test_event")
    .eq("organizer_id", organizerId)
    .order("date");
  const events = ((eventRows ?? []) as { id: string; name: string; date: string; is_test_event: boolean | null }[])
    .filter((e) => !e.is_test_event);
  const ids = events.map((e) => e.id);

  if (ids.length === 0) {
    return {
      monthly: [],
      totals: {
        events: 0,
        participants: 0,
        checkedIn: 0,
        submitted: 0,
        selections: 0,
        superLikes: 0,
        matches: 0,
        cancelled: 0,
      },
      genders: [],
      retention: [],
      topEvents: [],
    };
  }

  const { data: pRows } = await client
    .from("kon_participants")
    .select("id, event_id, gender, email, checked_in, selection_submitted_at, cancelled_at, is_fake")
    .in("event_id", ids);
  const participants = ((pRows ?? []) as {
    id: string;
    event_id: string;
    gender: string | null;
    email: string | null;
    checked_in: boolean | null;
    selection_submitted_at: string | null;
    cancelled_at: string | null;
    is_fake: boolean | null;
  }[]).filter((p) => !p.is_fake);

  const { data: sRows } = await client
    .from("kon_participant_selections")
    .select("event_id, selector_id, selected_id, is_super_like")
    .in("event_id", ids);
  const selections = (sRows ?? []) as {
    event_id: string;
    selector_id: string;
    selected_id: string;
    is_super_like: boolean | null;
  }[];

  const pairSet = new Set(selections.map((s) => `${s.selector_id}->${s.selected_id}`));
  const counted = new Set<string>();
  const matchesByEvent = new Map<string, number>();
  let matches = 0;
  for (const s of selections) {
    const key = [s.selector_id, s.selected_id].sort().join(":");
    if (counted.has(key)) continue;
    if (pairSet.has(`${s.selected_id}->${s.selector_id}`)) {
      counted.add(key);
      matches++;
      matchesByEvent.set(s.event_id, (matchesByEvent.get(s.event_id) ?? 0) + 1);
    }
  }

  const monthlyMap = new Map<string, { events: number; participants: number }>();
  for (const e of events) {
    const month = e.date.slice(0, 7);
    const cur = monthlyMap.get(month) ?? { events: 0, participants: 0 };
    cur.events++;
    cur.participants += participants.filter((p) => p.event_id === e.id && !p.cancelled_at).length;
    monthlyMap.set(month, cur);
  }

  const genderMap = new Map<string, number>();
  for (const p of participants) {
    const g = p.gender ?? "sin indicar";
    genderMap.set(g, (genderMap.get(g) ?? 0) + 1);
  }

  const byEmail = new Map<string, number>();
  for (const p of participants) {
    if (!p.email) continue;
    const k = p.email.toLowerCase();
    byEmail.set(k, (byEmail.get(k) ?? 0) + 1);
  }
  const retentionMap = new Map<number, number>();
  for (const n of byEmail.values()) retentionMap.set(n, (retentionMap.get(n) ?? 0) + 1);

  return {
    monthly: [...monthlyMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({ month, ...v })),
    totals: {
      events: events.length,
      participants: participants.filter((p) => !p.cancelled_at).length,
      checkedIn: participants.filter((p) => p.checked_in).length,
      submitted: participants.filter((p) => p.selection_submitted_at).length,
      selections: selections.length,
      superLikes: selections.filter((s) => s.is_super_like).length,
      matches,
      cancelled: participants.filter((p) => p.cancelled_at).length,
    },
    genders: [...genderMap.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    retention: [...retentionMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([attended, people]) => ({ attended, people })),
    topEvents: events
      .map((e) => ({
        id: e.id,
        name: e.name,
        date: e.date,
        participants: participants.filter((p) => p.event_id === e.id && !p.cancelled_at).length,
        matches: matchesByEvent.get(e.id) ?? 0,
      }))
      .sort((a, b) => b.participants - a.participants)
      .slice(0, 10),
  };
}

/* ------------------------------------------------------------------ *
 * CRM / users
 * ------------------------------------------------------------------ */

export interface KonCrmPerson {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  events_attended: number | null;
  source_notes: string | null;
  created_at: string;
}

export async function loadKonektumPeople(): Promise<KonCrmPerson[]> {
  const client = await getClient();
  const { data, error } = await client
    .from("kon_global_participants")
    .select("id, display_name, email, phone, status, events_attended, source_notes, created_at")
    .eq("organizer_id", KONEKTUM_ORGANIZER_USER_ID)
    .order("events_attended", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as KonCrmPerson[];
}

export async function loadKonektumPerson(personId: string) {
  const client = await getClient();
  const { data: person } = await client
    .from("kon_global_participants")
    .select("*")
    .eq("id", personId)
    .maybeSingle();
  const { data: rows } = await client
    .from("kon_participants")
    .select("id, event_id, checked_in, selection_submitted_at, cancelled_at, created_at")
    .eq("global_participant_id", personId);
  const eventIds = ((rows ?? []) as { event_id: string }[]).map((r) => r.event_id);
  let events: { id: string; name: string; date: string }[] = [];
  if (eventIds.length) {
    const { data: evs } = await client.from("kon_events").select("id, name, date").in("id", eventIds);
    events = (evs ?? []) as typeof events;
  }
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    person: (person ?? null) as Record<string, any> | null,
    attendances: (rows ?? []) as {
      id: string;
      event_id: string;
      checked_in: boolean | null;
      selection_submitted_at: string | null;
      cancelled_at: string | null;
      created_at: string;
    }[],
    events,
  };
}

export async function updateKonektumPerson(personId: string, patch: Record<string, unknown>) {
  const client = await getClient();
  const allowed = new Set(["display_name", "email", "phone", "status", "source_notes"]);
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) if (allowed.has(k)) clean[k] = v;
  if (!Object.keys(clean).length) return { ok: true };
  const { error } = await client.from("kon_global_participants").update(clean).eq("id", personId);
  if (error) throw new Error(error.message);
  return { ok: true };
}
