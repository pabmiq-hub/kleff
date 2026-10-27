import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { editSessionSlugSchema } from "./session-links";

export const mmResolveSessionSlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: typeof d.slug === "string" ? d.slug.slice(0, 200) : "" }))
  .handler(async ({ data }) => {
    const { db } = await import("./engine.server");
    const { resolveSessionSlug } = await import("./session-links.server");
    return { sessionId: await resolveSessionSlug(db, data.slug) };
  });
export const mmSetSessionSlug = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string; slug: string }) => editSessionSlugSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: role, error } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "super_admin").maybeSingle();
    if (error || !role) throw new Error("Esta zona es solo para administradores.");
    const { db } = await import("./engine.server");
    const { updateSessionSlug } = await import("./session-links.server");
    return updateSessionSlug(db, data);
  });