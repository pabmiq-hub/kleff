import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileText, ExternalLink, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { listContentPages, adminCreatePage, type PageRow } from "@/lib/overrides.functions";
import { adminDeletePage } from "@/lib/pages.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/content/")({
  loader: () => listContentPages(),
  component: ContentIndex,
});

function ContentIndex() {
  const initial = Route.useLoaderData();
  const [pages, setPages] = useState<PageRow[]>(initial.pages);
  const list = useServerFn(listContentPages);
  const create = useServerFn(adminCreatePage);
  const del = useServerFn(adminDeletePage);

  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const reload = async () => {
    const r = await list();
    setPages(r.pages);
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const r = await create({ data: { slug, title } });
      toast.success("Página creada");
      setOpen(false);
      setSlug("");
      setTitle("");
      await reload();
      // Open the new block editor in the same tab
      const pageId = (r.page as { id: string }).id;
      window.location.href = `/admin/pages/${pageId}`;
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl font-bold">Contenido de la web</h1>
          <p className="text-ink/60 mt-1 max-w-2xl">
            Haz clic en cualquier página para abrirla con el editor visual: podrás cambiar
            textos, colores, tipografía, imágenes y espaciado directamente sobre la web real.
          </p>
          <div className="mt-3 flex gap-3 text-sm">
            <Link to="/admin/content/urls" className="text-coral hover:underline">
              URLs por idioma →
            </Link>
            <Link to="/admin/content/redirects" className="text-coral hover:underline">
              Redirecciones 301 →
            </Link>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-coral hover:bg-coral-deep text-ink">
              <Plus className="h-4 w-4 mr-1.5" /> Nueva página
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear nueva página</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Eventos especiales"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-sm text-ink/50 font-mono">/p/</span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder="eventos-especiales"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !slug || !title}
                className="bg-coral hover:bg-coral-deep text-ink"
              >
                {creating ? "Creando…" : "Crear y editar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-3">
        {pages.map((page) => (
          <div
            key={page.id}
            className="bg-ink/5 border border-ink/15 rounded-2xl p-5 hover:border-coral/50 transition-colors"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex gap-4 items-start min-w-0 flex-1">
                <div className="h-10 w-10 rounded-xl bg-coral/15 text-coral flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-xl font-semibold text-ink">{page.title}</h2>
                    {!page.is_builtin && (
                      <span className="text-[10px] uppercase tracking-wider bg-coral/15 text-coral px-2 py-0.5 rounded">
                        Personalizada
                      </span>
                    )}
                    {!page.is_published && (
                      <span className="text-[10px] uppercase tracking-wider bg-ink/10 text-ink/60 px-2 py-0.5 rounded">
                        Borrador
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink/50 font-mono mt-0.5">{page.path}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={page.path}
                  target="_blank"
                  rel="noreferrer"
                  title="Ver"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-ink/5 hover:bg-ink/10 text-ink"
                >
                  <Eye className="h-4 w-4" />
                </a>
                {page.is_builtin ? (
                  <a
                    href={`${page.path}?edit=1`}
                    title="Editar"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-coral hover:bg-coral-deep text-ink"
                  >
                    <Pencil className="h-4 w-4" />
                  </a>
                ) : (
                  <>
                    <Link
                      to="/admin/pages/$pageId"
                      params={{ pageId: page.id }}
                      title="Editar bloques"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-coral hover:bg-coral-deep text-ink"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`¿Eliminar la página «${page.title}»? Esta acción no se puede deshacer.`)) return;
                        try {
                          await del({ data: { pageId: page.id } });
                          toast.success("Página eliminada");
                          await reload();
                        } catch (e) { toast.error((e as Error).message); }
                      }}
                      title="Eliminar"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-ink/5 hover:bg-red-500/15 text-ink/70 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
