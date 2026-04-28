import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

const pathSchema = z.string().min(1).max(256).regex(/^\/[a-zA-Z0-9/_-]*$/);
const elementIdSchema = z.string().min(1).max(128).regex(/^[a-zA-Z0-9._:-]+$/);
const propertySchema = z.string().min(1).max(64).regex(/^[a-zA-Z0-9._-]+$/);

export type OverrideRow = {
  page_path: string;
  element_id: string;
  property: string;
  value: Json | null;
  status: "draft" | "published";
};

export type PageRow = {
  id: string;
  path: string;
  title: string;
  template: string;
  is_builtin: boolean;
  is_published: boolean;
  updated_at: string;
};

// PUBLIC: get published overrides for a page (for visitors)
export const getPublishedOverrides = createServerFn({ method: "GET" })
  .inputValidator(z.object({ pagePath: pathSchema }))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("content_overrides" as never)
      .select("element_id, property, value")
      .eq("page_path", data.pagePath)
      .eq("status", "published");
    if (error) {
      console.error("getPublishedOverrides error", error);
      return { overrides: [] as Array<{ element_id: string; property: string; value: unknown }> };
    }
    return { overrides: (rows ?? []) as Array<{ element_id: string; property: string; value: unknown }> };
  });

// ADMIN: get all overrides (draft + published) for a page, merged
export const adminGetPageOverrides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ pagePath: pathSchema }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("content_overrides" as never)
      .select("element_id, property, value, status, updated_at")
      .eq("page_path", data.pagePath);
    if (error) throw new Error(error.message);
    return { overrides: (rows ?? []) as OverrideRow[] };
  });

// ADMIN: save a single draft override (upsert)
export const adminSaveOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      pagePath: pathSchema,
      elementId: elementIdSchema,
      property: propertySchema,
      value: z.unknown(),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("content_overrides" as never)
      .upsert(
        {
          page_path: data.pagePath,
          element_id: data.elementId,
          property: data.property,
          value: (data.value ?? null) as never,
          status: "draft",
          updated_by: userId,
        } as never,
        { onConflict: "page_path,element_id,property,status" }
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ADMIN: clear a single draft override (revert to published / default)
export const adminClearOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      pagePath: pathSchema,
      elementId: elementIdSchema,
      property: propertySchema,
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("content_overrides" as never)
      .delete()
      .eq("page_path", data.pagePath)
      .eq("element_id", data.elementId)
      .eq("property", data.property)
      .eq("status", "draft");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ADMIN: discard ALL drafts for a page
export const adminDiscardDrafts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ pagePath: pathSchema }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("content_overrides" as never)
      .delete()
      .eq("page_path", data.pagePath)
      .eq("status", "draft");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ADMIN: publish drafts → copy each draft over its published row, then delete drafts
export const adminPublishPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ pagePath: pathSchema }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: drafts, error: dErr } = await supabase
      .from("content_overrides" as never)
      .select("element_id, property, value")
      .eq("page_path", data.pagePath)
      .eq("status", "draft");
    if (dErr) throw new Error(dErr.message);

    const draftRows = (drafts ?? []) as Array<{ element_id: string; property: string; value: unknown }>;
    if (draftRows.length === 0) return { published: 0 };

    const upsertPayload = draftRows.map((d) => ({
      page_path: data.pagePath,
      element_id: d.element_id,
      property: d.property,
      value: (d.value ?? null) as never,
      status: "published" as const,
      updated_by: userId,
    }));

    const { error: pErr } = await supabase
      .from("content_overrides" as never)
      .upsert(upsertPayload as never, { onConflict: "page_path,element_id,property,status" });
    if (pErr) throw new Error(pErr.message);

    const { error: delErr } = await supabase
      .from("content_overrides" as never)
      .delete()
      .eq("page_path", data.pagePath)
      .eq("status", "draft");
    if (delErr) throw new Error(delErr.message);

    return { published: draftRows.length };
  });

// PUBLIC: list pages
export const listContentPages = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("content_pages" as never)
    .select("id, path, title, template, is_builtin, is_published, updated_at")
    .order("is_builtin", { ascending: false })
    .order("title", { ascending: true });
  if (error) {
    console.error("listContentPages error", error);
    return { pages: [] as Array<Record<string, unknown>> };
  }
  return { pages: (data ?? []) as Array<Record<string, unknown>> };
});

// ADMIN: create a new custom page
export const adminCreatePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      slug: z
        .string()
        .min(1)
        .max(64)
        .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
      title: z.string().min(1).max(120),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const path = `/p/${data.slug}`;
    const { data: row, error } = await supabase
      .from("content_pages" as never)
      .insert({
        path,
        title: data.title,
        template: "blank",
        is_builtin: false,
        is_published: false,
        created_by: userId,
        updated_by: userId,
      } as never)
      .select("id, path, title")
      .single();
    if (error) throw new Error(error.message);
    return { page: row };
  });
