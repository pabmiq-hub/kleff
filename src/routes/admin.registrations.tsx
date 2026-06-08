import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList, Plus, ExternalLink, Trash2, Users, Loader2 } from "lucide-react";
import { adminListForms, adminCreateForm, adminDeleteForm } from "@/lib/registrations.functions";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/registrations")({
  loader: () => adminListForms(),
  head: () => ({ meta: [{ title: "Inscripciones — Admin KLEFF" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminRegistrations,
});

function AdminRegistrations() {
  const { forms } = Route.useLoaderData() as { forms: Array<{ id: string; slug: string; title_es: string; is_published: boolean; external_mode: string | null; created_at: string; max_responses: number | null; closes_at: string | null; responses: number }> };
  const router = useRouter();
  const createFn = useServerFn(adminCreateForm);
  const deleteFn = useServerFn(adminDeleteForm);
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { id } = await createFn({ data: { slug: slug.trim(), title_es: title.trim() } });
      toast.success("Inscripción creada");
      setOpen(false);
      setSlug(""); setTitle("");
      router.navigate({ to: "/admin/registrations/$id", params: { id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la inscripción "${name}"? Se borrarán también sus respuestas.`)) return;
    try {
      await deleteFn({ data: { id } });
      toast.success("Inscripción eliminada");
      await router.invalidate();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-semibold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-coral" /> Inscripciones
          </h1>
          <p className="text-sm text-cream/70 mt-1">
            Crea formularios de inscripción accesibles en <code className="text-coral">/inscripcion/&lt;slug&gt;</code>.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-coral hover:bg-coral/90 text-cream"><Plus className="h-4 w-4 mr-2" /> Nueva inscripción</Button>
          </DialogTrigger>
          <DialogContent className="bg-ink border-cream/15 text-cream">
            <DialogHeader>
              <DialogTitle>Nueva inscripción</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-cream/60 mb-1 block">Slug (URL)</label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="torneo-catan-2026" className="bg-ink/60 border-cream/15 text-cream" />
                <p className="text-xs text-cream/50 mt-1">URL: /inscripcion/{slug || "tu-slug"}</p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-cream/60 mb-1 block">Título</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Inscripción Torneo Catan" className="bg-ink/60 border-cream/15 text-cream" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!slug || !title || creating} className="bg-coral hover:bg-coral/90">
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="rounded-lg border border-cream/10 bg-cream/[0.03] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream/5 text-left text-xs uppercase tracking-wider text-cream/60">
            <tr>
              <th className="px-4 py-3">Inscripción</th>
              <th className="px-4 py-3 text-center w-24">Estado</th>
              <th className="px-4 py-3 text-center w-32">Respuestas</th>
              <th className="px-4 py-3 w-32">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {forms.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-cream/60">Aún no hay inscripciones.</td></tr>
            ) : forms.map((f) => (
              <tr key={f.id} className="border-t border-cream/10 hover:bg-cream/[0.02]">
                <td className="px-4 py-3">
                  <Link to="/admin/registrations/$id" params={{ id: f.id }} className="font-medium text-cream hover:text-coral">{f.title_es || f.slug}</Link>
                  <div className="text-xs text-cream/50 mt-0.5">/inscripcion/{f.slug}{f.external_mode ? ` · externo (${f.external_mode})` : ""}</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${f.is_published ? "bg-emerald-500/20 text-emerald-300" : "bg-cream/10 text-cream/60"}`}>
                    {f.is_published ? "Publicado" : "Borrador"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 text-cream/80"><Users className="h-3.5 w-3.5" /> {f.responses}{f.max_responses ? ` / ${f.max_responses}` : ""}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {f.is_published && (
                      <a href={`/inscripcion/${f.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-md text-cream/80 hover:text-cream hover:bg-cream/10" title="Ver pública"><ExternalLink className="h-3.5 w-3.5" /></a>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(f.id, f.title_es || f.slug)} className="text-cream/80 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
