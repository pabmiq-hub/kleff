import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertSuperAdmin } from "@/lib/assert-role.server";
// sanitizeHtml is imported lazily inside admin handlers to avoid pulling
// isomorphic-dompurify (and its jsdom dep) into the public read path,
// which crashes SSR in the Worker runtime with
// "Cannot read properties of undefined (reading 'bind')".
import type { Block, BlockType, Locale } from "@/cms/blockTypes";

async function sanitizeBlockData(data: Record<string, unknown> | undefined): Promise<Record<string, unknown> | undefined> {
  if (!data) return data;
  const out: Record<string, unknown> = { ...data };
  if (typeof out.html === "string") {
    const { sanitizeHtml } = await import("@/lib/sanitize.server");
    out.html = sanitizeHtml(out.html);
  }
  return out;
}

const localeSchema = z.enum(["es", "ca", "en"]);
const blockTypeSchema = z.enum([
  "heading", "paragraph", "image", "embed", "cta", "divider", "quote", "form_embed",
  "hero", "columns", "gallery", "cards", "button",
]);

export type BlockRow = {
  id: string;
  page_id: string;
  locale: Locale;
  position: number;
  type: BlockType;
  hidden: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};

// PUBLIC: fetch all blocks for a page id + locale (with es fallback when empty).
export const getPageBlocks = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      pageId: z.string().uuid(),
      locale: localeSchema.default("es"),
    }),
  )
  .handler(async ({ data }) => {
    // Try requested locale, fall back to ES if nothing exists.
    const { data: rows, error } = await supabaseAdmin
      .from("content_page_blocks")
      .select("*")
      .eq("page_id", data.pageId)
      .eq("locale", data.locale)
      .eq("hidden", false)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);

    let result = (rows ?? []) as unknown as BlockRow[];
    if (result.length === 0 && data.locale !== "es") {
      const { data: esRows } = await supabaseAdmin
        .from("content_page_blocks")
        .select("*")
        .eq("page_id", data.pageId)
        .eq("locale", "es")
        .eq("hidden", false)
        .order("position", { ascending: true });
      result = (esRows ?? []) as unknown as BlockRow[];
    }
    return { blocks: result };
  });

// Resolve a custom page by its slug in any locale. Returns the page row + the locale matched.
export const resolveCustomPage = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string().min(1).max(80), locale: localeSchema.default("es") }))
  .handler(async ({ data }) => {
    const slugCol = `slug_${data.locale}` as "slug_es" | "slug_ca" | "slug_en";
    // First match by the locale slug, then fall back to ES slug.
    const { data: row } = await supabaseAdmin
      .from("content_pages")
      .select("id, title, path, is_published, template, slug_es, slug_ca, slug_en")
      .eq(slugCol, data.slug)
      .eq("is_builtin", false)
      .maybeSingle();

    if (row) return { page: row };

    const { data: esRow } = await supabaseAdmin
      .from("content_pages")
      .select("id, title, path, is_published, template, slug_es, slug_ca, slug_en")
      .eq("slug_es", data.slug)
      .eq("is_builtin", false)
      .maybeSingle();
    return { page: esRow ?? null };
  });

// ADMIN: list all blocks for a page (all locales)
export const adminListBlocks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ pageId: z.string().uuid(), locale: localeSchema.default("es") }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { data: rows, error } = await supabaseAdmin
      .from("content_page_blocks")
      .select("*")
      .eq("page_id", data.pageId)
      .eq("locale", data.locale)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return { blocks: (rows ?? []) as unknown as BlockRow[] };
  });

// ADMIN: create a new block at given position
export const adminCreateBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      pageId: z.string().uuid(),
      locale: localeSchema,
      type: blockTypeSchema,
      position: z.number().int().min(0).max(10000),
      data: z.record(z.unknown()),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { userId } = context;
    // Shift positions of blocks at or after `position`
    await supabaseAdmin.rpc; // noop — using raw update below
    const { data: existing } = await supabaseAdmin
      .from("content_page_blocks")
      .select("id, position")
      .eq("page_id", data.pageId)
      .eq("locale", data.locale)
      .gte("position", data.position)
      .order("position", { ascending: false });
    for (const r of existing ?? []) {
      await supabaseAdmin
        .from("content_page_blocks")
        .update({ position: (r as { position: number }).position + 1 })
        .eq("id", (r as { id: string }).id);
    }
    const { data: row, error } = await supabaseAdmin
      .from("content_page_blocks")
      .insert({
        page_id: data.pageId,
        locale: data.locale,
        type: data.type,
        position: data.position,
        data: (await sanitizeBlockData(data.data)) as never,
        created_by: userId,
        updated_by: userId,
      } as never)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { block: row as unknown as BlockRow };
  });

// ADMIN: update block data / hidden state
export const adminUpdateBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      blockId: z.string().uuid(),
      data: z.record(z.unknown()).optional(),
      hidden: z.boolean().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const payload: Record<string, unknown> = { updated_by: context.userId };
    if (data.data !== undefined) payload.data = await sanitizeBlockData(data.data);
    if (data.hidden !== undefined) payload.hidden = data.hidden;
    const { error } = await supabaseAdmin
      .from("content_page_blocks")
      .update(payload as never)
      .eq("id", data.blockId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ADMIN: delete block
export const adminDeleteBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ blockId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("content_page_blocks")
      .delete()
      .eq("id", data.blockId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ADMIN: reorder blocks (bulk update positions)
export const adminReorderBlocks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      pageId: z.string().uuid(),
      locale: localeSchema,
      orderedIds: z.array(z.string().uuid()).min(1).max(500),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    // Update positions one by one (small N expected, <100)
    await Promise.all(
      data.orderedIds.map((id, idx) =>
        supabaseAdmin
          .from("content_page_blocks")
          .update({ position: idx } as never)
          .eq("id", id)
          .eq("page_id", data.pageId)
          .eq("locale", data.locale),
      ),
    );
    return { ok: true };
  });

