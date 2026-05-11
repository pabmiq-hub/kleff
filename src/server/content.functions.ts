import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import { getPageSchema, withDefaults, type PageSchema, type SectionSchema } from "@/cms/schemas";

const LOCALES = ["es", "ca", "en"] as const;
type Locale = (typeof LOCALES)[number];
const localeSchema = z.enum(LOCALES);

// PUBLIC: read all sections for a page in a given locale.
// Falls back field-by-field to Spanish ('es') when the requested locale is missing
// or has empty values — so nothing ever shows up blank.
export const getPageContent = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      pageKey: z.string().min(1).max(64),
      locale: localeSchema.default("es"),
    }),
  )
  .handler(async ({ data }) => {
    const schema = getPageSchema(data.pageKey);
    if (schema) {
      try {
        await ensurePageContent(schema, data.locale);
      } catch (e) {
        console.error("[content] ensurePageContent failed", data.pageKey, data.locale, e);
      }
    }

    const { data: rows, error } = await supabaseAdmin
      .from("content_sections")
      .select("section_key, content, schema_version, updated_at, locale")
      .like("section_key", `${data.pageKey}.%`)
      .in("locale", data.locale === "es" ? ["es"] : ["es", data.locale]);

    if (error) {
      console.error("getPageContent error", error);
      return { sections: {} as Record<string, Json>, locale: data.locale };
    }

    // Group by section_key with es as base, then merge requested locale on top.
    const byKey: Record<string, { es?: Json; loc?: Json }> = {};
    for (const r of rows ?? []) {
      const slot = (byKey[r.section_key] ??= {});
      if (r.locale === "es") slot.es = (r.content ?? {}) as Json;
      else if (r.locale === data.locale) slot.loc = (r.content ?? {}) as Json;
    }

    const sections: Record<string, Json> = {};
    for (const [key, slot] of Object.entries(byKey)) {
      sections[key] = mergeLocale(slot.es ?? {}, slot.loc ?? {}) as Json;
    }
    return { sections, locale: data.locale };
  });

// Recursive merge: take the locale value when present and non-empty,
// otherwise fall back to the spanish base. Lists are taken as a whole
// (translated list overrides; empty array means "use base").
function mergeLocale(base: unknown, loc: unknown): unknown {
  if (loc === undefined || loc === null) return base;
  if (typeof loc === "string") return loc.trim() === "" ? base : loc;
  if (Array.isArray(loc)) return loc.length === 0 ? base : loc;
  if (typeof loc === "object") {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown> | undefined ?? {}) };
    for (const [k, v] of Object.entries(loc as Record<string, unknown>)) {
      const baseV = (base && typeof base === "object" && !Array.isArray(base))
        ? (base as Record<string, unknown>)[k]
        : undefined;
      out[k] = mergeLocale(baseV, v);
    }
    return out;
  }
  return loc;
}

async function ensurePageContent(pageSchema: PageSchema, locale: Locale) {
  await ensureSpanishSections(pageSchema);

  if (locale !== "es") {
    await ensureLocaleSections(pageSchema, locale);
  }
}

async function ensureSpanishSections(pageSchema: PageSchema) {
  const sectionKeys = pageSchema.sections.map((section) => section.key);
  if (sectionKeys.length === 0) return;

  const { data: existingRows, error } = await supabaseAdmin
    .from("content_sections")
    .select("section_key")
    .eq("locale", "es")
    .in("section_key", sectionKeys);

  if (error) throw new Error(error.message);

  const existing = new Set((existingRows ?? []).map((row) => row.section_key));
  const missing = pageSchema.sections.filter((section) => !existing.has(section.key));

  if (missing.length === 0) return;

  const payload = missing.map((section) => ({
    section_key: section.key,
    locale: "es" as const,
    content: section.defaults as Json,
    schema_version: 1,
    updated_by: null,
  }));

  const { error: upsertError } = await supabaseAdmin
    .from("content_sections")
    .upsert(payload, { onConflict: "section_key,locale" });

  if (upsertError) throw new Error(upsertError.message);
}

async function ensureLocaleSections(pageSchema: PageSchema, locale: Exclude<Locale, "es">) {
  const target = TARGETS.find((item) => item.locale === locale);
  if (!target) return;

  const sectionKeys = pageSchema.sections.map((section) => section.key);
  if (sectionKeys.length === 0) return;

  const [{ data: esRows, error: esError }, { data: localeRows, error: localeError }] = await Promise.all([
    supabaseAdmin
      .from("content_sections")
      .select("section_key, content")
      .eq("locale", "es")
      .in("section_key", sectionKeys),
    supabaseAdmin
      .from("content_sections")
      .select("section_key")
      .eq("locale", locale)
      .in("section_key", sectionKeys),
  ]);

  if (esError) throw new Error(esError.message);
  if (localeError) throw new Error(localeError.message);

  const existingLocale = new Set((localeRows ?? []).map((row) => row.section_key));
  const esMap = new Map((esRows ?? []).map((row) => [row.section_key, row.content as Record<string, unknown>]));
  const payload: Array<{
    section_key: string;
    locale: Exclude<Locale, "es">;
    content: Json;
    schema_version: number;
    updated_by: null;
  }> = [];

  for (const section of pageSchema.sections) {
    if (existingLocale.has(section.key)) continue;

    const source = withDefaults(section, esMap.get(section.key) ?? null);
    const translated = await translateSectionDefaults(source, section, target.name);
    if (!translated) continue;

    payload.push({
      section_key: section.key,
      locale,
      content: translated as Json,
      schema_version: 1,
      updated_by: null,
    });
  }

  if (payload.length === 0) return;

  const { error: upsertError } = await supabaseAdmin
    .from("content_sections")
    .upsert(payload, { onConflict: "section_key,locale" });

  if (upsertError) throw new Error(upsertError.message);
}

