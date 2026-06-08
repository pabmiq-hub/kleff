import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertSuperAdmin } from "@/lib/assert-role.server";

const RESERVED = new Set([
  "admin", "app", "api", "login", "super-admin", "p", "en", "ca", "es",
  "invite", "auth", "assets", "static", "_root",
]);

const slugRe = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine((s) => slugRe.test(s), "Solo minúsculas, números y guiones")
  .refine((s) => !RESERVED.has(s), "Slug reservado");

const localeSchema = z.enum(["es", "ca", "en"]);

function pathFor(locale: "es" | "ca" | "en", slug: string, isHome: boolean) {
  if (isHome) return locale === "es" ? "/" : `/${locale}`;
  return locale === "es" ? `/${slug}` : `/${locale}/${slug}`;
}

export type PageSlugRow = {
  id: string;
  page_key: string | null;
  title: string;
  path: string;
  is_builtin: boolean;
  slug_es: string | null;
  slug_ca: string | null;
  slug_en: string | null;
};

export const listPageSlugs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("content_pages")
      .select("id, page_key, title, path, is_builtin, slug_es, slug_ca, slug_en")
      .order("is_builtin", { ascending: false })
      .order("title", { ascending: true });
    if (error) throw new Error(error.message);
    return { pages: (data ?? []) as PageSlugRow[] };
  });

export type RedirectRow = {
  id: string;
  from_path: string;
  to_path: string;
  locale: string | null;
  page_key: string | null;
  created_at: string;
};

export const listRedirects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("content_redirects")
      .select("id, from_path, to_path, locale, page_key, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { redirects: (data ?? []) as RedirectRow[] };
  });

export const adminDeleteRedirect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("content_redirects")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdatePageSlug = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      pageId: z.string().uuid(),
      locale: localeSchema,
      slug: slugSchema,
    })
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: page, error: pErr } = await supabaseAdmin
      .from("content_pages")
      .select("id, page_key, path, slug_es, slug_ca, slug_en")
      .eq("id", data.pageId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!page) throw new Error("Página no encontrada");

    const isHome = page.page_key === "home";
    if (isHome) throw new Error("La página de inicio no puede cambiar de slug");

    const slugCol = `slug_${data.locale}` as "slug_es" | "slug_ca" | "slug_en";
    const oldSlug = page[slugCol];
    if (oldSlug === data.slug) return { ok: true, unchanged: true };

    // Collision check
    const { data: clash, error: cErr } = await supabaseAdmin
      .from("content_pages")
      .select("id")
      .eq(slugCol, data.slug)
      .neq("id", page.id)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (clash) throw new Error(`Ese slug ya está en uso en ${data.locale.toUpperCase()}`);

    const newPath = pathFor(data.locale, data.slug, false);
    const oldPath = oldSlug ? pathFor(data.locale, oldSlug, false) : null;

    const updatePayload = {
      [slugCol]: data.slug,
      updated_by: userId,
      ...(data.locale === "es" ? { path: newPath } : {}),
    } as never;

    const { error: uErr } = await supabaseAdmin
      .from("content_pages")
      .update(updatePayload)
      .eq("id", page.id);
    if (uErr) throw new Error(uErr.message);

    // Create 301 redirect from the old path
    if (oldPath && oldPath !== newPath) {
      // Remove any redirect that pointed TO oldPath (chain compaction) and update to newPath
      await supabaseAdmin
        .from("content_redirects")
        .update({ to_path: newPath })
        .eq("to_path", oldPath);

      // Remove existing redirect from newPath if any (would be a loop)
      await supabaseAdmin
        .from("content_redirects")
        .delete()
        .eq("from_path", newPath);

      await supabaseAdmin.from("content_redirects").upsert(
        {
          from_path: oldPath,
          to_path: newPath,
          locale: data.locale,
          page_key: page.page_key,
          created_by: userId,
        },
        { onConflict: "from_path" }
      );
    }

    return { ok: true, newPath, oldPath };
  });