// ADMIN: copy blocks from one locale to another (e.g. seed translations from ES)
export const adminCopyBlocksFromLocale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      pageId: z.string().uuid(),
      from: localeSchema,
      to: localeSchema,
      overwrite: z.boolean().default(false),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    if (data.from === data.to) throw new Error("Origen y destino son iguales");
    const { data: source, error } = await supabaseAdmin
      .from("content_page_blocks")
      .select("*")
      .eq("page_id", data.pageId)
      .eq("locale", data.from)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);

    if (data.overwrite) {
      await supabaseAdmin
        .from("content_page_blocks")
        .delete()
        .eq("page_id", data.pageId)
        .eq("locale", data.to);
    }

    const rows = (source ?? []) as unknown as BlockRow[];
    if (rows.length === 0) return { copied: 0 };
    const payload = rows.map((r) => ({
      page_id: data.pageId,
      locale: data.to,
      position: r.position,
      type: r.type,
      hidden: r.hidden,
      data: r.data as never,
      created_by: context.userId,
      updated_by: context.userId,
    }));
    const { error: insErr } = await supabaseAdmin
      .from("content_page_blocks")
      .insert(payload as never);
    if (insErr) throw new Error(insErr.message);
    return { copied: payload.length };
  });

export const adminTranslatePageBlocks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ pageId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    return translateAndReplacePageBlocks(data.pageId, context.userId);
  });

const TRANSLATION_TARGETS: { locale: Exclude<Locale, "es">; name: string }[] = [
  { locale: "ca", name: "Catalan" },
  { locale: "en", name: "English" },
];

async function translateAndReplacePageBlocks(pageId: string, userId: string) {
  const { data: source, error } = await supabaseAdmin
    .from("content_page_blocks")
    .select("*")
    .eq("page_id", pageId)
    .eq("locale", "es")
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);

  const rows = (source ?? []) as unknown as BlockRow[];
  let translatedLocales = 0;
  for (const target of TRANSLATION_TARGETS) {
    const translated = rows.length > 0 ? await translateBlockRows(rows, target.name) : [];
    const { error: deleteError } = await supabaseAdmin
      .from("content_page_blocks")
      .delete()
      .eq("page_id", pageId)
      .eq("locale", target.locale);
    if (deleteError) throw new Error(deleteError.message);

    if (rows.length === 0) {
      translatedLocales += 1;
      continue;
    }

    const payload = rows.map((row, idx) => ({
      page_id: pageId,
      locale: target.locale,
      position: row.position,
      type: row.type,
      hidden: row.hidden,
      data: (translated[idx] ?? row.data) as never,
      created_by: userId,
      updated_by: userId,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("content_page_blocks")
      .insert(payload as never);
    if (insertError) throw new Error(insertError.message);
    translatedLocales += 1;
  }

  return { ok: true, translatedLocales, blocks: rows.length };
}

async function translateBlockRows(rows: BlockRow[], targetLanguageName: string): Promise<Record<string, unknown>[]> {
  const translated = await translateJsonForBlocks(
    {
      blocks: rows.map((row) => ({ type: row.type, data: row.data })),
    },
    targetLanguageName,
  );
  const blocks = Array.isArray(translated?.blocks) ? translated.blocks : [];
  return rows.map((row, idx) => {
    const translatedBlock = blocks[idx];
    if (translatedBlock && typeof translatedBlock === "object" && !Array.isArray(translatedBlock)) {
      const candidate = (translatedBlock as { data?: unknown }).data;
      if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
        return candidate as Record<string, unknown>;
      }
    }
    return row.data as Record<string, unknown>;
  });
}

async function translateJsonForBlocks(
  esContent: Record<string, unknown>,
  targetLanguageName: string,
): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.warn("[blocks] LOVABLE_API_KEY missing — skipping block translation");
    return null;
  }

  const system =
    `You are a professional translator for KLEFF, a Barcelona-based community of board game enthusiasts. ` +
    `Translate user-facing text fields from Spanish to ${targetLanguageName}. ` +
    `Rules: ` +
    `1) Preserve the JSON structure EXACTLY — same keys, same nesting, same array order and length. ` +
    `2) Translate only natural-language text values: titles, subtitles, paragraphs, rich text HTML, button labels, captions, alt text, descriptions and quotes. ` +
    `3) DO NOT translate URLs, image paths, form slugs, ids, block types, hex colors, identifiers, numbers, booleans, or empty strings. ` +
    `4) DO NOT translate brand names, product names or game names (e.g. "KLEFF", "Blood on the Clocktower", "Meetup", "WhatsApp", "L'Estació", "El Convento", "#TeamKLEFF"). ` +
    `5) Preserve valid HTML tags and attributes while translating only the visible text inside HTML. ` +
    `6) Keep the same warm, energetic, community-driven tone. ` +
    `Respond with ONE JSON object only, no markdown, no explanation.`;

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
        { role: "user", content: `Translate this JSON from Spanish to ${targetLanguageName}:\n\n${JSON.stringify(esContent)}` },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error(`[blocks] AI gateway ${res.status}: ${txt.slice(0, 300)}`);
    return null;
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch (e) {
    console.error("[blocks] AI returned invalid JSON", e, content.slice(0, 300));
    return null;
  }
}

// PUBLIC: read by page-id (used for SSR loaders); also accepts an explicit list for forms embed
export type PublicPageBlocks = { blocks: BlockRow[] };
