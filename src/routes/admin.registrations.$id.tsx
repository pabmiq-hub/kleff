import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Save, Trash2, GripVertical, Loader2, Mail, X, Eye, Globe, EyeOff, Send, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import {
  adminGetForm, adminUpdateForm, adminUpsertQuestion, adminDeleteQuestion,
  adminReorderQuestions, adminListResponses, adminUpdateResponse, adminDeleteResponse,
  adminSendReminder, adminPreviewEmails,
  type RegistrationQuestion, type RegistrationForm, type RegistrationResponse,
} from "@/lib/registrations.functions";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ImagePicker } from "@/components/cms/ImagePicker";

export const Route = createFileRoute("/admin/registrations/$id")({
  head: () => ({ meta: [{ title: "Editar inscripción — Admin KLEFF" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: RegistrationEditor,
});

function RegistrationEditor() {
  const { id } = Route.useParams();
  const getForm = useServerFn(adminGetForm);
  const updateFn = useServerFn(adminUpdateForm);
  const [data, setData] = useState<{ form: RegistrationForm; questions: RegistrationQuestion[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [togglingPub, setTogglingPub] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getForm({ data: { id } })
      .then((res) => { if (!cancelled) setData(res as { form: RegistrationForm; questions: RegistrationQuestion[] }); })
      .catch((e) => { if (!cancelled) setLoadError((e as Error).message); });
    return () => { cancelled = true; };
  }, [id, getForm]);

  if (loadError) return <div className="text-red-600 p-6">Error: {loadError}</div>;
  if (!data) return <div className="p-6 text-ink/60 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>;
  const { form, questions } = data;
  const isPublished = form.is_published;

  const togglePublish = async () => {
    setTogglingPub(true);
    try {
      await updateFn({ data: { id: form.id, patch: { is_published: !isPublished } } });
      setData((d) => d ? { ...d, form: { ...d.form, is_published: !isPublished } } : d);
      toast.success(!isPublished ? "Inscripción publicada" : "Despublicada (vuelve a borrador)");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setTogglingPub(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/admin/registrations" className="inline-flex items-center gap-2 text-sm text-ink/70 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Volver</Link>

      <div className="rounded-2xl border border-ink/10 bg-white p-5 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPublished ? "bg-coral text-white" : "bg-ink/10 text-ink/70"}`}>
              {isPublished ? "Publicado" : "Borrador"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-ink/5 text-ink/70">
              {form.kind === "external" ? "Enlace externo" : "Formulario nativo"}
            </span>
            <code className="text-xs text-ink/50">/{form.slug}</code>
          </div>
          <h1 className="text-2xl font-display font-semibold text-ink truncate">{form.title || form.slug}</h1>
          <p className="text-sm text-ink/60 mt-1">
            {isPublished
              ? "Visible para el público. Puedes seguir editando: los cambios se guardan al instante."
              : "Solo tú puedes verlo. Termina de configurarlo y publícalo cuando esté listo."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isPublished && (
            <a href={`/${form.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-ink/15 text-ink hover:bg-ink/5">
              <Eye className="h-4 w-4" /> Ver pública
            </a>
          )}
          <Button onClick={togglePublish} disabled={togglingPub} className={isPublished ? "bg-ink/10 hover:bg-ink/20 text-ink" : "bg-coral hover:bg-coral/90 text-white"}>
            {togglingPub ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : isPublished ? <EyeOff className="h-4 w-4 mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
            {isPublished ? "Despublicar" : "Publicar"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="bg-ink/5 border border-ink/10">
          <TabsTrigger value="settings">Ajustes</TabsTrigger>
          {form.kind === "form" && <TabsTrigger value="comms">Comunicación</TabsTrigger>}
          {form.kind === "form" && <TabsTrigger value="responses">Inscritos</TabsTrigger>}
        </TabsList>
        <TabsContent value="settings" className="mt-4">
          <FormSettings
            form={form}
            questions={questions}
            onSaved={(patched) => setData((d) => d ? { ...d, form: { ...d.form, ...patched } } : d)}
          />
        </TabsContent>
        {form.kind === "form" && (
          <>
            <TabsContent value="comms" className="mt-4">
              <CommunicationSettings form={form} onSaved={(patched) => setData((d) => d ? { ...d, form: { ...d.form, ...patched } } : d)} />
            </TabsContent>
            <TabsContent value="responses" className="mt-4">
              <ResponsesPanel formId={form.id} questions={questions} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function FormSettings({ form, questions, onSaved }: { form: RegistrationForm; questions: RegistrationQuestion[]; onSaved: (patched: Partial<RegistrationForm>) => void }) {
  const updateFn = useServerFn(adminUpdateForm);
  const [state, setState] = useState(form);
  const [saving, setSaving] = useState(false);
  const [notifyInput, setNotifyInput] = useState(form.notify_emails.join(", "));

  const set = <K extends keyof RegistrationForm>(k: K, v: RegistrationForm[K]) => setState((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const emails = notifyInput.split(",").map((e) => e.trim()).filter(Boolean);
      await updateFn({
        data: {
          id: form.id,
          patch: {
            slug: state.slug,
            title: state.title,
            description: state.description,
            cover_image_url: state.cover_image_url,
            cover_position: state.cover_position,
            external_iframe_height: state.external_iframe_height,
            external_mode: state.external_mode,
            external_url: state.external_url,
            payment_required: state.payment_required,
            payment_amount_cents: state.payment_amount_cents,
            payment_currency: state.payment_currency,
            payment_instructions: state.payment_instructions,
            max_responses: state.max_responses,
            closes_at: state.closes_at,
            confirmation_message: state.confirmation_message,
            notify_emails: emails,
            event_date: state.event_date,
            event_location: state.event_location,
            allow_guests: state.allow_guests,
            max_guests_per_response: state.max_guests_per_response,
          },
        },
      });
      toast.success("Cambios guardados");
      onSaved({ ...state, notify_emails: emails });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const isExternal = form.kind === "external";

  return (
    <div className="space-y-6">
      <Card title="URL pública">
        <Row label="Slug">
          <Input value={state.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} className="bg-white border-ink/15 text-ink" />
          <p className="text-xs text-ink/50 mt-1">Disponible en <code className="text-coral">kleff.es/{state.slug}</code></p>
        </Row>
      </Card>

      <Card title="Contenido">
        <Row label="Título"><Input value={state.title} onChange={(e) => set("title", e.target.value)} className="bg-white border-ink/15 text-ink" /></Row>
        <Row label="Descripción"><Textarea rows={3} value={state.description ?? ""} onChange={(e) => set("description", e.target.value || null)} className="bg-white border-ink/15 text-ink" /></Row>
        {!isExternal && (
          <Row label="Mensaje de confirmación"><Textarea rows={2} value={state.confirmation_message ?? ""} onChange={(e) => set("confirmation_message", e.target.value || null)} className="bg-white border-ink/15 text-ink" placeholder="Te confirmamos tu plaza por email…" /></Row>
        )}
        <Row label="Imagen de cabecera">
          <ImagePicker
            url={state.cover_image_url ?? undefined}
            onChange={(url) => set("cover_image_url", url || null)}
            height="h-40"
            label="Subir cabecera"
          />
          <p className="text-xs text-ink/50 mt-2">
            Tamaño recomendado: <strong>1920 × 640 px</strong> (ratio 3:1, mínimo 1200 px de ancho, &lt; 500 KB).
          </p>
          {state.cover_image_url && (
            <CoverFocusPicker
              url={state.cover_image_url}
              position={state.cover_position || "center center"}
              onChange={(pos) => set("cover_position", pos)}
            />
          )}
        </Row>
      </Card>

      {isExternal && (
        <Card title="Enlace externo">
          <Row label="Modo">
            <Select value={state.external_mode ?? "redirect"} onValueChange={(v) => set("external_mode", v as "redirect" | "iframe")}>
              <SelectTrigger className="bg-white border-ink/15 text-ink"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white border-ink/15 text-ink">
                <SelectItem value="redirect">Redirigir a URL externa</SelectItem>
                <SelectItem value="iframe">Embeder en la página</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row label="URL externa"><Input value={state.external_url ?? ""} onChange={(e) => set("external_url", e.target.value || null)} placeholder="https://…" className="bg-white border-ink/15 text-ink" /></Row>
          {state.external_mode === "iframe" && (
            <Row label="Altura inicial del iframe (px)">
              <Input
                type="number"
                min={400}
                max={20000}
                step={100}
                value={state.external_iframe_height ?? 3200}
                onChange={(e) => set("external_iframe_height", e.target.value ? Number(e.target.value) : 3200)}
                className="bg-white border-ink/15 text-ink"
              />
              <p className="text-xs text-ink/50 mt-1">Altura inicial del iframe. El iframe crece automáticamente en formularios multi-paso al pasar de paso. Si aun así se corta, sube este valor (ej. 5000–8000). Valor típico Google Forms: 3200–4500 px.</p>
            </Row>
          )}
        </Card>
      )}

      {!isExternal && (
        <>
          <Card title="Datos del evento">
            <Row label="Fecha y hora del evento">
              <Input type="datetime-local" value={toLocalInput(state.event_date)} onChange={(e) => set("event_date", e.target.value ? new Date(e.target.value).toISOString() : null)} className="bg-white border-ink/15 text-ink" />
              <p className="text-xs text-ink/50 mt-1">Se usa en los correos, en el botón de calendario y para la pregunta con fecha límite.</p>
            </Row>
            <Row label="Ubicación">
              <Input value={state.event_location ?? ""} onChange={(e) => set("event_location", e.target.value || null)} placeholder="Carrer Exemple 1, Barcelona" className="bg-white border-ink/15 text-ink" />
            </Row>
          </Card>

          <Card title="Plazas e invitados">
            <Row label="Máximo de asistentes (vacío = sin límite)"><Input type="number" min={1} value={state.max_responses ?? ""} onChange={(e) => set("max_responses", e.target.value ? Number(e.target.value) : null)} className="bg-white border-ink/15 text-ink" /></Row>
            <Row label="Cierre de inscripciones"><Input type="datetime-local" value={toLocalInput(state.closes_at)} onChange={(e) => set("closes_at", e.target.value ? new Date(e.target.value).toISOString() : null)} className="bg-white border-ink/15 text-ink" /></Row>
            <Row>
              <div className="flex items-center gap-3">
                <Switch checked={state.allow_guests} onCheckedChange={(v) => set("allow_guests", v)} />
                <Label className="text-ink">Permitir invitados (cuentan como plazas)</Label>
              </div>
            </Row>
            {state.allow_guests && (
              <Row label="Máximo de invitados por inscripción">
                <Input type="number" min={1} max={20} value={state.max_guests_per_response} onChange={(e) => set("max_guests_per_response", Number(e.target.value) || 1)} className="bg-white border-ink/15 text-ink" />
              </Row>
            )}
          </Card>

          <Card title="Pago (manual)">
            <Row>
              <div className="flex items-center gap-3">
                <Switch checked={state.payment_required} onCheckedChange={(v) => set("payment_required", v)} />
                <Label className="text-ink">Requiere pago</Label>
              </div>
            </Row>
            {state.payment_required && (
              <>
                <Row label="Importe (céntimos)"><Input type="number" min={0} value={state.payment_amount_cents ?? ""} onChange={(e) => set("payment_amount_cents", e.target.value ? Number(e.target.value) : null)} className="bg-white border-ink/15 text-ink" placeholder="2500 = 25,00 €" /></Row>
                <Row label="Moneda"><Input value={state.payment_currency} onChange={(e) => set("payment_currency", e.target.value.toUpperCase())} maxLength={3} className="bg-white border-ink/15 text-ink" /></Row>
                <Row label="Instrucciones de pago"><Textarea rows={3} value={state.payment_instructions ?? ""} onChange={(e) => set("payment_instructions", e.target.value || null)} placeholder="Bizum / transferencia / pago en local…" className="bg-white border-ink/15 text-ink" /></Row>
              </>
            )}
          </Card>

          <Card title="Notificaciones">
            <Row label="Emails para notificar nuevas inscripciones (separados por coma)">
              <Input value={notifyInput} onChange={(e) => setNotifyInput(e.target.value)} placeholder="info@kleff.es, admin@kleff.es" className="bg-white border-ink/15 text-ink" />
              <p className="text-xs text-ink/50 mt-1 flex items-center gap-1"><Mail className="h-3 w-3" /> El envío automático requiere configurar Lovable Emails (lo añadiremos en una fase posterior).</p>
            </Row>
          </Card>
        </>
      )}

      {!isExternal && (
        <Card title="Preguntas del formulario">
          <QuestionsEditor formId={form.id} initial={questions} eventDate={state.event_date} allowGuests={state.allow_guests} />
        </Card>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-coral hover:bg-coral/90">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Guardar cambios
        </Button>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 space-y-4">
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {children}
    </section>
  );
}
function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs uppercase tracking-wider text-ink/60 block">{label}</label>}
      {children}
    </div>
  );
}

// ----------------- Questions Editor -----------------

const QUESTION_TYPES = [
  { v: "text", l: "Texto corto" }, { v: "textarea", l: "Texto largo" },
  { v: "email", l: "Email" }, { v: "phone", l: "Teléfono" }, { v: "number", l: "Número" },
  { v: "select", l: "Desplegable" }, { v: "radio", l: "Opción única" }, { v: "checkbox", l: "Opción múltiple" },
  { v: "date", l: "Fecha" }, { v: "file", l: "Archivo" },
] as const;

function QuestionsEditor({ formId, initial, eventDate, allowGuests }: { formId: string; initial: RegistrationQuestion[]; eventDate: string | null; allowGuests: boolean }) {
  const [questions, setQuestions] = useState(initial);
  const upsertFn = useServerFn(adminUpsertQuestion);
  const deleteFn = useServerFn(adminDeleteQuestion);
  const reorderFn = useServerFn(adminReorderQuestions);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    const next = arrayMove(questions, oldIndex, newIndex);
    setQuestions(next);
    try {
      await reorderFn({ data: { form_id: formId, orderedIds: next.map((q) => q.id) } });
    } catch (e) { toast.error((e as Error).message); }
  };

  const addQuestion = async () => {
    try {
      const { id } = await upsertFn({
        data: {
          form_id: formId, position: questions.length, type: "text", required: false,
          label: "Nueva pregunta", options: [],
        },
      });
      setQuestions((qs) => [...qs, { id, form_id: formId, position: qs.length, type: "text", required: false, label: "Nueva pregunta", help: null, options: [], special: null, hide_after_wednesday: false }]);
    } catch (e) { toast.error((e as Error).message); }
  };

  const updateQuestion = async (q: RegistrationQuestion) => {
    setQuestions((qs) => qs.map((x) => x.id === q.id ? q : x));
    try {
      await upsertFn({
        data: {
          id: q.id, form_id: formId, position: q.position, type: q.type, required: q.required,
          label: q.label, help: q.help, options: q.options,
          special: q.special, hide_after_wednesday: q.hide_after_wednesday,
        },
      });
    } catch (e) { toast.error((e as Error).message); }
  };

  const removeQuestion = async (id: string) => {
    if (!confirm("¿Eliminar esta pregunta?")) return;
    try {
      await deleteFn({ data: { id } });
      setQuestions((qs) => qs.filter((q) => q.id !== id));
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {questions.map((q) => (
              <SortableQuestion key={q.id} q={q} eventDate={eventDate} allowGuests={allowGuests} onChange={updateQuestion} onRemove={() => removeQuestion(q.id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button onClick={addQuestion} variant="outline" className="border-ink/20 text-ink hover:bg-ink/10 w-full">
        <Plus className="h-4 w-4 mr-2" /> Añadir pregunta
      </Button>
    </div>
  );
}

function SortableQuestion({ q, eventDate, allowGuests, onChange, onRemove }: { q: RegistrationQuestion; eventDate: string | null; allowGuests: boolean; onChange: (q: RegistrationQuestion) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const needsOptions = q.type === "select" || q.type === "radio" || q.type === "checkbox";

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-ink/10 bg-white p-4">
      <div className="flex items-start gap-3">
        <button {...attributes} {...listeners} className="cursor-grab touch-none text-ink/40 hover:text-ink mt-2"><GripVertical className="h-4 w-4" /></button>
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wider text-ink/60 mb-1 block">Etiqueta</label>
              <Input value={q.label} onChange={(e) => onChange({ ...q, label: e.target.value })} className="bg-white border-ink/15 text-ink" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-ink/60 mb-1 block">Tipo</label>
              <Select value={q.type} onValueChange={(v) => onChange({ ...q, type: v as RegistrationQuestion["type"] })}>
                <SelectTrigger className="bg-white border-ink/15 text-ink"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-ink/15 text-ink">
                  {QUESTION_TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input placeholder="Ayuda (opcional)" value={q.help ?? ""} onChange={(e) => onChange({ ...q, help: e.target.value || null })} className="bg-white border-ink/15 text-ink" />
          {needsOptions && (
            <OptionsEditor value={q.options} onChange={(o) => onChange({ ...q, options: o })} />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-ink/60 mb-1 block">Pregunta especial</label>
              <Select value={q.special ?? "none"} onValueChange={(v) => onChange({ ...q, special: v === "none" ? null : (v as "guests" | "game_pick") })}>
                <SelectTrigger className="bg-white border-ink/15 text-ink"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-ink/15 text-ink">
                  <SelectItem value="none">Ninguna (normal)</SelectItem>
                  <SelectItem value="guests" disabled={!allowGuests}>Número de invitados</SelectItem>
                  <SelectItem value="game_pick">Buscador del catálogo KLEFF</SelectItem>
                </SelectContent>
              </Select>
              {q.special === "guests" && !allowGuests && <p className="text-xs text-amber-600 mt-1">Activa «Permitir invitados» arriba.</p>}
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-3 pb-2">
                <Switch checked={q.hide_after_wednesday} onCheckedChange={(v) => onChange({ ...q, hide_after_wednesday: v })} />
                <Label className="text-ink text-sm">Ocultar tras el miércoles previo (19:00)</Label>
              </div>
            </div>
          </div>
          {q.hide_after_wednesday && !eventDate && <p className="text-xs text-amber-600">Necesita una fecha de evento en Ajustes.</p>}
          <div className="flex items-center gap-3">
            <Switch checked={q.required} onCheckedChange={(v) => onChange({ ...q, required: v })} />
            <Label className="text-ink text-sm">Obligatoria</Label>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onRemove} className="text-ink/60 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

function OptionsEditor({ value, onChange }: { value: RegistrationQuestion["options"]; onChange: (v: RegistrationQuestion["options"]) => void }) {
  const add = () => onChange([...value, { value: `opt-${value.length + 1}`, label: "" }]);
  return (
    <div className="space-y-2 border-l-2 border-coral/30 pl-3">
      <p className="text-xs uppercase tracking-wider text-ink/60">Opciones</p>
      {value.map((o, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2">
          <Input placeholder="valor" value={o.value} onChange={(e) => { const c = [...value]; c[idx] = { ...o, value: e.target.value }; onChange(c); }} className="col-span-4 bg-white border-ink/15 text-ink text-xs" />
          <Input placeholder="Etiqueta" value={o.label} onChange={(e) => { const c = [...value]; c[idx] = { ...o, label: e.target.value }; onChange(c); }} className="col-span-7 bg-white border-ink/15 text-ink text-xs" />
          <Button size="sm" variant="ghost" onClick={() => onChange(value.filter((_, i) => i !== idx))} className="col-span-1 h-8 w-8 p-0 text-ink/60 hover:text-red-400"><X className="h-3 w-3" /></Button>
        </div>
      ))}
      <Button size="sm" variant="ghost" onClick={add} className="text-ink/70 hover:text-ink hover:bg-ink/10 text-xs"><Plus className="h-3 w-3 mr-1" /> Añadir opción</Button>
    </div>
  );
}

// ----------------- Responses Panel -----------------

function ResponsesPanel({ formId, questions }: { formId: string; questions: RegistrationQuestion[] }) {
  const listFn = useServerFn(adminListResponses);
  const updateFn = useServerFn(adminUpdateResponse);
  const deleteFn = useServerFn(adminDeleteResponse);
  const [responses, setResponses] = useState<RegistrationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await listFn({ data: { form_id: formId } });
      setResponses(res.responses);
    } finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, [formId]); // eslint-disable-line react-hooks/exhaustive-deps

  const downloadCsv = () => {
    const headers = ["fecha", "email", "estado_pago", ...questions.map((q) => q.label || q.id)];
    const rows = responses.map((r) => [
      new Date(r.created_at).toLocaleString("es-ES"),
      r.email_contact ?? "",
      r.payment_status,
      ...questions.map((q) => {
        const v = r.data?.[q.id];
        if (Array.isArray(v)) return v.join("; ");
        return v == null ? "" : String(v);
      }),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `inscripciones-${formId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p className="text-ink/60 text-sm">Cargando respuestas…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/70">{responses.length} respuesta{responses.length === 1 ? "" : "s"}</p>
        <Button size="sm" onClick={downloadCsv} variant="outline" className="border-ink/20 text-ink hover:bg-ink/10" disabled={!responses.length}>Descargar CSV</Button>
      </div>
      {responses.length === 0 ? (
        <p className="text-ink/60 text-sm">Aún no hay inscripciones recibidas.</p>
      ) : (
        <div className="space-y-3">
          {responses.map((r) => (
            <ResponseCard key={r.id} response={r} questions={questions} onUpdate={async (patch) => {
              try {
                await updateFn({ data: { id: r.id, ...patch } });
                setResponses((rs) => rs.map((x) => x.id === r.id ? { ...x, ...patch } as RegistrationResponse : x));
              } catch (e) { toast.error((e as Error).message); }
            }} onDelete={async () => {
              if (!confirm("¿Eliminar esta respuesta?")) return;
              try {
                await deleteFn({ data: { id: r.id } });
                setResponses((rs) => rs.filter((x) => x.id !== r.id));
              } catch (e) { toast.error((e as Error).message); }
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResponseCard({ response, questions, onUpdate, onDelete }: { response: RegistrationResponse; questions: RegistrationQuestion[]; onUpdate: (p: { payment_status?: RegistrationResponse["payment_status"]; internal_notes?: string | null }) => Promise<void>; onDelete: () => void }) {
  const [notes, setNotes] = useState(response.internal_notes ?? "");
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-medium text-ink">{response.email_contact ?? "—"}</div>
          <div className="text-xs text-ink/50">{new Date(response.created_at).toLocaleString("es-ES")}</div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={response.payment_status} onValueChange={(v) => onUpdate({ payment_status: v as RegistrationResponse["payment_status"] })}>
            <SelectTrigger className="bg-white border-ink/15 text-ink h-8 text-xs w-40"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-ink/15 text-ink">
              <SelectItem value="not_required">Sin pago</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="paid">Pagado</SelectItem>
              <SelectItem value="refunded">Reembolsado</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-ink/60 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {questions.map((q) => {
          const v = response.data?.[q.id];
          const display = Array.isArray(v) ? v.join(", ") : (v == null || v === "" ? "—" : String(v));
          return (
            <div key={q.id} className="flex flex-col">
              <dt className="text-xs uppercase tracking-wider text-ink/50">{q.label || q.id}</dt>
              <dd className="text-ink/90 break-words">{display}</dd>
            </div>
          );
        })}
      </dl>
      <div className="mt-3 pt-3 border-t border-ink/10">
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (response.internal_notes ?? "") && onUpdate({ internal_notes: notes || null })} placeholder="Notas internas…" className="bg-white border-ink/15 text-ink text-sm" />
      </div>
    </div>
  );
}

function CoverFocusPicker({ url, position, onChange }: { url: string; position: string; onChange: (pos: string) => void }) {
  const parsed = parsePosition(position);
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    onChange(`${x.toFixed(0)}% ${y.toFixed(0)}%`);
  };
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-ink/70">Foco visible (haz clic en la zona que quieres que se vea siempre)</p>
      <div
        onClick={handleClick}
        className="relative w-full h-48 rounded-lg border border-ink/15 bg-cover cursor-crosshair overflow-hidden"
        style={{ backgroundImage: `url(${url})`, backgroundPosition: position }}
        title="Haz clic para fijar el foco"
      >
        <div
          className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white shadow-lg pointer-events-none"
          style={{ left: `${parsed.x}%`, top: `${parsed.y}%`, background: "rgba(225,90,80,0.7)" }}
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-black/10" />
      </div>
      <div className="flex items-center gap-2 text-xs text-ink/60">
        <span>Posición: <code className="text-coral">{position}</code></span>
        <button type="button" onClick={() => onChange("center center")} className="ml-auto underline hover:text-ink">Centrar</button>
      </div>
    </div>
  );
}

function parsePosition(pos: string): { x: number; y: number } {
  if (!pos || pos === "center center" || pos === "center") return { x: 50, y: 50 };
  const m = pos.match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  if (m) return { x: Number(m[1]), y: Number(m[2]) };
  return { x: 50, y: 50 };
}

// ----------------- Communication -----------------

function CommunicationSettings({ form, onSaved }: { form: RegistrationForm; onSaved: (patched: Partial<RegistrationForm>) => void }) {
  const updateFn = useServerFn(adminUpdateForm);
  const previewFn = useServerFn(adminPreviewEmails);
  const reminderFn = useServerFn(adminSendReminder);
  const [state, setState] = useState(form);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<{ confirmation: { html: string }; reminder: { html: string } } | null>(null);
  const [tab, setTab] = useState<"confirmation" | "reminder">("confirmation");

  const set = <K extends keyof RegistrationForm>(k: K, v: RegistrationForm[K]) => setState((s) => ({ ...s, [k]: v }));

  const loadPreview = async () => {
    try {
      const res = await previewFn({ data: { form_id: form.id } });
      setPreview(res as { confirmation: { html: string }; reminder: { html: string } });
    } catch (e) { toast.error((e as Error).message); }
  };
  useEffect(() => { void loadPreview(); }, [form.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setSaving(true);
    try {
      const patch = {
        send_confirmation_email: state.send_confirmation_email,
        confirmation_email_subject: state.confirmation_email_subject,
        confirmation_email_body: state.confirmation_email_body,
        reminder_enabled: state.reminder_enabled,
        reminder_subject: state.reminder_subject,
        reminder_body: state.reminder_body,
      };
      await updateFn({ data: { id: form.id, patch } });
      onSaved(patch);
      toast.success("Comunicación guardada");
      await loadPreview();
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  const sendNow = async () => {
    if (!confirm("¿Enviar el recordatorio ahora a todos los inscritos activos?")) return;
    setSending(true);
    try {
      const res = await reminderFn({ data: { form_id: form.id } });
      toast.success(`Recordatorio enviado a ${(res as { sent: number }).sent} persona(s)`);
    } catch (e) { toast.error((e as Error).message); } finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <Card title="Correo de confirmación">
        <Row>
          <div className="flex items-center gap-3">
            <Switch checked={state.send_confirmation_email} onCheckedChange={(v) => set("send_confirmation_email", v)} />
            <Label className="text-ink">Enviar correo de confirmación al inscribirse</Label>
          </div>
        </Row>
        <Row label="Asunto"><Input value={state.confirmation_email_subject ?? ""} onChange={(e) => set("confirmation_email_subject", e.target.value || null)} placeholder={`Inscripción confirmada · ${form.title}`} className="bg-white border-ink/15 text-ink" /></Row>
        <Row label="Texto">
          <Textarea rows={5} value={state.confirmation_email_body ?? ""} onChange={(e) => set("confirmation_email_body", e.target.value || null)} className="bg-white border-ink/15 text-ink" />
          <p className="text-xs text-ink/50 mt-1">Variables: {"{{nombre}}"}, {"{{titulo}}"}, {"{{fecha}}"}, {"{{ubicacion}}"}, {"{{invitados}}"}</p>
        </Row>
      </Card>

      <Card title="Recordatorio del evento">
        <Row>
          <div className="flex items-center gap-3">
            <Switch checked={state.reminder_enabled} onCheckedChange={(v) => set("reminder_enabled", v)} />
            <Label className="text-ink">Enviar recordatorio automático</Label>
          </div>
        </Row>
        {state.reminder_enabled && (
          <Row label="¿Cuándo se envía?">
            <div className="flex flex-wrap gap-2">
              {REMINDER_CHOICES.map((c) => {
                const active = offsets.includes(c.hours);
                return (
                  <Button
                    key={c.hours}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "outline"}
                    className={active ? "bg-coral hover:bg-coral/90" : "border-ink/20 text-ink"}
                    onClick={() => {
                      const next = active ? offsets.filter((h) => h !== c.hours) : [...offsets, c.hours];
                      set("reminder_offsets_hours", next.sort((a, b) => b - a));
                    }}
                  >
                    {c.label}
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-ink/50 mt-2 flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              {offsets.length
                ? `Se programa al inscribirse y llega ${offsets.map((h) => (h % 24 === 0 && h >= 24 ? `${h / 24} día(s)` : `${h} h`)).join(", ")} antes del evento.`
                : "Selecciona al menos un momento de envío."}
              {" "}Si la persona se da de baja, sus recordatorios se cancelan.
            </p>
          </Row>
        )}
        <Row label="Asunto"><Input value={state.reminder_subject ?? ""} onChange={(e) => set("reminder_subject", e.target.value || null)} placeholder={`Nos vemos pronto · ${form.title}`} className="bg-white border-ink/15 text-ink" /></Row>
        <Row label="Texto"><Textarea rows={5} value={state.reminder_body ?? ""} onChange={(e) => set("reminder_body", e.target.value || null)} className="bg-white border-ink/15 text-ink" /></Row>
        <Button onClick={sendNow} disabled={sending} variant="outline" className="border-ink/20 text-ink hover:bg-ink/10">
          {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />} Enviar recordatorio ahora
        </Button>
      </Card>

      <Card title="Previsualización">
        <div className="flex gap-2 mb-3">
          <Button size="sm" variant={tab === "confirmation" ? "default" : "outline"} onClick={() => setTab("confirmation")} className={tab === "confirmation" ? "bg-coral hover:bg-coral/90" : "border-ink/20 text-ink"}>Confirmación</Button>
          <Button size="sm" variant={tab === "reminder" ? "default" : "outline"} onClick={() => setTab("reminder")} className={tab === "reminder" ? "bg-coral hover:bg-coral/90" : "border-ink/20 text-ink"}>Recordatorio</Button>
          <Button size="sm" variant="ghost" onClick={loadPreview} className="text-ink/70">Actualizar</Button>
        </div>
        {preview ? (
          <iframe title="Previsualización del correo" srcDoc={preview[tab].html} className="w-full h-[560px] rounded-lg border border-ink/10 bg-white" />
        ) : (
          <p className="text-sm text-ink/60 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Generando previsualización…</p>
        )}
        <p className="text-xs text-ink/50 mt-2 flex items-center gap-1"><Mail className="h-3 w-3" /> Guarda los cambios para ver la versión actualizada.</p>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-coral hover:bg-coral/90">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Guardar cambios
        </Button>
      </div>
    </div>
  );
}
