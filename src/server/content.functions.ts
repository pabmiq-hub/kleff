import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

// PUBLIC: read all sections for a page (no auth required, used by SSR loaders)
export const getPageContent = createServerFn({ method: "GET" })
  .inputValidator(z.object({ pageKey: z.string().min(1).max(64) }))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("content_sections")
      .select("section_key, content, schema_version, updated_at")
      .like("section_key", `${data.pageKey}.%`);

    if (error) {
      console.error("getPageContent error", error);
      return { sections: {} as Record<string, Json> };
    }

    const sections: Record<string, Json> = {};
    for (const r of rows ?? []) {
      sections[r.section_key] = (r.content ?? {}) as Json;
    }
    return { sections };
  });

// ADMIN: read a single section (or null if it doesn't exist yet)
export const adminGetSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ sectionKey: z.string().min(1).max(128) }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("content_sections")
      .select("section_key, content, schema_version, updated_at, updated_by")
      .eq("section_key", data.sectionKey)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { section: row };
  });

// ADMIN: upsert a section's content
export const adminSaveSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      sectionKey: z.string().min(1).max(128),
      content: z.record(z.unknown()),
      schemaVersion: z.number().int().min(1).max(1000).default(1),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: row, error } = await supabase
      .from("content_sections")
      .upsert(
        {
          section_key: data.sectionKey,
          content: data.content as never,
          schema_version: data.schemaVersion,
          updated_by: userId,
        },
        { onConflict: "section_key" }
      )
      .select("section_key, content, updated_at")
      .single();

    if (error) throw new Error(error.message);
    return { section: row };
  });

// ADMIN: history for a section (last 20 versions)
export const adminGetSectionHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ sectionKey: z.string().min(1).max(128) }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("content_section_history")
      .select("id, content, schema_version, saved_at, saved_by")
      .eq("section_key", data.sectionKey)
      .order("saved_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return { history: rows ?? [] };
  });
