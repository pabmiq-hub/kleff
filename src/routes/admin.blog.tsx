import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Newspaper, Download, Languages, Loader2, CheckCircle2, AlertCircle, ExternalLink, Image as ImageIcon, Plus, Pencil } from "lucide-react";
import { adminListBlogPosts, adminImportWordPress, adminTranslateBlogPost, adminMirrorBlogImages, type AdminBlogPostRow } from "@/lib/blog.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/blog")({
  loader: () => adminListBlogPosts(),
  head: () => ({
    meta: [
      { title: "Blog — Admin KLEFF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminBlog,
});

function AdminBlog() {
  const { posts } = Route.useLoaderData() as { posts: AdminBlogPostRow[] };
  const router = useRouter();
  const importFn = useServerFn(adminImportWordPress);
  const translateFn = useServerFn(adminTranslateBlogPost);
  const mirrorFn = useServerFn(adminMirrorBlogImages);
  const [importing, setImporting] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [bulkTranslating, setBulkTranslating] = useState(false);
  const [mirroring, setMirroring] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await importFn({ data: { baseUrl: "https://kleff.es", perPage: 100 } });
      toast.success(`Importación completada: ${res.imported} posts importados de ${res.total}`);
      await router.invalidate();
    } catch (e) {
      toast.error(`Error al importar: ${(e as Error).message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleTranslate = async (id: string) => {
    setTranslatingId(id);
    try {
      const res = await translateFn({ data: { id, force: false } });
      toast.success(`Post traducido (${res.fieldsUpdated} campos actualizados)`);
      await router.invalidate();
    } catch (e) {
      toast.error(`Error al traducir: ${(e as Error).message}`);
    } finally {
      setTranslatingId(null);
    }
  };

  const handleBulkTranslate = async () => {
    const pending = posts.filter((p) => !p.hasEs || !p.hasCa);
    if (pending.length === 0) {
      toast.info("Todos los posts ya están traducidos");
      return;
    }
    setBulkTranslating(true);
    setProgress({ done: 0, total: pending.length });
    let ok = 0;
    let ko = 0;
    for (let i = 0; i < pending.length; i++) {
      try {
        await translateFn({ data: { id: pending[i].id, force: false } });
        ok++;
      } catch (e) {
        console.error("translate failed", pending[i].slug, e);
        ko++;
      }
      setProgress({ done: i + 1, total: pending.length });
    }
    toast.success(`Traducciones: ${ok} OK, ${ko} fallidas`);
    setBulkTranslating(false);
    setProgress(null);
    await router.invalidate();
  };

  const totalEs = posts.filter((p) => p.hasEs).length;
  const totalCa = posts.filter((p) => p.hasCa).length;
  const totalEn = posts.filter((p) => !!p.title_en).length;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-semibold flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-coral" /> Blog
          </h1>
          <p className="text-sm text-cream/70 mt-1">
            Importa los posts desde tu WordPress (kleff.es) y gestiona las traducciones automáticas.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/blog/new" className="inline-flex items-center gap-2 bg-coral hover:bg-coral/90 text-cream rounded-md px-3 py-2 text-sm font-medium">
            <Plus className="h-4 w-4" /> Nuevo post
          </Link>
          <Button onClick={handleImport} disabled={importing} variant="outline" className="border-cream/20 text-cream hover:bg-cream/10">
            {importing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Importar de WordPress
          </Button>
          <Button
            onClick={handleBulkTranslate}
            disabled={bulkTranslating || posts.length === 0}
            variant="outline"
            className="border-cream/20 text-cream hover:bg-cream/10"
          >
            {bulkTranslating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Languages className="h-4 w-4 mr-2" />
            )}
            Traducir todos los pendientes
          </Button>
          <Button
            onClick={async () => {
              setMirroring(true);
              try {
                const res = await mirrorFn();
                toast.success(`Imágenes rehospedadas: ${res.covers} portadas, ${res.inline} dentro del contenido${res.failed ? ` (${res.failed} fallidas)` : ""}`);
                await router.invalidate();
              } catch (e) {
                toast.error(`Error: ${(e as Error).message}`);
              } finally {
                setMirroring(false);
              }
            }}
            disabled={mirroring || posts.length === 0}
            variant="outline"
            className="border-cream/20 text-cream hover:bg-cream/10"
          >
            {mirroring ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4 mr-2" />
            )}
            Rehospedar imágenes
          </Button>
        </div>
      </header>

      {progress && (
        <div className="rounded-lg border border-cream/10 bg-cream/5 p-4">
          <div className="flex items-center justify-between text-sm text-cream/80 mb-2">
            <span>Traduciendo posts…</span>
            <span>{progress.done} / {progress.total}</span>
          </div>
          <div className="h-2 rounded-full bg-cream/10 overflow-hidden">
            <div
              className="h-full bg-coral transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Posts" value={posts.length} />
        <Stat label="ES traducidos" value={`${totalEs} / ${totalEn}`} />
        <Stat label="CA traducidos" value={`${totalCa} / ${totalEn}`} />
      </div>

      <div className="rounded-lg border border-cream/10 bg-cream/[0.03] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream/5 text-left text-xs uppercase tracking-wider text-cream/60">
            <tr>
              <th className="px-4 py-3">Post</th>
              <th className="px-4 py-3 text-center w-20">EN</th>
              <th className="px-4 py-3 text-center w-20">ES</th>
              <th className="px-4 py-3 text-center w-20">CA</th>
              <th className="px-4 py-3 w-48">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-cream/60">
                  Aún no hay posts. Pulsa "Importar de WordPress" para empezar.
                </td>
              </tr>
            ) : (
              posts.map((p) => (
                <tr key={p.id} className="border-t border-cream/10 hover:bg-cream/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-cream">{p.title_en ?? p.slug}</div>
                    <div className="text-xs text-cream/50 mt-0.5">
                      /{p.slug} · {new Date(p.published_at).toLocaleDateString("es-ES")}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.title_en ? <CheckCircle2 className="h-4 w-4 text-emerald-400 inline" /> : <AlertCircle className="h-4 w-4 text-amber-400 inline" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.hasEs ? <CheckCircle2 className="h-4 w-4 text-emerald-400 inline" /> : <AlertCircle className="h-4 w-4 text-amber-400 inline" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.hasCa ? <CheckCircle2 className="h-4 w-4 text-emerald-400 inline" /> : <AlertCircle className="h-4 w-4 text-amber-400 inline" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTranslate(p.id)}
                        disabled={translatingId === p.id || bulkTranslating}
                        className="text-cream/80 hover:text-cream hover:bg-cream/10 h-8 px-2"
                      >
                        {translatingId === p.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Languages className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <a
                        href={`/en/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-cream/80 hover:text-cream hover:bg-cream/10"
                        title="Ver post en inglés"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-cream/10 bg-cream/[0.03] p-4">
      <div className="text-xs uppercase tracking-wider text-cream/60">{label}</div>
      <div className="text-2xl font-display font-semibold text-cream mt-1">{value}</div>
    </div>
  );
}
