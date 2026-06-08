import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Globe, Save, ChevronLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  listPageSlugs,
  adminUpdatePageSlug,
  type PageSlugRow,
} from "@/lib/urls.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/content/urls")({
  loader: () => listPageSlugs(),
  component: UrlsAdmin,
});

const LOCALES = [
  { code: "es" as const, label: "Castellano", flag: "🇪🇸", prefix: "" },
  { code: "ca" as const, label: "Català", flag: "🇨🇦", prefix: "/ca" },
  { code: "en" as const, label: "English", flag: "🇬🇧", prefix: "/en" },
];

function UrlsAdmin() {
  const initial = Route.useLoaderData();
  const [pages, setPages] = useState<PageSlugRow[]>(initial.pages);
  const list = useServerFn(listPageSlugs);

  const reload = async () => {
    const r = await list();
    setPages(r.pages);
  };

  return (
    <div className="space-y-6">
      <header>
        <Link
          to="/admin/content"
          className="text-ink/60 hover:text-ink text-sm inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Contenido
        </Link>
        <h1 className="font-display text-4xl font-bold mt-2">URLs por idioma</h1>
        <p className="text-ink/60 mt-1 max-w-2xl">
          Edita el slug de cada página en cada idioma. Cuando cambies un slug se creará
          automáticamente una redirección 301 desde la URL antigua.
        </p>
        <div className="mt-3">
          <Link
            to="/admin/content/redirects"
            className="text-coral hover:underline text-sm inline-flex items-center gap-1"
          >
            Ver redirecciones 301 →
          </Link>
        </div>
      </header>

      <div className="space-y-4">
        {pages.map((p) => (
          <PageRow key={p.id} page={p} onSaved={reload} />
        ))}
      </div>
    </div>
  );
}

function PageRow({ page, onSaved }: { page: PageSlugRow; onSaved: () => void | Promise<void> }) {
  const isHome = page.page_key === "home";
  return (
    <div className="bg-ink/5 border border-ink/15 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-xl bg-coral/15 text-coral flex items-center justify-center">
          <Globe className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold">{page.title}</h2>
          <p className="text-xs text-ink/40 font-mono">page_key: {page.page_key ?? "—"}</p>
        </div>
        <a
          href={page.path}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-ink/60 hover:text-ink inline-flex items-center gap-1"
        >
          {page.path} <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {isHome ? (
        <p className="text-sm text-ink/50 italic">
          La página de inicio siempre vive en <code className="font-mono">/</code> (ES) y bajo
          el prefijo de cada idioma. No es editable.
        </p>
      ) : (
        <div className="grid md:grid-cols-3 gap-3">
          {LOCALES.map((l) => (
            <SlugEditor
              key={l.code}
              pageId={page.id}
              locale={l.code}
              prefix={l.prefix}
              flag={l.flag}
              label={l.label}
              initialSlug={page[`slug_${l.code}` as const] ?? ""}
              onSaved={onSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SlugEditor({
  pageId,
  locale,
  prefix,
  flag,
  label,
  initialSlug,
  onSaved,
}: {
  pageId: string;
  locale: "es" | "ca" | "en";
  prefix: string;
  flag: string;
  label: string;
  initialSlug: string;
  onSaved: () => void | Promise<void>;
}) {
  const update = useServerFn(adminUpdatePageSlug);
  const [slug, setSlug] = useState(initialSlug);
  const [saving, setSaving] = useState(false);

  useEffect(() => setSlug(initialSlug), [initialSlug]);

  const dirty = slug !== initialSlug;

  const handleSave = async () => {
    setSaving(true);
    try {
      await update({ data: { pageId, locale, slug } });
      toast.success(`Slug ${label} guardado. Redirección 301 creada.`);
      await onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-ink/40 border border-ink/10 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-2 text-xs text-ink/60 font-medium">
        <span>{flag}</span> <span>{label}</span>
      </div>
      <div className="flex items-center gap-1 mb-2">
        <span className="text-xs font-mono text-ink/40 shrink-0">{prefix}/</span>
        <Input
          value={slug}
          onChange={(e) =>
            setSlug(
              e.target.value
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "")
            )
          }
          placeholder={locale === "es" ? "sobre-nosotros" : locale === "ca" ? "sobre-nosaltres" : "about"}
          className="h-8 text-sm font-mono"
        />
      </div>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={!dirty || saving || !slug}
        className="w-full h-7 text-xs bg-coral hover:bg-coral-deep text-ink disabled:opacity-40"
      >
        <Save className="h-3 w-3 mr-1" /> {saving ? "Guardando…" : "Guardar"}
      </Button>
    </div>
  );
}
