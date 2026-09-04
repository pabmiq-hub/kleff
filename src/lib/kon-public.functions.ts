import { createServerFn } from "@tanstack/react-start";

export interface KonPublicEvent {
  id: string;
  name: string;
  slug: string | null;
}

/** Resolves a public event slug (or raw id) to the event it points at. */
export const resolveKonEvent = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug ?? "").trim() }))
  .handler(async ({ data }): Promise<KonPublicEvent | null> => {
    if (!data.slug) return null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const client = supabaseAdmin as unknown as { from: (t: string) => any };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.slug);
    const query = client.from("kon_events").select("id, name, slug");
    const { data: row } = isUuid
      ? await query.eq("id", data.slug).maybeSingle()
      : await query.eq("slug", data.slug).maybeSingle();

    return (row as KonPublicEvent | null) ?? null;
  });
