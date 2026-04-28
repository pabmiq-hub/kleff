import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

const pathSchema = z.string().min(1).max(256).regex(/^\/[a-zA-Z0-9/_-]*$/);
const elementIdSchema = z.string().min(1).max(128).regex(/^[a-zA-Z0-9._:-]+$/);
const propertySchema = z.string().min(1).max(64).regex(/^[a-zA-Z0-9._-]+$/);
const localeSchema = z.enum(["es", "en", "ca"]);
const SOURCE_LOCALE = "es" as const;
const ALL_LOCALES = ["es", "en", "ca"] as const;

export type OverrideRow = {
  page_path: string;
  element_id: string;
  property: string;
  value: Json | null;
  status: "draft" | "published";
  locale: string;
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

// ---------- Translation helper (Lovable AI Gateway) ----------

const LANG_NAMES: Record<string, string> = {
  es: "Spanish (Castellano)",
  en: "English",
  ca: "Catalan (Català)",
};

async function translateHtml(
  source: string,
  fromLocale: string,
  toLocale: string
): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.warn("[overrides] LOVABLE_API_KEY missing — skipping translation");
    return source;
  }
  if (!source.trim()) return source;

  const system = [
    `You are a professional translator for a board-games community website (KLEFF, Barcelona).`,
    `Translate the user's snippet from ${LANG_NAMES[fromLocale] ?? fromLocale} to ${LANG_NAMES[toLocale] ?? toLocale}.`,
    `STRICT RULES:`,
    `- Preserve ALL HTML tags and attributes exactly (e.g. <b>, <i>, <u>, <a href="…">, <br>, <span>).`,
    `- Translate only the visible text content.`,
    `- Do NOT translate brand names: KLEFF.`,
    `- Keep the same tone (warm, direct, community-friendly).`,
    `- Do NOT add quotes, explanations, or markdown around your answer.`,
    `- Return ONLY the translated snippet.`,
  ].join("\n");

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: source },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("[overrides] translate failed", res.status, t);
      return source;
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const out = json.choices?.[0]?.message?.content?.trim();
    return out && out.length > 0 ? out : source;
  } catch (e) {
    console.error("[overrides] translate error", e);
    return source;
  }
}

// ---------- Public read (filtered by locale) ----------

export const getPublishedOverrides = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      pagePath: pathSchema,
      locale: localeSchema.optional().default("es"),
    })
  )
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("content_overrides" as never)
      .select("element_id, property, value, locale")
      .eq("page_path", data.pagePath)
      .eq("status", "published")
      .in("locale", data.locale === SOURCE_LOCALE ? [SOURCE_LOCALE] : [data.locale, SOURCE_LOCALE]);
    if (error) {
      console.error("getPublishedOverrides error", error);
      return { overrides: [] as Array<{ element_id: string; property: string; value: Json | null }> };
    }
    const preferred = new Map<string, { element_id: string; property: string; value: Json | null }>();
    for (const row of (rows ?? []) as Array<{ element_id: string; property: string; value: Json | null; locale: string }>) {
      const key = `${row.element_id}::${row.property}`;
      const existing = preferred.get(key);
      if (!existing || row.locale === data.locale) {
        preferred.set(key, {
          element_id: row.element_id,
          property: row.property,
          value: row.value,
        });
      }
    }
    return {
      overrides: Array.from(preferred.values()),
    };
  });

// ---------- Admin reads ----------

export const adminGetPageOverrides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      pagePath: pathSchema,
      locale: localeSchema.optional().default("es"),
    })
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("content_overrides" as never)
      .select("element_id, property, value, status, updated_at, locale")
      .eq("page_path", data.pagePath)
      .in("locale", data.locale === SOURCE_LOCALE ? [SOURCE_LOCALE] : [data.locale, SOURCE_LOCALE]);
    if (error) throw new Error(error.message);
    const preferred = new Map<string, OverrideRow>();
    for (const row of (rows ?? []) as OverrideRow[]) {
      const key = `${row.element_id}::${row.property}::${row.status}`;
      const existing = preferred.get(key);
      if (!existing || row.locale === data.locale) {
        preferred.set(key, row);
      }
    }
    return { overrides: Array.from(preferred.values()) };
  });

// ---------- Admin writes ----------

/**
 * Save a single draft override.
 *
 * Behavior:
 * - Non-text properties (style, hidden, src, alt, ...) are written ONLY for the
 *   source locale (es). They are language-independent and we don't want to
 *   duplicate them per locale (keeps the read filtered by locale + a fallback
 *   to es overrides for non-text props if needed).
 * - For `text` (and only `text`):
 *     - Always saved for `es` (source).
 *     - Auto-translated to `en` and `ca` and saved as drafts too.
 *   The frontend can pass `skipTranslate: true` if the admin is editing a
 *   non-source locale directly (manual override).
 */
