import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { submitRegistration, type RegistrationForm, type RegistrationQuestion } from "@/lib/registrations.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { toast } from "sonner";

type Props = {
  form: RegistrationForm;
  questions: RegistrationQuestion[];
  responsesCount: number;
};

export function PublicRegistrationPage({ form, questions, responsesCount }: Props) {
  const submitFn = useServerFn(submitRegistration);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [emailContact, setEmailContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (form.external_mode === "redirect" && form.external_url) {
    if (typeof window !== "undefined") window.location.href = form.external_url;
    return <SiteLayout><div className="py-24 text-center text-muted-foreground">Redirigiendo…</div></SiteLayout>;
  }

  const fullCapacity = form.max_responses && responsesCount >= form.max_responses;
  const closed = form.closes_at && new Date(form.closes_at) < new Date();

  const setVal = (id: string, v: unknown) => setValues((s) => ({ ...s, [id]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const q of questions) {
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      {form.cover_image_url && (
        <div className="w-full h-64 md:h-80 bg-cover bg-center" style={{ backgroundImage: `url(${form.cover_image_url})` }} />
      )}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl md:text-4xl mb-3 text-foreground">{form.title}</h1>
        {form.description && <p className="text-muted-foreground whitespace-pre-line mb-6">{form.description}</p>}

        {form.external_mode === "iframe" && form.external_url ? (
          <iframe src={form.external_url} className="w-full h-[800px] rounded-lg border border-border bg-white" title={form.title} />
        ) : done ? (
          <div className="rounded-lg border border-coral/30 bg-coral/5 p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-coral mx-auto mb-3" />
            <h2 className="font-display text-xl text-foreground mb-2">¡Inscripción recibida!</h2>
            <p className="text-muted-foreground whitespace-pre-line">{form.confirmation_message ?? "Hemos recibido tu inscripción. Te contactaremos por email."}</p>
            {form.payment_required && form.payment_instructions && (
              <div className="mt-4 pt-4 border-t border-border text-left">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Instrucciones de pago</p>
                <p className="text-foreground whitespace-pre-line">{form.payment_instructions}</p>
              </div>
            )}
          </div>
        ) : fullCapacity ? (
          <div className="rounded-lg border border-border bg-muted p-6 text-center text-foreground">No quedan plazas disponibles.</div>
        ) : closed ? (
          <div className="rounded-lg border border-border bg-muted p-6 text-center text-foreground">El plazo de inscripción ha finalizado.</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <FieldRow label="Email de contacto" required>
              <Input type="email" required value={emailContact} onChange={(e) => setEmailContact(e.target.value)} />
            </FieldRow>
            {questions.map((q) => (
              <FieldRow key={q.id} label={q.label} required={q.required} help={q.help}>
                <QuestionField q={q} value={values[q.id]} onChange={(v) => setVal(q.id, v)} />
              </FieldRow>
            ))}
            {form.payment_required && form.payment_amount_cents != null && (
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm">
                <p className="font-medium text-foreground">Importe: {(form.payment_amount_cents / 100).toFixed(2)} {form.payment_currency}</p>
                {form.payment_instructions && <p className="text-muted-foreground mt-1 whitespace-pre-line">{form.payment_instructions}</p>}
              </div>
            )}
            <Button type="submit" disabled={submitting} className="w-full bg-coral hover:bg-coral/90 text-white">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Enviar inscripción
            </Button>
          </form>
        )}
      </div>
    </SiteLayout>
  );
}

function FieldRow({ label, required, help, children }: { label: string; required?: boolean; help?: string | null; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-foreground">{label}{required && <span className="text-coral ml-1">*</span>}</Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

function QuestionField({ q, value, onChange }: { q: RegistrationQuestion; value: unknown; onChange: (v: unknown) => void }) {
  switch (q.type) {
    case "textarea":
      return <Textarea rows={4} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "email":
      return <Input type="email" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "phone":
      return <Input type="tel" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return <Input type="number" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "date":
      return <Input type="date" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "select":
      return (
        <Select value={(value as string) ?? ""} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
          <SelectContent>
            {q.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label || o.value}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    case "radio":
      return (
        <RadioGroup value={(value as string) ?? ""} onValueChange={onChange} className="space-y-1.5">
          {q.options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-foreground cursor-pointer">
              <RadioGroupItem value={o.value} /> {o.label || o.value}
            </label>
          ))}
        </RadioGroup>
      );
    case "checkbox": {
      const arr = (Array.isArray(value) ? value : []) as string[];
      return (
        <div className="space-y-1.5">
          {q.options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-foreground cursor-pointer">
              <Checkbox checked={arr.includes(o.value)} onCheckedChange={(c) => {
                onChange(c ? [...arr, o.value] : arr.filter((x) => x !== o.value));
              }} /> {o.label || o.value}
            </label>
          ))}
        </div>
      );
    }
    case "file":
      return <p className="text-xs text-muted-foreground italic">(Adjunto de archivos próximamente)</p>;
    default:
      return <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
}
