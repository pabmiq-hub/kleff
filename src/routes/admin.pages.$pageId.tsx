import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ExternalLink, Copy, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminListBlocks, adminCopyBlocksFromLocale } from "@/lib/blocks.functions";
import { getCustomPageById, adminTogglePublishedPage, adminUpdatePageMeta } from "@/lib/pages.functions";
import { BlockEditor } from "@/components/cms/BlockEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/pages/$pageId")({
  component: PageBlocksEditor,
});

type PageData = { id: string; title: string; path: string | null; is_builtin: boolean; is_published: boolean; slug_es: string | null; slug_ca: string | null; slug_en: string | null };

function PageBlocksEditor() {
  const { pageId } = Route.useParams();
  const getPage = useServerFn(getCustomPageById);
  const listBlocks = useServerFn(adminListBlocks);
  const copy = useServerFn(adminCopyBlocksFromLocale);
  const togglePub = useServerFn(adminTogglePublishedPage);
  const updateMeta = useServerFn(adminUpdatePageMeta);

  const [page, setPage] = useState<PageData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [locale, setLocale] = useState<"es" | "ca" | "en">("es");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { page: p } = await getPage({ data: { pageId } });
        if (!p) { if (!cancelled) setLoadError("Esta página no existe."); return; }
        const { blocks: bs } = await listBlocks({ data: { pageId: p.id, locale: "es" } });
        if (cancelled) return;
        setPage(p as PageData);
        setBlocks(bs);
        setIsPublished(p.is_published);
        setTitle(p.title);
      } catch (e) {
        if (!cancelled) setLoadError((e as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, [pageId, getPage, listBlocks]);

  if (loadError) return (
    <div className="p-8 space-y-3">
      <p className="text-red-400">{loadError}</p>
      <Link to="/admin/content" className="text-coral hover:underline">← Volver</Link>
    </div>
  );
  if (!page) return <div className="p-6 text-ink/60 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>;



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

  const saveTitle = async () => {
    if (title === page.title) return;
    try {
      await updateMeta({ data: { pageId: page.id, title } });
      toast.success("Título guardado");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <header>
        <Link to="/admin/content" className="text-ink/60 hover:text-ink text-sm inline-flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Contenido
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                className="font-display text-3xl font-bold bg-transparent border-0 px-0 focus-visible:ring-0 h-auto"
              />
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${isPublished ? "bg-emerald-500/15 text-emerald-300" : "bg-ink/10 text-ink/60"}`}>
                {isPublished ? "Publicada" : "Borrador"}
              </span>
            </div>
            <p className="text-ink/60 mt-1 font-mono text-sm">{page.path}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={toggle}>
              {isPublished ? "Despublicar" : "Publicar"}
            </Button>
            <a href={page.path ?? "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-ink/10 hover:bg-cream/15 rounded-lg text-sm">
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
              locale === l ? "bg-coral text-ink" : "bg-ink/5 text-ink/60 hover:text-ink"
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
        <div className="text-center py-12 text-ink/50">Cargando…</div>
      ) : (
        <BlockEditor key={locale} pageId={page.id} locale={locale} initial={blocks} />
      )}
    </div>
  );
}

function SlugsRow({ page }: { page: { id: string; slug_es: string | null; slug_ca: string | null; slug_en: string | null } }) {
  return (
    <div className="bg-ink/5 border border-ink/15 rounded-xl p-4 grid gap-3 md:grid-cols-3">
      {(["es", "ca", "en"] as const).map((l) => {
        const slugKey = `slug_${l}` as const;
        return <SlugField key={l} pageId={page.id} locale={l} initial={page[slugKey] ?? ""} />;
      })}
    </div>
  );
}

function SlugField({ pageId, locale, initial }: { pageId: string; locale: "es" | "ca" | "en"; initial: string }) {
  const [slug, setSlug] = useState(initial);
  const [saving, setSaving] = useState(false);
  const update = useServerFn(adminUpdatePageMeta);
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
      <div className="text-xs text-ink/60 mb-1 flex items-center gap-1.5">
        <Globe className="h-3 w-3" /> {locale.toUpperCase()}
      </div>
      <div className="flex items-center gap-1">
        <span className="font-mono text-xs text-ink/40">{prefix}</span>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          className="h-8 text-sm font-mono"
        />
        <Button size="sm" disabled={!dirty || saving} onClick={save} className="h-8 bg-coral hover:bg-coral-deep text-ink">
          {saving ? "…" : "✓"}
        </Button>
      </div>
    </div>
  );
}