export const adminSaveOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      pagePath: pathSchema,
      elementId: elementIdSchema,
      property: propertySchema,
      value: z.unknown(),
      locale: localeSchema.optional().default("es"),
      skipTranslate: z.boolean().optional().default(false),
    })
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const writeOne = async (locale: string, value: unknown) => {
      const { error } = await supabaseAdmin
        .from("content_overrides" as never)
        .upsert(
          {
            page_path: data.pagePath,
            element_id: data.elementId,
            property: data.property,
            value: (value ?? null) as never,
            status: "draft",
            locale,
            updated_by: userId,
          } as never,
          { onConflict: "page_path,element_id,property,status,locale" }
        );
      if (error) throw new Error(error.message);
    };

    // 1) Always write the value the admin sent for the locale they edited in.
    await writeOne(data.locale, data.value);

    // 2) If it's a `text` property edited from the source locale (es) and
    //    translation isn't disabled, translate to the other locales.
    if (
      data.property === "text" &&
      data.locale === SOURCE_LOCALE &&
      !data.skipTranslate &&
      typeof data.value === "string"
    ) {
      const source = data.value;
      const targets = ALL_LOCALES.filter((l) => l !== SOURCE_LOCALE);
      // Run translations in parallel; never let a failed translation break the save.
      await Promise.all(
        targets.map(async (target) => {
          try {
            const translated = await translateHtml(source, SOURCE_LOCALE, target);
            await writeOne(target, translated);
          } catch (e) {
            console.error(`[overrides] failed to translate to ${target}`, e);
          }
        })
      );
    }

    // 3) Style/hidden/src/alt: also mirror to the other locales so that the
    //    visual change is visible everywhere (these are language-agnostic).
    if (
      data.property !== "text" &&
      data.locale === SOURCE_LOCALE
    ) {
      const targets = ALL_LOCALES.filter((l) => l !== SOURCE_LOCALE);
      await Promise.all(
        targets.map((target) => writeOne(target, data.value).catch(() => undefined))
      );
    }

    return { ok: true };
  });

export const adminClearOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      pagePath: pathSchema,
      elementId: elementIdSchema,
      property: propertySchema,
      locale: localeSchema.optional().default("es"),
      allLocales: z.boolean().optional().default(true),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("content_overrides" as never)
      .delete()
      .eq("page_path", data.pagePath)
      .eq("element_id", data.elementId)
      .eq("property", data.property)
      .eq("status", "draft");
    if (!data.allLocales) {
      q = q.eq("locale", data.locale);
    }
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDiscardDrafts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ pagePath: pathSchema }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // Discard drafts across ALL locales for this page.
    const { error } = await supabase
      .from("content_overrides" as never)
      .delete()
      .eq("page_path", data.pagePath)
      .eq("status", "draft");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminPublishPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ pagePath: pathSchema }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Promote drafts -> published across ALL locales.
    const { data: drafts, error: dErr } = await supabase
      .from("content_overrides" as never)
      .select("element_id, property, value, locale")
      .eq("page_path", data.pagePath)
      .eq("status", "draft");
    if (dErr) throw new Error(dErr.message);

    const draftRows = (drafts ?? []) as Array<{
      element_id: string;
      property: string;
      value: unknown;
      locale: string;
    }>;
    if (draftRows.length === 0) return { published: 0 };

    const upsertPayload = draftRows.map((d) => ({
      page_path: data.pagePath,
      element_id: d.element_id,
      property: d.property,
      value: (d.value ?? null) as never,
      status: "published" as const,
      locale: d.locale,
      updated_by: userId,
    }));

    const { error: pErr } = await supabase
      .from("content_overrides" as never)
      .upsert(upsertPayload as never, {
        onConflict: "page_path,element_id,property,status,locale",
      });
    if (pErr) throw new Error(pErr.message);

    const { error: delErr } = await supabase
      .from("content_overrides" as never)
      .delete()
      .eq("page_path", data.pagePath)
      .eq("status", "draft");
    if (delErr) throw new Error(delErr.message);

    return { published: draftRows.length };
  });

// ---------- Pages CRUD (unchanged) ----------

export const listContentPages = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("content_pages" as never)
    .select("id, path, title, template, is_builtin, is_published, updated_at")
    .order("is_builtin", { ascending: false })
    .order("title", { ascending: true });
  if (error) {
    console.error("listContentPages error", error);
    return { pages: [] as PageRow[] };
  }
  return { pages: (data ?? []) as PageRow[] };
});

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
