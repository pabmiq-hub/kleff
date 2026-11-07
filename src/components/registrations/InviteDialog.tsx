import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/cms/RichTextEditor";
import { adminPreviewInvite, adminSendInvite } from "@/lib/registrations.functions";

type FormRow = { id: string; title: string; slug: string; kind: "form" | "external"; is_published: boolean; event_date: string | null; closes_at: string | null; participants: number };

export function InviteDialog({ open, onOpenChange, forms }: { open: boolean; onOpenChange: (v: boolean) => void; forms: FormRow[] }) {
  const previewFn = useServerFn(adminPreviewInvite);
  const sendFn = useServerFn(adminSendInvite);
  const native = useMemo(() => forms.filter((f) => f.kind === "form"), [forms]);
  const openTargets = useMemo(() => native.filter((f) => f.is_published && (!f.closes_at || new Date(f.closes_at).getTime() > Date.now())), [native]);

  const [targetKind, setTargetKind] = useState<"form" | "external">("form");
  const [targetId, setTargetId] = useState("");
  const [extUrl, setExtUrl] = useState("");
  const [extTitle, setExtTitle] = useState("");
  const [extDate, setExtDate] = useState("");
  const [allSources, setAllSources] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [buttonLabel, setButtonLabel] = useState("Ver evento e inscribirme");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [preview, setPreview] = useState<{ html: string; recipients: number; found: number; skippedRegistered: number; skippedCancelled: number } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);

  const targetValid = targetKind === "form" ? !!targetId : /^https?:\/\/\S+$/.test(extUrl.trim()) && !!extTitle.trim();
  const payload = () => ({
    source_form_ids: sources,
    all_sources: allSources,
    include_cancelled: includeCancelled,
    target: targetKind === "form"
      ? { kind: "form" as const, form_id: targetId }
      : { kind: "external" as const, url: extUrl.trim(), title: extTitle.trim(), date_label: extDate.trim() || undefined },
    button_label: buttonLabel,
    subject,
    body_html: body,
  });

  useEffect(() => {
    if (!open || !targetValid) { setPreview(null); return; }
    const t = setTimeout(async () => {
      setLoadingPreview(true);
      try { setPreview(await previewFn({ data: payload() })); }
      catch (e) { toast.error((e as Error).message); }
      finally { setLoadingPreview(false); }
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, targetKind, targetId, extUrl, extTitle, extDate, allSources, sources, includeCancelled, buttonLabel, body]);

  useEffect(() => {
    if (targetKind === "form" && targetId && !subject) {
      const f = native.find((x) => x.id === targetId);
      if (f) setSubject(`¡Te invitamos a ${f.title}!`);
    }
  }, [targetId]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    if (!preview?.recipients) return;
    if (!confirm(`¿Enviar la invitación a ${preview.recipients} personas?`)) return;
    setSending(true);
    try {
      const r = await sendFn({ data: payload() });
      toast.success(`Invitación enviada a ${r.sent} personas${r.failed ? ` (${r.failed} fallidos)` : ""}`);
      onOpenChange(false);
    } catch (e) { toast.error((e as Error).message); }
    finally { setSending(false); }
  };

  const toggleSource = (id: string) => setSources((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const sortedSources = [...native].filter((f) => f.id !== targetId).sort((a, b) => (b.event_date ?? "").localeCompare(a.event_date ?? ""));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-ink/15 text-ink max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Invitar participantes</DialogTitle></DialogHeader>

        <section className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-ink/60">1. Evento al que invitas</Label>
          <div className="flex gap-2">
            {(["form", "external"] as const).map((k) => (
              <button key={k} onClick={() => setTargetKind(k)} className={`flex-1 px-3 py-2 rounded-lg border text-sm ${targetKind === k ? "border-coral bg-coral/5" : "border-ink/15 text-ink/70"}`}>
                {k === "form" ? "Evento de KLEFF" : "Enlace externo"}
              </button>
            ))}
          </div>
          {targetKind === "form" ? (
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full h-10 rounded-md border border-ink/15 bg-white px-3 text-sm">
              <option value="">Elige un evento abierto…</option>
              {openTargets.map((f) => <option key={f.id} value={f.id}>{f.title}{f.event_date ? ` — ${new Date(f.event_date).toLocaleDateString("es-ES")}` : ""}</option>)}
            </select>
          ) : (
            <div className="grid gap-2">
              <Input value={extUrl} onChange={(e) => setExtUrl(e.target.value)} placeholder="https://…" className="bg-white border-ink/15" />
              <Input value={extTitle} onChange={(e) => setExtTitle(e.target.value)} placeholder="Título del evento" className="bg-white border-ink/15" />
              <Input value={extDate} onChange={(e) => setExtDate(e.target.value)} placeholder="Fecha y lugar (opcional), p. ej. Sábado 14 nov · 18:00" className="bg-white border-ink/15" />
            </div>
          )}
          <Input value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} placeholder="Texto del botón" className="bg-white border-ink/15" />
        </section>

        <section className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-ink/60">2. A quién invitas</Label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={allSources} onCheckedChange={setAllSources} /> Todas las personas inscritas en cualquier evento</label>
          {!allSources && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-ink/10 divide-y divide-ink/5">
              {sortedSources.map((f) => (
                <label key={f.id} className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-ink/5">
                  <input type="checkbox" checked={sources.includes(f.id)} onChange={() => toggleSource(f.id)} />
                  <span className="flex-1 truncate">{f.title || f.slug}</span>
                  <span className="text-xs text-ink/50">{f.event_date ? new Date(f.event_date).toLocaleDateString("es-ES") : ""} · {f.participants}</span>
                </label>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm"><Switch checked={includeCancelled} onCheckedChange={setIncludeCancelled} /> Incluir también a quienes se dieron de baja</label>
          <div className="rounded-lg bg-coral/10 px-3 py-2 text-sm">
            {!targetValid ? "Elige primero el evento al que invitas." : loadingPreview ? "Calculando…" : preview ? (
              <>Se enviará a <b>{preview.recipients}</b> personas únicas ({preview.found} inscripciones encontradas{preview.skippedRegistered ? `; ${preview.skippedRegistered} ya inscritas en el destino` : ""}{preview.skippedCancelled ? `; ${preview.skippedCancelled} con baja omitidas` : ""}).</>
            ) : "—"}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-ink/60">3. Correo</Label>
            <div className="inline-flex rounded-lg border border-ink/15 p-0.5 text-xs">
              {(["edit", "preview"] as const).map((k) => <button key={k} onClick={() => setTab(k)} className={`px-2.5 py-1 rounded-md ${tab === k ? "bg-ink/10 font-medium" : "text-ink/60"}`}>{k === "edit" ? "Redactar" : "Vista previa"}</button>)}
            </div>
          </div>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto" className="bg-white border-ink/15" />
          {tab === "edit" ? (
            <RichTextEditor value={body} onChange={setBody} placeholder="Cuéntales de qué va el evento… (el saludo «¡Hola, nombre!» se añade solo)" />
          ) : preview ? (
            <iframe title="Vista previa" srcDoc={preview.html} className="w-full h-[480px] rounded-lg border border-ink/10" sandbox="" />
          ) : <p className="text-sm text-ink/60">Elige el evento para ver la vista previa.</p>}
        </section>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={send} disabled={!targetValid || !subject.trim() || !preview?.recipients || sending || loadingPreview} className="bg-coral hover:bg-coral/90 text-ink">
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar invitación{preview?.recipients ? ` (${preview.recipients})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
