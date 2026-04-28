import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listPages, createPage, deletePage, setPageStatus } from "@/server/cms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Plus, ExternalLink, Trash2, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin/content")({
  component: ContentPage,
});

type PageRow = {
  id: string;
  slug: string;
  locale: "es" | "ca" | "en";
  title: string;
  status: "draft" | "published";
  updated_at: string;
  published_at: string | null;
};

function ContentPage() {
  const list = useServerFn(listPages);
  const create = useServerFn(createPage);
  const del = useServerFn(deletePage);
  const setStatus = useServerFn(setPageStatus);
  const router = useRouter();

  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ slug: "", title: "", locale: "es" as "es" | "ca" | "en", description: "" });

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await list();
      setPages(r.pages as PageRow[]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    try {
      const r = await create({ data: form });
      toast.success("Página creada");
      setOpen(false);
      setForm({ slug: "", title: "", locale: "es", description: "" });
      void router.navigate({ to: "/admin/content/$id", params: { id: r.page.id } });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Borrar esta página y todos sus bloques?")) return;
    try {
      await del({ data: { id } });
      toast.success("Borrada");
      void refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const togglePublish = async (p: PageRow) => {
    try {
      await setStatus({ data: { id: p.id, status: p.status === "published" ? "draft" : "published" } });
      void refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl font-bold">Contenido</h1>
          <p className="text-cream/60 mt-1">Páginas de la web. Cada página es una colección de bloques visuales.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-coral hover:bg-coral-deep text-cream">
              <Plus className="h-4 w-4 mr-2" /> Nueva página
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear página</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  placeholder="ej: nosotros"
                />
                <p className="text-xs text-muted-foreground mt-1">URL final: /p/{form.slug || "..."}</p>
              </div>
              <div>
                <Label>Idioma</Label>
                <select
                  className="w-full mt-2 bg-background border border-border rounded-md px-3 py-2 text-sm"
                  value={form.locale}
                  onChange={(e) => setForm({ ...form, locale: e.target.value as "es" | "ca" | "en" })}
                >
                  <option value="es">Español</option>
                  <option value="ca">Català</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <Label>Descripción SEO (opcional)</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!form.slug || !form.title} className="bg-coral hover:bg-coral-deep text-cream">
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? (
        <p className="text-cream/60">Cargando…</p>
      ) : pages.length === 0 ? (
        <div className="bg-cream/5 border border-cream/15 rounded-2xl p-10 text-center">
          <FileText className="h-10 w-10 mx-auto text-coral mb-3" />
          <p className="text-cream/70">No hay páginas todavía. Crea la primera para empezar.</p>
        </div>
      ) : (
        <div className="bg-cream/5 border border-cream/15 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream/5 text-cream/60 text-left">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Idioma</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className="border-t border-cream/10 hover:bg-cream/5">
                  <td className="px-4 py-3 font-medium text-cream">{p.title}</td>
                  <td className="px-4 py-3 text-cream/70">/p/{p.slug}</td>
                  <td className="px-4 py-3 uppercase text-cream/60">{p.locale}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        p.status === "published" ? "bg-green-500/20 text-green-300" : "bg-cream/10 text-cream/60"
                      }`}
                    >
                      {p.status === "published" ? "Publicada" : "Borrador"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      {p.status === "published" && (
                        <a
                          href={`/p/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 hover:bg-cream/10 rounded text-cream/60 hover:text-cream"
                          title="Ver"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => togglePublish(p)}
                        className="p-2 hover:bg-cream/10 rounded text-cream/60 hover:text-cream"
                        title={p.status === "published" ? "Despublicar" : "Publicar"}
                      >
                        {p.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <Link
                        to="/admin/content/$id"
                        params={{ id: p.id }}
                        className="px-3 py-1.5 bg-coral/20 hover:bg-coral/30 rounded text-coral text-xs font-medium"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 hover:bg-red-500/20 rounded text-cream/60 hover:text-red-300"
                        title="Borrar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
