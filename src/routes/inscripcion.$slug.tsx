import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getPublishedForm, submitRegistration, type RegistrationQuestion } from "@/lib/registrations.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { toast } from "sonner";

export const Route = createFileRoute("/inscripcion/$slug")({
  loader: async ({ params }) => {
    const data = await getPublishedForm({ data: { slug: params.slug, locale: "es" } });
    if (!data.form) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.form?.title_es ?? "Inscripción"} — KLEFF` },
      { name: "description", content: loaderData?.form?.description_es?.slice(0, 160) ?? "Inscripción KLEFF" },
    ],
  }),
  errorComponent: () => <div className="p-8 text-cream">Error al cargar la inscripción.</div>,
  notFoundComponent: () => (
    <div className="min-h-screen bg-ink text-cream">
      <SiteHeader />
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-3xl mb-3">Inscripción no encontrada</h1>
        <p className="text-cream/70">La inscripción que buscas no está disponible.</p>
      </div>
      <SiteFooter />
    </div>
  ),
  component: PublicRegistration,
});

function PublicRegistration() {
  const { form, questions, responsesCount } = Route.useLoaderData();
  const submitFn = useServerFn(submitRegistration);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [emailContact, setEmailContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!form) return null;

  // External modes
  if (form.external_mode === "redirect" && form.external_url) {
    if (typeof window !== "undefined") window.location.href = form.external_url;
    return <div className="min-h-screen bg-ink text-cream flex items-center justify-center">Redirigiendo…</div>;
  }

  const fullCapacity = form.max_responses && responsesCount >= form.max_responses;
  const closed = form.closes_at && new Date(form.closes_at) < new Date();

  const setVal = (id: string, v: unknown) => setValues((s) => ({ ...s, [id]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // basic required validation
    for (const q of questions) {
      if (!q.required) continue;
      const v = values[q.id];
      const empty = v == null || v === "" || (Array.isArray(v) && v.length === 0);
      if (empty) { toast.error(`Falta: ${q.label_es}`); return; }
    }
    setSubmitting(true);
    try {
      await submitFn({ data: { formId: form.id, emailContact: emailContact || undefined, data: values } });
      setDone(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-cream flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {form.cover_image_url && (
          <div className="w-full h-64 md:h-80 bg-cover bg-center" style={{ backgroundImage: `url(${form.cover_image_url})` }} />
        )}
        <div className="max-w-2xl mx-auto px-6 py-12">
          <h1 className="font-display text-3xl md:text-4xl mb-3">{form.title_es}</h1>
          {form.description_es && <p className="text-cream/80 whitespace-pre-line mb-6">{form.description_es}</p>}

          {form.external_mode === "iframe" && form.external_url ? (
            <iframe src={form.external_url} className="w-full h-[800px] rounded-lg border border-cream/15 bg-white" title={form.title_es} />
          ) : done ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
              <h2 className="font-display text-xl text-cream mb-2">¡Inscripción recibida!</h2>
              <p className="text-cream/80 whitespace-pre-line">{form.confirmation_message_es ?? "Hemos recibido tu inscripción. Te contactaremos por email."}</p>
              {form.payment_required && form.payment_instructions && (
                <div className="mt-4 pt-4 border-t border-cream/10 text-left">
                  <p className="text-xs uppercase tracking-wider text-cream/60 mb-2">Instrucciones de pago</p>
                  <p className="text-cream/80 whitespace-pre-line">{form.payment_instructions}</p>
                </div>
              )}
            </div>
          ) : fullCapacity ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6 text-center text-amber-200">No quedan plazas disponibles.</div>
          ) : closed ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6 text-center text-amber-200">El plazo de inscripción ha finalizado.</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <FieldRow label="Email de contacto" required>
                <Input type="email" required value={emailContact} onChange={(e) => setEmailContact(e.target.value)} className="bg-cream/5 border-cream/15 text-cream" />
              </FieldRow>
              {questions.map((q) => (
                <FieldRow key={q.id} label={q.label_es} required={q.required} help={q.help_es}>
                  <QuestionField q={q} value={values[q.id]} onChange={(v) => setVal(q.id, v)} />
                </FieldRow>
              ))}
              {form.payment_required && form.payment_amount_cents != null && (
                <div className="rounded-lg border border-cream/10 bg-cream/5 p-4 text-sm">
                  <p className="font-medium text-cream">Importe: {(form.payment_amount_cents / 100).toFixed(2)} {form.payment_currency}</p>
                  {form.payment_instructions && <p className="text-cream/70 mt-1 whitespace-pre-line">{form.payment_instructions}</p>}
                </div>
              )}
              <Button type="submit" disabled={submitting} className="w-full bg-coral hover:bg-coral/90 text-cream">
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Enviar inscripción
              </Button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function FieldRow({ label, required, help, children }: { label: string; required?: boolean; help?: string | null; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-cream">{label}{required && <span className="text-coral ml-1">*</span>}</Label>
      {children}
      {help && <p className="text-xs text-cream/50">{help}</p>}
    </div>
  );
}

function QuestionField({ q, value, onChange }: { q: RegistrationQuestion; value: unknown; onChange: (v: unknown) => void }) {
  const cls = "bg-cream/5 border-cream/15 text-cream";
  switch (q.type) {
    case "textarea":
      return <Textarea rows={4} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={cls} />;
    case "email":
      return <Input type="email" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={cls} />;
    case "phone":
      return <Input type="tel" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={cls} />;
    case "number":
      return <Input type="number" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={cls} />;
    case "date":
      return <Input type="date" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={cls} />;
    case "select":
      return (
        <Select value={(value as string) ?? ""} onValueChange={onChange}>
          <SelectTrigger className={cls}><SelectValue placeholder="Selecciona…" /></SelectTrigger>
          <SelectContent className="bg-ink border-cream/15 text-cream">
            {q.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label_es || o.value}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    case "radio":
      return (
        <RadioGroup value={(value as string) ?? ""} onValueChange={onChange} className="space-y-1.5">
          {q.options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-cream/90 cursor-pointer">
              <RadioGroupItem value={o.value} /> {o.label_es || o.value}
            </label>
          ))}
        </RadioGroup>
      );
    case "checkbox": {
      const arr = (Array.isArray(value) ? value : []) as string[];
      return (
        <div className="space-y-1.5">
          {q.options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-cream/90 cursor-pointer">
              <Checkbox checked={arr.includes(o.value)} onCheckedChange={(c) => {
                onChange(c ? [...arr, o.value] : arr.filter((x) => x !== o.value));
              }} /> {o.label_es || o.value}
            </label>
          ))}
        </div>
      );
    }
    case "file":
      return <p className="text-xs text-cream/60 italic">(Adjunto de archivos próximamente)</p>;
    default:
      return <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={cls} />;
  }
}
