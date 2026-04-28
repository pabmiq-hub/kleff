import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// IMPORTANT: do NOT import anything from "./bgg.server" at module scope here.
// That file imports the admin Supabase client and would leak service-role
// code into the client bundle through routes that import this file. Lazy
// dynamic imports inside the handler keep server-only code on the server.

export const adminSyncBggCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { syncBggCollection, assertSuperAdminBgg } = await import(
      "./bgg.server"
    );
    await assertSuperAdminBgg(context.userId);
    return await syncBggCollection();
  });
