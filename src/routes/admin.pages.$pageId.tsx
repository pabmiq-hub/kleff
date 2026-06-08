import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ExternalLink, Copy, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminListBlocks, adminCopyBlocksFromLocale } from "@/lib/blocks.functions";
import { BlockEditor } from "@/components/cms/BlockEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Local server fn (in a route file — only the page id needs lookup).
const getCustomPageById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ pageId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: page, error } = await supabaseAdmin
      .from("content_pages")
      .select("id, title, path, is_builtin, is_published, slug_es, slug_ca, slug_en")
      .eq("id", data.pageId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { page };
  });

const adminTogglePublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ pageId: z.string().uuid(), isPublished: z.boolean() }))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("content_pages")
      .update({ is_published: data.isPublished, updated_by: context.userId } as never)
      .eq("id", data.pageId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const Route = createFileRoute("/admin/pages/$pageId")({
  loader: async ({ params }) => {
    const { page } = await getCustomPageById({ data: { pageId: params.pageId } });
    if (!page) throw notFound();
    const { blocks } = await adminListBlocks({ data: { pageId: page.id, locale: "es" } });
    return { page, initialBlocks: blocks };
  },
  notFoundComponent: () => (
    <div className="p-8">
      <p className="text-cream/70">Esta página no existe.</p>
      <Link to="/admin/content" className="text-coral hover:underline mt-4 inline-block">← Volver</Link>
    </div>
  ),
  component: PageBlocksEditor,
});

function PageBlocksEditor() {
  const { page, initialBlocks } = Route.useLoaderData();
  const [locale, setLocale] = useState<"es" | "ca" | "en">("es");
  const [blocks, setBlocks] = useState(initialBlocks);
  const [loading, setLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(page.is_published);

  const listBlocks = useServerFn(adminListBlocks);
  const copy = useServerFn(adminCopyBlocksFromLocale);
  const togglePub = useServerFn(adminTogglePublished);

  const switchLocale = async (next: "es" | "ca" | "en") => {
    setLoading(true);
    try {
      const { blocks } = await listBlocks({ data: { pageId: page.id, locale: next } });
      setBlocks(blocks);
      setLocale(next);
    } finally {
      setLoading(false);
    }
  };

  const copyFromES = async () => {
    if (!window.confirm(`Sobrescribir los bloques de ${locale.toUpperCase()} con los de ES?`)) return;
    try {
      await copy({ data: { pageId: page.id, from: "es", to: locale, overwrite: true } });
      const { blocks } = await listBlocks({ data: { pageId: page.id, locale } });
      setBlocks(blocks);
      toast.success("Bloques copiados desde ES");
    } catch (e) { toast.error((e as Error).message); }
  };

  const toggle = async () => {
    try {
      await togglePub({ data: { pageId: page.id, isPublished: !isPublished } });
      setIsPublished(!isPublished);
      toast.success(isPublished ? "Página despublicada" : "Página publicada");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <header>
        <Link to="/admin/content" className="text-cream/60 hover:text-cream text-sm inline-flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Contenido
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-4xl font-bold">{page.title}</h1>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${isPublished ? "bg-emerald-500/15 text-emerald-300" : "bg-cream/10 text-cream/60"}`}>
                {isPublished ? "Publicada" : "Borrador"}
              </span>
            </div>
            <p className="text-cream/60 mt-1 font-mono text-sm">{page.path}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={toggle}>
              {isPublished ? "Despublicar" : "Publicar"}
            </Button>
            <a href={page.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-cream/10 hover:bg-cream/15 rounded-lg text-sm">
              Ver página <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <SlugsRow page={page} />

      <div className="flex items-center gap-2 flex-wrap">
        {(["es", "ca", "en"] as const).map((l) => (
          <button
            key={l}
            onClick={() => switchLocale(l)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              locale === l ? "bg-coral text-cream" : "bg-cream/5 text-cream/60 hover:text-cream"
            }`}
          >
            {l === "es" ? "🇪🇸 Castellano" : l === "ca" ? "🏴 Català" : "🇬🇧 English"}
          </button>
        ))}
        {locale !== "es" && (
          <Button variant="ghost" size="sm" onClick={copyFromES} className="text-xs">
            <Copy className="h-3.5 w-3.5 mr-1" /> Copiar desde ES
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-cream/50">Cargando…</div>
      ) : (
        <BlockEditor key={locale} pageId={page.id} locale={locale} initial={blocks} />
      )}
    </div>
  );
}

function SlugsRow({ page }: { page: { id: string; slug_es: string | null; slug_ca: string | null; slug_en: string | null } }) {
  return (
    <div className="bg-cream/5 border border-cream/15 rounded-xl p-4 grid gap-3 md:grid-cols-3">
      {(["es", "ca", "en"] as const).map((l) => {
        const slugKey = `slug_${l}` as const;
        return <SlugField key={l} pageId={page.id} locale={l} initial={page[slugKey] ?? ""} />;
      })}
    </div>
  );
}

const adminUpdateSlug = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    pageId: z.string().uuid(),
    locale: z.enum(["es", "ca", "en"]),
    slug: z.string().min(1).max(80).regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/),
  }))
  .handler(async ({ data, context }) => {
    const col = `slug_${data.locale}`;
    const payload: Record<string, unknown> = { [col]: data.slug, updated_by: context.userId };
    if (data.locale === "es") payload.path = `/${data.slug}`;
    const { error } = await supabaseAdmin
      .from("content_pages")
      .update(payload as never)
      .eq("id", data.pageId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

function SlugField({ pageId, locale, initial }: { pageId: string; locale: "es" | "ca" | "en"; initial: string }) {
  const [slug, setSlug] = useState(initial);
  const [saving, setSaving] = useState(false);
  const update = useServerFn(adminUpdateSlug);
  const prefix = locale === "es" ? "/" : `/${locale}/`;
  const dirty = slug !== initial && slug.length > 0;

  const save = async () => {
    setSaving(true);
    try {
      await update({ data: { pageId, locale, slug } });
      toast.success(`Slug ${locale.toUpperCase()} guardado`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="text-xs text-cream/60 mb-1 flex items-center gap-1.5">
        <Globe className="h-3 w-3" /> {locale.toUpperCase()}
      </div>
      <div className="flex items-center gap-1">
        <span className="font-mono text-xs text-cream/40">{prefix}</span>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          className="h-8 text-sm font-mono"
        />
        <Button size="sm" disabled={!dirty || saving} onClick={save} className="h-8 bg-coral hover:bg-coral-deep text-cream">
          {saving ? "…" : "✓"}
        </Button>
      </div>
    </div>
  );
}
