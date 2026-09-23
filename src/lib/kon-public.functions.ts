import { createServerFn } from "@tanstack/react-start";

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
