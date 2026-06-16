import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList, Plus, ExternalLink, Trash2, Users, Loader2, Pencil, Settings, FileText, Link2 } from "lucide-react";
import { adminListForms, adminCreateForm, adminDeleteForm } from "@/lib/registrations.functions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/registrations/")({
  head: () => ({ meta: [{ title: "Inscripciones — Admin KLEFF" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminRegistrations,
});

type FormRow = {
  id: string; slug: string; title: string; kind: "form" | "external";
  is_published: boolean; external_mode: string | null;
  created_at: string; max_responses: number | null; closes_at: string | null; responses: number;
};

function AdminRegistrations() {
  const router = useRouter();
  const listFn = useServerFn(adminListForms);
  const createFn = useServerFn(adminCreateForm);
  const deleteFn = useServerFn(adminDeleteForm);
  const [forms, setForms] = useState<FormRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Two-step dialog state
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [kind, setKind] = useState<"form" | "external">("form");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [externalMode, setExternalMode] = useState<"redirect" | "iframe">("redirect");
  const [creating, setCreating] = useState(false);

  const reload = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await listFn();
      setForms(res.forms as FormRow[]);
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const resetDialog = () => {
    setStep(1); setKind("form"); setSlug(""); setTitle(""); setExternalUrl(""); setExternalMode("redirect");
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload: { slug: string; title: string; kind: "form" | "external"; external_mode?: "redirect" | "iframe"; external_url?: string } = {
        slug: slug.trim(),
        title: title.trim(),
        kind,
      };
      if (kind === "external") {
        payload.external_mode = externalMode;
        payload.external_url = externalUrl.trim();
      }
      const { id } = await createFn({ data: payload });
      toast.success("Inscripción creada");
      setOpen(false);
      resetDialog();
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
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (loadError) {
    return <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{loadError}</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-semibold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-coral" /> Inscripciones
          </h1>
          <p className="text-sm text-ink/70 mt-1">
            Crea formularios de inscripción accesibles en <code className="text-coral">kleff.es/&lt;slug&gt;</code>.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetDialog(); }}>
          <DialogTrigger asChild>
            <Button className="bg-coral hover:bg-coral/90 text-ink"><Plus className="h-4 w-4 mr-2" /> Nueva inscripción</Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-ink/15 text-ink max-w-lg">
            <DialogHeader>
              <DialogTitle>{step === 1 ? "¿Qué tipo de inscripción?" : "Configuración inicial"}</DialogTitle>
            </DialogHeader>
            {step === 1 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => { setKind("form"); setStep(2); }}
                  className="border-2 border-ink/15 hover:border-coral rounded-xl p-5 text-left transition-colors"
                >
                  <FileText className="h-7 w-7 text-coral mb-2" />
                  <div className="font-semibold text-ink">Formulario nativo</div>
                  <p className="text-xs text-ink/60 mt-1">Construye un formulario con preguntas y recoge inscritos aquí.</p>
                </button>
                <button
                  onClick={() => { setKind("external"); setStep(2); }}
                  className="border-2 border-ink/15 hover:border-coral rounded-xl p-5 text-left transition-colors"
                >
                  <Link2 className="h-7 w-7 text-coral mb-2" />
                  <div className="font-semibold text-ink">Enlace externo</div>
                  <p className="text-xs text-ink/60 mt-1">Redirige o embebe un formulario que vive en otra plataforma (Typeform, Google Forms…).</p>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-ink/60">Slug (URL)</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder="torneo-catan-2026"
                    className="bg-white border-ink/15 text-ink mt-1"
                  />
                  <p className="text-xs text-ink/50 mt-1">URL: kleff.es/{slug || "tu-slug"}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-ink/60">Título</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Inscripción Torneo Catan" className="bg-white border-ink/15 text-ink mt-1" />
                </div>
                {kind === "external" && (
                  <>
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-ink/60">Modo</Label>
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => setExternalMode("redirect")} className={`flex-1 px-3 py-2 rounded-lg border text-sm ${externalMode === "redirect" ? "border-coral bg-coral/5 text-ink" : "border-ink/15 text-ink/70"}`}>Redirigir</button>
                        <button onClick={() => setExternalMode("iframe")} className={`flex-1 px-3 py-2 rounded-lg border text-sm ${externalMode === "iframe" ? "border-coral bg-coral/5 text-ink" : "border-ink/15 text-ink/70"}`}>Embeder</button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-ink/60">URL externa</Label>
                      <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://forms.google.com/…" className="bg-white border-ink/15 text-ink mt-1" />
                    </div>
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              {step === 2 && (
                <Button variant="ghost" onClick={() => setStep(1)}>← Atrás</Button>
              )}
              {step === 2 && (
                <Button
                  onClick={handleCreate}
                  disabled={!slug || !title || (kind === "external" && !externalUrl) || creating}
                  className="bg-coral hover:bg-coral/90"
                >
                  {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Crear
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="rounded-lg border border-ink/10 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-wider text-ink/60">
            <tr>
              <th className="px-4 py-3">Inscripción</th>
              <th className="px-4 py-3 text-center w-24">Estado</th>
              <th className="px-4 py-3 text-center w-32">Respuestas</th>
              <th className="px-4 py-3 w-56">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-ink/60"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Cargando inscripciones…</span></td></tr>
            ) : forms.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-ink/60">Aún no hay inscripciones.</td></tr>
            ) : forms.map((f) => (
              <tr key={f.id} className="border-t border-ink/10 hover:bg-cream/[0.02]">
                <td className="px-4 py-3">
                  <Link to="/admin/registrations/$id" params={{ id: f.id }} className="font-medium text-ink hover:text-coral">{f.title || f.slug}</Link>
                  <div className="text-xs text-ink/50 mt-0.5">kleff.es/{f.slug}{f.kind === "external" ? ` · externo (${f.external_mode ?? "redirect"})` : ""}</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${f.is_published ? "bg-emerald-500/20 text-emerald-700" : "bg-ink/10 text-ink/60"}`}>{f.is_published ? "Publicado" : "Borrador"}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {f.kind === "form" ? (
                    <span className="inline-flex items-center gap-1 text-ink/80"><Users className="h-3.5 w-3.5" /> {f.responses}{f.max_responses ? ` / ${f.max_responses}` : ""}</span>
                  ) : (
                    <span className="text-ink/40 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <Link to="/admin/registrations/$id" params={{ id: f.id }} className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-coral/10 text-coral hover:bg-coral/20 text-xs font-medium" title={f.is_published ? "Gestionar" : "Continuar borrador"}>
                      {f.is_published ? <><Settings className="h-3.5 w-3.5" /> Gestionar</> : <><Pencil className="h-3.5 w-3.5" /> Editar</>}
                    </Link>
                    {f.is_published && <a href={`/${f.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-md text-ink/70 hover:text-ink hover:bg-ink/10" title="Ver pública"><ExternalLink className="h-3.5 w-3.5" /></a>}
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(f.id, f.title || f.slug)} className="text-ink/70 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0" title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></Button>
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