async function translateSectionDefaults(
  source: Record<string, unknown>,
  section: SectionSchema,
  targetLanguageName: string,
) {
  const translated = await translateContent(source, targetLanguageName);
  if (!translated) return null;
  return withDefaults(section, translated);
}

// ADMIN: read a single section (specific locale, or 'es' by default)
export const adminGetSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      sectionKey: z.string().min(1).max(128),
      locale: localeSchema.default("es"),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("content_sections")
      .select("section_key, content, schema_version, updated_at, updated_by, locale")
      .eq("section_key", data.sectionKey)
      .eq("locale", data.locale)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { section: row };
  });

// ADMIN: upsert a section's content for a given locale.
// When saving Spanish, kicks off background translation to CA and EN via Lovable AI.
export const adminSaveSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      sectionKey: z.string().min(1).max(128),
      content: z.record(z.unknown()),
      schemaVersion: z.number().int().min(1).max(1000).default(1),
      locale: localeSchema.default("es"),
      /** When true, skip the background translation step (used by the translator itself). */
      skipTranslate: z.boolean().default(false),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: row, error } = await supabase
      .from("content_sections")
      .upsert(
        {
          section_key: data.sectionKey,
          locale: data.locale,
          content: data.content as never,
          schema_version: data.schemaVersion,
          updated_by: userId,
        },
        { onConflict: "section_key,locale" },
      )
      .select("section_key, content, updated_at, locale")
      .single();

    if (error) throw new Error(error.message);

    // When Spanish source changes, translate to ca/en.
    // We MUST await this: in the Cloudflare Workers runtime, fire-and-forget
    // promises get cancelled as soon as the handler returns, and `waitUntil`
    // lives on the per-request ExecutionContext (not on globalThis), so the
    // previous background pattern silently dropped every translation.
    if (data.locale === "es" && !data.skipTranslate) {
      try {
        await translateAndSave(data.sectionKey, data.content, data.schemaVersion, userId);
      } catch (e) {
        // Don't fail the Spanish save if translation fails — log and continue.
        console.error("[content] translateAndSave failed", e);
      }
    }

    return { section: row };
  });

// ADMIN: history for a section (last 20 versions) for a given locale
export const adminGetSectionHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      sectionKey: z.string().min(1).max(128),
      locale: localeSchema.default("es"),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("content_section_history")
      .select("id, content, schema_version, saved_at, saved_by, locale")
      .eq("section_key", data.sectionKey)
      .eq("locale", data.locale)
      .order("saved_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return { history: rows ?? [] };
  });

// ADMIN: re-run translation for a section on demand (Spanish → CA/EN).
export const adminRetranslateSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ sectionKey: z.string().min(1).max(128) }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: row, error } = await supabaseAdmin
      .from("content_sections")
      .select("content, schema_version")
      .eq("section_key", data.sectionKey)
      .eq("locale", "es")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("No hay contenido en español para esta sección.");
    await translateAndSave(
      data.sectionKey,
      (row.content ?? {}) as Record<string, unknown>,
      row.schema_version ?? 1,
      userId,
    );
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Translation via Lovable AI Gateway
// ---------------------------------------------------------------------------

const TARGETS: { locale: Locale; name: string }[] = [
  { locale: "ca", name: "Catalan" },
  { locale: "en", name: "English" },
];

async function translateAndSave(
  sectionKey: string,
  esContent: Record<string, unknown>,
  schemaVersion: number,
  userId: string | null,
) {
  for (const target of TARGETS) {
    try {
      const translated = await translateContent(esContent, target.name);
      if (!translated) continue;
      const { error } = await supabaseAdmin
        .from("content_sections")
        .upsert(
          {
            section_key: sectionKey,
            locale: target.locale,
            content: translated as never,
            schema_version: schemaVersion,
            updated_by: userId,
          },
          { onConflict: "section_key,locale" },
        );
      if (error) console.error(`[content] save translation ${target.locale} failed`, error);
    } catch (e) {
      console.error(`[content] translate ${target.locale} failed`, e);
    }
  }
}

async function translateContent(
  esContent: Record<string, unknown>,
  targetLanguageName: string,
): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.warn("[content] LOVABLE_API_KEY missing — skipping translation");
    return null;
  }

  const system =
    `You are a professional translator for KLEFF, a Barcelona-based community of board game enthusiasts. ` +
    `Translate user-facing text fields from Spanish to ${targetLanguageName}. ` +
    `Rules: ` +
    `1) Preserve the JSON structure EXACTLY — same keys, same nesting, same array order and length. ` +
    `2) Translate only natural-language text values (titles, paragraphs, button labels, descriptions). ` +
    `3) DO NOT translate URLs, image paths, hex colors, identifiers (slugs, ids), or numbers. ` +
    `4) DO NOT translate brand names, product names or game names (e.g. "KLEFF", "Blood on the Clocktower", "Meetup", "WhatsApp", "L'Estació", "El Convento", "#TeamKLEFF"). ` +
    `5) Keep emojis as-is. Keep simple HTML/markdown if any. ` +
    `6) Keep the same tone: warm, energetic, community-driven. ` +
    `7) Empty strings ("") MUST stay empty. ` +
    `Respond with ONE JSON object only, no markdown, no explanation.`;

  const userMsg =
    `Translate the values of this JSON from Spanish to ${targetLanguageName}. ` +
    `Return the same shape with translated string values.\n\n` +
    JSON.stringify(esContent);

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
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error(`[content] AI gateway ${res.status}: ${txt.slice(0, 300)}`);
    return null;
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch (e) {
    console.error("[content] AI returned invalid JSON", e, content.slice(0, 300));
  }
  return null;
}
