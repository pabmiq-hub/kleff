import { createServerFn } from "@tanstack/react-start";
import { countQuotaParticipants, synchronizeQuotas, type RegistrationQuota } from "@/konektum/lib/registration-quotas";

export interface KonPublicEvent {
  id: string;
  name: string;
  slug: string | null;
  /** Which public link was used: the main one or the secondary variant. */
  variant: "primary" | "secondary";
  /** Subtitle/description override coming from the secondary link (if any). */
  variantSubtitle?: string | null;
  variantDescription?: string | null;
  /** Gender this link targets, used to preselect the field in the form. */
  variantGender?: string | null;
}

/** Resolves a public event slug (or raw id) to the event it points at. */
export const resolveKonEvent = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug ?? "").trim() }))
  .handler(async ({ data }): Promise<KonPublicEvent | null> => {
    if (!data.slug) return null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const client = supabaseAdmin as unknown as { from: (t: string) => any };

    const columns =
      "id, name, slug, secondary_slug, secondary_event_name, secondary_registration_subtitle, secondary_registration_description, secondary_target_gender, primary_target_gender";
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.slug);

    let row: any = null;
    if (isUuid) {
      const res = await client.from("kon_events").select(columns).eq("id", data.slug).maybeSingle();
      row = res.data;
    } else {
      const res = await client.from("kon_events").select(columns).eq("slug", data.slug).maybeSingle();
      row = res.data;
      if (!row) {
        const alt = await client.from("kon_events").select(columns).eq("secondary_slug", data.slug).maybeSingle();
        row = alt.data;
      }
    }

    if (!row) return null;

    const isSecondary = !isUuid && row.secondary_slug === data.slug && row.slug !== data.slug;

    return {
      id: row.id,
      name: isSecondary && row.secondary_event_name ? row.secondary_event_name : row.name,
      slug: row.slug ?? null,
      variant: isSecondary ? "secondary" : "primary",
      variantSubtitle: isSecondary ? row.secondary_registration_subtitle ?? null : null,
      variantDescription: isSecondary ? row.secondary_registration_description ?? null : null,
      variantGender: isSecondary ? row.secondary_target_gender ?? null : row.primary_target_gender ?? null,
    };
  });

/** Public aggregate only: birth dates and individual registrations stay server-side. */
export const getKonQuotaAvailability = createServerFn({ method: "POST" })
  .inputValidator((data: { eventId: string }) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.eventId)) throw new Error("Evento inválido");
    return { eventId: data.eventId };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const client = supabaseAdmin as unknown as { from: (t: string) => any };
    const { data: event, error } = await client.from("kon_events_public")
      .select("id, status, custom_age_ranges, registration_requirements_enabled, slot_quotas")
      .eq("id", data.eventId).maybeSingle();
    if (error || !event) throw new Error("No se pudieron consultar las plazas");
    if (!["pending", "active"].includes(event.status) || !event.registration_requirements_enabled) return [];
    const quotas = synchronizeQuotas(Array.isArray(event.slot_quotas) ? event.slot_quotas as RegistrationQuota[] : [], event.custom_age_ranges);
    const { data: people, error: countError } = await client.from("kon_participants")
      .select("gender, age_range, birth_date, cancelled_at, is_fake").eq("event_id", event.id);
    if (countError) throw new Error("No se pudieron consultar las plazas");
    return quotas.map(q => {
      const current = countQuotaParticipants(people ?? [], q, event.custom_age_ranges);
      return { gender: q.gender, ageRange: q.ageRange, current, max: q.maxSlots, available: Math.max(0, q.maxSlots - current) };
    });
  });
