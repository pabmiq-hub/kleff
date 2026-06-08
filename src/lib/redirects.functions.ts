import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Look up a 301 redirect for the given path. Returns null if none exists.
 * Public, unauthenticated. Used by the catch-all route to honor redirects
 * created when slugs are renamed in the admin.
 */
export const lookupRedirect = createServerFn({ method: "GET" })
  .inputValidator(z.object({ path: z.string() }))
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin
      .from("content_redirects")
      .select("to_path")
      .eq("from_path", data.path)
      .maybeSingle();
    return { to: row?.to_path ?? null };
  });
