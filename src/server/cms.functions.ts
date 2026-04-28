import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------------- Helpers ----------------

async function assertSuperAdmin(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: super admin role required");
}

const localeSchema = z.enum(["es", "ca", "en"]);
const statusSchema = z.enum(["draft", "published"]);

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Block schema: type + arbitrary content JSON (validated per-type on the client)
const blockSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.string().min(1).max(50),
  position: z.number().int().min(0).max(1000),
  content: z.record(z.string(), z.any()).default({}),
});

// ---------------- Public reads ----------------

export const getPublishedPage = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; locale?: "es" | "ca" | "en" }) =>
    z.object({ slug: z.string().regex(slugRegex).max(100), locale: localeSchema.optional() }).parse(input)
  )
  .handler(async ({ data }) => {
    const locale = data.locale ?? "es";
    const { data: page, error } = await supabaseAdmin
      .from("pages")
      .select("id, slug, locale, title, description, og_image_url, status, published_at")
      .eq("slug", data.slug)
      .eq("locale", locale)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!page) return { page: null, blocks: [] };
    const { data: blocks, error: blocksError } = await supabaseAdmin
      .from("page_blocks")
      .select("id, type, position, content")
      .eq("page_id", page.id)
      .order("position", { ascending: true });
    if (blocksError) throw new Error(blocksError.message);
    return { page, blocks: blocks ?? [] };
  });

// ---------------- Admin: list pages ----------------

export const listPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("pages")
      .select("id, slug, locale, title, status, updated_at, published_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { pages: data ?? [] };
  });

// ---------------- Admin: get page with blocks ----------------

export const getPageWithBlocks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { data: page, error } = await supabaseAdmin
      .from("pages")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!page) throw new Error("Page not found");
    const { data: blocks, error: blocksError } = await supabaseAdmin
      .from("page_blocks")
      .select("id, type, position, content")
      .eq("page_id", page.id)
      .order("position", { ascending: true });
    if (blocksError) throw new Error(blocksError.message);
    return { page, blocks: blocks ?? [] };
  });

// ---------------- Admin: create page ----------------

export const createPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string; locale: "es" | "ca" | "en"; title: string; description?: string }) =>
    z.object({
      slug: z.string().regex(slugRegex, "Slug solo en minúsculas, números y guiones").max(100),
      locale: localeSchema,
      title: z.string().min(1).max(200),
      description: z.string().max(500).optional(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { data: page, error } = await supabaseAdmin
      .from("pages")
      .insert({
        slug: data.slug,
        locale: data.locale,
        title: data.title,
        description: data.description ?? null,
        status: "draft",
        created_by: context.userId,
      })
      .select("id, slug, locale, title, status")
      .single();
    if (error) throw new Error(error.message);
    return { page };
  });

// ---------------- Admin: update page meta ----------------

export const updatePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id: string;
    slug?: string;
    title?: string;
    description?: string | null;
    og_image_url?: string | null;
  }) =>
    z.object({
      id: z.string().uuid(),
      slug: z.string().regex(slugRegex).max(100).optional(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(500).nullable().optional(),
      og_image_url: z.string().url().max(500).nullable().optional(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { id, ...rest } = data;
    const { error } = await supabaseAdmin.from("pages").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Admin: publish / unpublish ----------------

export const setPageStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "draft" | "published" }) =>
    z.object({ id: z.string().uuid(), status: statusSchema }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("pages")
      .update({
        status: data.status,
        published_at: data.status === "published" ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Admin: delete page ----------------

export const deletePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin.from("pages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Admin: replace all blocks (atomic-ish) ----------------

export const saveBlocks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { pageId: string; blocks: Array<{ id?: string; type: string; position: number; content: Record<string, unknown> }> }) =>
    z.object({
      pageId: z.string().uuid(),
      blocks: z.array(blockSchema).max(100),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    // Strategy: delete all blocks for this page, then insert new ones.
    const { error: delError } = await supabaseAdmin
      .from("page_blocks")
      .delete()
      .eq("page_id", data.pageId);
    if (delError) throw new Error(delError.message);
    if (data.blocks.length === 0) return { ok: true };
    const rows = data.blocks.map((b, i) => ({
      page_id: data.pageId,
      type: b.type,
      position: i,
      content: b.content,
    }));
    const { error: insError } = await supabaseAdmin.from("page_blocks").insert(rows);
    if (insError) throw new Error(insError.message);
    return { ok: true };
  });

// ---------------- Admin: upload media ----------------

export const uploadMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { filename: string; contentType: string; base64: string }) =>
    z.object({
      filename: z.string().min(1).max(200).regex(/^[a-zA-Z0-9._-]+$/),
      contentType: z.string().regex(/^[a-zA-Z0-9._/+-]+$/).max(100),
      base64: z.string().min(1).max(15_000_000), // ~10MB after decode
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const buffer = Buffer.from(data.base64, "base64");
    const path = `${Date.now()}-${data.filename}`;
    const { error } = await supabaseAdmin.storage
      .from("media")
      .upload(path, buffer, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    const { data: pub } = supabaseAdmin.storage.from("media").getPublicUrl(path);
    return { url: pub.publicUrl, path };
  });
