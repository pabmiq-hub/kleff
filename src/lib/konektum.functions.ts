import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getKonektumOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { loadKonektumOverview } = await import("@/lib/konektum.server");
    return loadKonektumOverview();
  });
