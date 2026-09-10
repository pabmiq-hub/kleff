import { useServerFn } from "@tanstack/react-start";
import { AutoResizeIframe } from "@/components/cms/AutoResizeIframe";
import { useState } from "react";
import { submitRegistration, searchGamesForPick, type RegistrationForm, type RegistrationQuestion } from "@/lib/registrations.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, CalendarPlus, MapPin, CalendarDays, Search, X } from "lucide-react";
import { googleCalendarUrl, formatMadrid } from "@/lib/registrations-calendar";
import { normalizeHighlights, plainTextToHtml, DEFAULT_LEGAL_HTML } from "@/lib/registrations-content";
import { useEffect, useRef } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { toast } from "sonner";

type Props = {
  form: RegistrationForm;
  questions: RegistrationQuestion[];
  responsesCount: number;
  attendeesCount?: number;
};

type PickedGame = { id: string; name: string; imageUrl: string | null };

export function PublicRegistrationPage({ form, questions, responsesCount, attendeesCount }: Props) {
  const submitFn = useServerFn(submitRegistration);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [emailContact, setEmailContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [guests, setGuests] = useState(0);
  const [cancelToken, setCancelToken] = useState<string | null>(null);

  if (form.external_mode === "redirect" && form.external_url) {
    if (typeof window !== "undefined") window.location.href = form.external_url;
    return <SiteLayout><div className="py-24 text-center text-muted-foreground">Redirigiendo…</div></SiteLayout>;
  }

  const taken = attendeesCount ?? responsesCount;
  const seatsLeft = form.max_responses ? Math.max(0, form.max_responses - taken) : null;
  const fullCapacity = seatsLeft !== null && seatsLeft <= 0;
  const maxGuests = form.allow_guests
    ? Math.min(form.max_guests_per_response, seatsLeft !== null ? Math.max(0, seatsLeft - 1) : form.max_guests_per_response)
    : 0;
  const calendarUrl = form.event_date
    ? googleCalendarUrl({
        title: form.title,
        description: form.description ?? undefined,
        location: form.event_location ?? undefined,
        start: new Date(form.event_date),
      })
    : null;
  const closed = form.closes_at && new Date(form.closes_at) < new Date();
  const highlights = normalizeHighlights(form.highlights);
  const descriptionHtml = form.description_html?.trim()
    ? form.description_html
    : form.description
      ? plainTextToHtml(form.description)
      : null;
  const legalHtml = form.legal_info_enabled === false
    ? null
    : (form.legal_info_html?.trim() ? form.legal_info_html : DEFAULT_LEGAL_HTML);

  const hasContactQuestion = questions.some((q) => q.special === "contact_email");
  const setVal = (id: string, v: unknown) => setValues((s) => ({ ...s, [id]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const q of questions) {
      if (!q.required) continue;
      if (q.special === "guests") continue; // always has a numeric value (0 = voy solo/a)
      const v = values[q.id];
      const empty = v == null || v === "" || (Array.isArray(v) && v.length === 0);
      if (empty) { toast.error(`Falta: ${q.label}`); return; }
    }
    const contactQuestion = questions.find((q) => q.special === "contact_email");
    const email = contactQuestion ? String(values[contactQuestion.id] ?? "") : emailContact;
    if (!email) { toast.error("Falta el email de contacto"); return; }
    setSubmitting(true);
    try {
      const res = await submitFn({ data: { formId: form.id, emailContact: email, guests, data: values } });
      setCancelToken((res as { cancelToken?: string }).cancelToken ?? null);
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
        <div
          className="w-full h-64 md:h-80 bg-cover"
          style={{
            backgroundImage: `url(${form.cover_image_url})`,
            backgroundPosition: form.cover_position || "center center",
          }}
        />
      )}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl md:text-4xl mb-3 text-foreground">{form.title}</h1>
        {(form.event_date || form.event_location) && (
          <div className="flex flex-wrap gap-4 mb-4 text-sm text-foreground/80">
            {form.event_date && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-coral" /> {formatMadrid(form.event_date)}</span>}
            {form.event_location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-coral" /> {form.event_location}</span>}
          </div>
        )}
        {descriptionHtml && (
          <div className="blog-content mb-6" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
        )}
        {highlights.length > 0 && (
          <ul className="mb-6 rounded-xl border border-border bg-muted/40 p-4 space-y-2">
            {highlights.map((h, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <span aria-hidden className="shrink-0">{h.emoji}</span>
                <span><strong className="font-medium">{h.label}:</strong> {h.text}</span>
              </li>
            ))}
          </ul>
        )}
        {seatsLeft !== null && !fullCapacity && (
          <p className="text-sm text-muted-foreground mb-6">Quedan {seatsLeft} plaza{seatsLeft === 1 ? "" : "s"}.</p>
        )}

        {form.external_mode === "iframe" && form.external_url ? (
          <AutoResizeIframe
            src={form.external_url}
            title={form.title}
            fallbackHeight={form.external_iframe_height ?? 3200}
            className="w-full rounded-lg border border-border bg-white"
          />
        ) : done ? (
          <div className="rounded-lg border border-coral/30 bg-coral/5 p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-coral mx-auto mb-3" />
            <h2 className="font-display text-xl text-foreground mb-2">¡Inscripción recibida!</h2>
            <p className="text-muted-foreground whitespace-pre-line">{form.confirmation_message ?? "Hemos recibido tu inscripción. Te contactaremos por email."}</p>
            {(calendarUrl || cancelToken) && form.event_date && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {calendarUrl && (
                  <a href={calendarUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted">
                    <CalendarPlus className="h-4 w-4" /> Google Calendar
                  </a>
                )}
                {cancelToken && (
                  <a href={`/api/public/registro-ics/${cancelToken}`} className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted">
                    <CalendarPlus className="h-4 w-4" /> iCalendar
                  </a>
                )}
              </div>
            )}
            {cancelToken && (
              <p className="mt-4 text-xs text-muted-foreground">
                ¿No podrás venir? <a className="underline" href={`/inscripcion/baja/${cancelToken}`}>Anula tu inscripción</a>.
              </p>
            )}
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
            {!hasContactQuestion && (
              <FieldRow label="Email de contacto" required>
                <Input type="email" required value={emailContact} onChange={(e) => setEmailContact(e.target.value)} />
              </FieldRow>
            )}
            {questions.map((q) => (
              <FieldRow key={q.id} label={q.label} required={q.required} help={q.help}>
                {q.special === "guests" ? (
                  <GuestsField
                    max={maxGuests}
                    value={guests}
                    onChange={(n) => { setGuests(n); setVal(q.id, n); }}
                  />
                ) : q.special === "game_pick" ? (
                  <GamePickField value={values[q.id] as PickedGame | string | undefined} onChange={(v) => setVal(q.id, v)} />
                ) : q.special === "contact_email" ? (
                  <Input type="email" required value={(values[q.id] as string) ?? ""} onChange={(e) => setVal(q.id, e.target.value)} />
                ) : (
                  <QuestionField q={q} value={values[q.id]} onChange={(v) => setVal(q.id, v)} />
                )}
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

        {legalHtml && (
          <details className="mt-10 rounded-xl border border-border bg-muted/30 p-4">
            <summary className="cursor-pointer text-sm font-medium text-foreground">Información legal</summary>
            <div
              className="blog-content mt-3 text-xs text-muted-foreground [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: legalHtml }}
            />
          </details>
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

function GuestsField({ max, value, onChange }: { max: number; value: number; onChange: (n: number) => void }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {Array.from({ length: max + 1 }, (_, i) => (
          <SelectItem key={i} value={String(i)}>{i === 0 ? "Voy solo/a" : `${i} invitado${i === 1 ? "" : "s"}`}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function GamePickField({ value, onChange }: { value: PickedGame | string | undefined; onChange: (v: PickedGame | null) => void }) {
  const searchFn = useServerFn(searchGamesForPick);
  const searchRef = useRef(searchFn);
  searchRef.current = searchFn;
  const picked: PickedGame | null =
    value && typeof value === "object" ? (value as PickedGame)
    : typeof value === "string" && value ? { id: value, name: value, imageUrl: null }
    : null;
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Array<PickedGame & { inCatalog: boolean }>>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    let alive = true;
    setSearching(true);
    const t = setTimeout(() => {
      searchRef.current({ data: { q: term } })
        .then((r) => { if (alive) setResults((r as { games: Array<PickedGame & { inCatalog: boolean }> }).games); })
        .catch(() => { if (alive) setResults([]); })
        .finally(() => { if (alive) setSearching(false); });
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);

  if (picked) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
        {picked.imageUrl && <img src={picked.imageUrl} alt="" loading="lazy" className="h-8 w-8 rounded object-cover" />}
        <span className="text-sm text-foreground flex-1">{picked.name}</span>
        <button type="button" aria-label="Quitar juego" onClick={() => { onChange(null); setQ(""); }}>
          <X className="h-4 w-4 text-muted-foreground hover:text-coral" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" value={q} placeholder="Busca un juego…" onChange={(e) => setQ(e.target.value)} />
        {searching && <Loader2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-border bg-background shadow-lg">
          {results.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => { onChange({ id: g.id, name: g.name, imageUrl: g.imageUrl }); setResults([]); }}
              >
                {g.imageUrl && <img src={g.imageUrl} alt="" loading="lazy" className="h-8 w-8 rounded object-cover" />}
                <span className="flex-1">{g.name}</span>
                {g.inCatalog && <span className="text-[10px] uppercase tracking-wider text-coral">Ludoteca</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
