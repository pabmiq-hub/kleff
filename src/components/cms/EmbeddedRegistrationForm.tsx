import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPublishedForm, submitRegistration, type RegistrationForm, type RegistrationQuestion } from "@/lib/registrations.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AutoResizeIframe } from "@/components/cms/AutoResizeIframe";

export function EmbeddedRegistrationForm({ slug }: { slug: string }) {
  const getFn = useServerFn(getPublishedForm);
  const submitFn = useServerFn(submitRegistration);
  const [state, setState] = useState<{ form: RegistrationForm | null; questions: RegistrationQuestion[]; responsesCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [emailContact, setEmailContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    getFn({ data: { slug } })
      .then((r) => { if (alive) setState(r as never); })
      .catch(() => { if (alive) setState({ form: null, questions: [], responsesCount: 0 }); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug, getFn]);

  if (loading) {
    return <div className="rounded-xl border border-cream/15 p-6 text-center text-cream/60"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></div>;
  }
  if (!state?.form) {
    return <div className="rounded-xl border border-dashed border-cream/30 p-6 text-center text-sm text-muted-foreground">Formulario «{slug}» no encontrado o no publicado.</div>;
  }
  const form = state.form;

  if (form.external_mode === "redirect" && form.external_url) {
    return (
      <a href={form.external_url} target="_blank" rel="noreferrer" className="block rounded-xl border border-cream/15 p-6 text-center hover:bg-cream/5">
        <p className="font-display text-lg mb-1">{form.title}</p>
        <p className="text-sm text-cream/60">Abrir formulario externo →</p>
      </a>
    );
  }
  if (form.external_mode === "iframe" && form.external_url) {
    return (
      <AutoResizeIframe
        src={form.external_url}
        title={form.title}
        fallbackHeight={form.external_iframe_height ?? 3200}
        className="w-full rounded-xl border border-cream/15 bg-white"
      />
    );
  }

  const closed = form.closes_at && new Date(form.closes_at) < new Date();
  const fullCapacity = form.max_responses && state.responsesCount >= form.max_responses;
  const setVal = (id: string, v: unknown) => setValues((s) => ({ ...s, [id]: v }));

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
        <h3 className="font-display text-xl mb-2">¡Inscripción recibida!</h3>
        <p className="text-cream/80 whitespace-pre-line">{form.confirmation_message ?? "Hemos recibido tu inscripción."}</p>
      </div>
    );
  }
  if (fullCapacity) return <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center text-amber-200">No quedan plazas disponibles.</div>;
  if (closed) return <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center text-amber-200">El plazo de inscripción ha finalizado.</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const q of state.questions) {
      if (!q.required) continue;
      const v = values[q.id];
      const empty = v == null || v === "" || (Array.isArray(v) && v.length === 0);
      if (empty) { toast.error(`Falta: ${q.label}`); return; }
    }
    setSubmitting(true);
    try {
      await submitFn({ data: { formId: form.id, emailContact: emailContact || undefined, data: values } });
      setDone(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setSubmitting(false); }
  };

  const cls = "bg-cream/5 border-cream/15 text-cream";
  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-cream/15 bg-cream/[0.02] p-6 space-y-4">
      <div>
        <h3 className="font-display text-2xl">{form.title}</h3>
        {form.description && <p className="text-sm text-cream/70 mt-1 whitespace-pre-line">{form.description}</p>}
      </div>
      <div className="space-y-1.5">
        <Label className="text-cream">Email de contacto <span className="text-coral">*</span></Label>
        <Input type="email" required value={emailContact} onChange={(e) => setEmailContact(e.target.value)} className={cls} />
      </div>
      {state.questions.map((q) => (
        <div key={q.id} className="space-y-1.5">
          <Label className="text-cream">{q.label}{q.required && <span className="text-coral ml-1">*</span>}</Label>
          {q.type === "textarea" ? (
            <Textarea rows={4} value={(values[q.id] as string) ?? ""} onChange={(e) => setVal(q.id, e.target.value)} className={cls} />
          ) : q.type === "select" ? (
            <Select value={(values[q.id] as string) ?? ""} onValueChange={(v) => setVal(q.id, v)}>
              <SelectTrigger className={cls}><SelectValue placeholder="Selecciona…" /></SelectTrigger>
              <SelectContent className="bg-ink border-cream/15 text-cream">
                {q.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label || o.value}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : q.type === "radio" ? (
            <RadioGroup value={(values[q.id] as string) ?? ""} onValueChange={(v) => setVal(q.id, v)} className="space-y-1.5">
              {q.options.map((o) => (
                <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value={o.value} /> {o.label || o.value}
                </label>
              ))}
            </RadioGroup>
          ) : q.type === "checkbox" ? (
            <div className="space-y-1.5">
              {q.options.map((o) => {
                const arr = (Array.isArray(values[q.id]) ? (values[q.id] as string[]) : []);
                return (
                  <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={arr.includes(o.value)} onCheckedChange={(c) => setVal(q.id, c ? [...arr, o.value] : arr.filter((x) => x !== o.value))} /> {o.label || o.value}
                  </label>
                );
              })}
            </div>
          ) : (
            <Input type={q.type === "number" ? "number" : q.type === "date" ? "date" : q.type === "phone" ? "tel" : q.type === "email" ? "email" : "text"} value={(values[q.id] as string) ?? ""} onChange={(e) => setVal(q.id, e.target.value)} className={cls} />
          )}
          {q.help && <p className="text-xs text-cream/50">{q.help}</p>}
        </div>
      ))}
      {form.payment_required && form.payment_amount_cents != null && (
        <div className="rounded-lg border border-cream/10 bg-cream/5 p-3 text-sm">
          <p className="font-medium">Importe: {(form.payment_amount_cents / 100).toFixed(2)} {form.payment_currency}</p>
          {form.payment_instructions && <p className="text-cream/70 mt-1 whitespace-pre-line">{form.payment_instructions}</p>}
        </div>
      )}
      <Button type="submit" disabled={submitting} className="w-full bg-coral hover:bg-coral/90 text-cream">
        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Enviar inscripción
      </Button>
    </form>
  );
}
