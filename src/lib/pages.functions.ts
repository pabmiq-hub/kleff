import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertSuperAdmin } from "@/lib/assert-role.server";

export const getCustomPageById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ pageId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { data: page, error } = await supabaseAdmin
      .from("content_pages")
      .select("id, title, path, is_builtin, is_published, slug_es, slug_ca, slug_en")
      .eq("id", data.pageId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { page };
  });

export const adminTogglePublishedPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ pageId: z.string().uuid(), isPublished: z.boolean() }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("content_pages")
      .update({ is_published: data.isPublished, updated_by: context.userId } as never)
      .eq("id", data.pageId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdatePageMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    pageId: z.string().uuid(),
    title: z.string().min(1).max(120).optional(),
    locale: z.enum(["es", "ca", "en"]).optional(),
    slug: z.string().min(1).max(80).regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/).optional(),
  }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const payload: Record<string, unknown> = { updated_by: context.userId };
    if (data.title !== undefined) payload.title = data.title;
    if (data.locale && data.slug) {
      payload[`slug_${data.locale}`] = data.slug;
      if (data.locale === "es") payload.path = `/${data.slug}`;
    }
    const { error } = await supabaseAdmin
      .from("content_pages")
      .update(payload as never)
      .eq("id", data.pageId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });



export const adminDeletePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ pageId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    // Don't allow deleting builtin pages
    const { data: page, error: e1 } = await supabaseAdmin
      .from("content_pages")
      .select("id, is_builtin")
      .eq("id", data.pageId)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!page) throw new Error("La página no existe");
    if ((page as { is_builtin: boolean }).is_builtin) {
      throw new Error("Las páginas built-in no se pueden eliminar");
    }
    // Remove blocks first (no FK cascade guaranteed) then the page.
    await supabaseAdmin.from("content_page_blocks").delete().eq("page_id", data.pageId);
    const { error } = await supabaseAdmin
      .from("content_pages")
      .delete()
      .eq("id", data.pageId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

