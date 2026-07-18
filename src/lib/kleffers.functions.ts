import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * List active KLEFF members visible to other members.
 * Returns only public fields: username, avatar, ludoya link.
 * Uses supabaseAdmin (bypasses RLS) but projects only safe columns.
 */
export const listKleffers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, username, avatar_url, ludoya_username, member_number, created_at")
      .order("member_number", { ascending: true });
    if (error) throw new Error(error.message);
    return { kleffers: data ?? [] };
  });
