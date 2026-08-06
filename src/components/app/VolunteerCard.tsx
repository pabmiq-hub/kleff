import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyVolunteerApplication, submitVolunteerApplication } from "@/lib/volunteers.functions";
import {
  EMPTY_VOLUNTEER_ANSWERS,
  VOLUNTEER_AREAS,
  VOLUNTEER_BENEFITS,
  VOLUNTEER_EVENT_CATEGORIES,
  VOLUNTEER_EVENT_ROLES,
  VOLUNTEER_INSTITUTIONAL,
  VOLUNTEER_LANGUAGES,
  VOLUNTEER_STATUS_LABELS,
  type VolunteerAnswers,
} from "@/lib/volunteer-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { HeartHandshake } from "lucide-react";

function MultiCheck({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (o: string) =>
    onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);
  return (
    <div>
      <Label className="text-sm font-semibold">{title}</Label>
      <div className="grid sm:grid-cols-2 gap-2 mt-2">
        {options.map((o) => (
          <label key={o} className="flex items-start gap-2 text-sm cursor-pointer">
            <Checkbox checked={value.includes(o)} onCheckedChange={() => toggle(o)} className="mt-0.5" />
            <span>{o}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function VolunteerCard() {
  const load = useServerFn(getMyVolunteerApplication);
  const submit = useServerFn(submitVolunteerApplication);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<VolunteerAnswers>(EMPTY_VOLUNTEER_ANSWERS);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await load();
      setStatus(res.application?.status ?? null);
      setFullName(res.prefill.fullName);
      setEmail(res.prefill.email);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof VolunteerAnswers>(k: K, v: VolunteerAnswers[K]) =>
    setAnswers((a) => ({ ...a, [k]: v }));

  const send = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error("Nombre y email son obligatorios");
      return;
    }
    if (answers.areas.length === 0) {
      toast.error("Elige al menos un área de colaboración");
      return;
    }
    setSaving(true);
    try {
      await submit({ data: { fullName, email, phone: phone || null, answers } });
      toast.success("¡Solicitud enviada! Te avisaremos pronto.");
      setOpen(false);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  const inProgress = status === "pending" || status === "reviewing";

  return (
    <>
      <div className="bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-coral-deep font-semibold">
              <HeartHandshake className="h-5 w-5" /> Equipo de organización
            </div>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              ¿Te apetece echar una mano en los eventos de KLEFF? Cuéntanos en qué te gustaría colaborar y nos ponemos
              en contacto contigo.
            </p>
            {status && (
              <p className="text-xs mt-2 text-ink/70">
                Estado de tu solicitud: <strong>{VOLUNTEER_STATUS_LABELS[status] ?? status}</strong>
              </p>
            )}
          </div>
          <Button
            onClick={() => setOpen(true)}
            disabled={inProgress}
            className="bg-coral text-cream hover:bg-coral/90"
          >
            {inProgress ? "Solicitud enviada" : status === "accepted" ? "Ya formas parte" : "Únete al equipo"}
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Únete al equipo de organización</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Nombre</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Teléfono</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <MultiCheck
              title="¿En qué áreas te gustaría colaborar?"
              options={VOLUNTEER_AREAS}
              value={answers.areas}
              onChange={(v) => set("areas", v)}
            />
            <MultiCheck
              title="¿En qué tipo de eventos puedes ayudar?"
              options={VOLUNTEER_EVENT_CATEGORIES}
              value={answers.eventCategories}
              onChange={(v) => set("eventCategories", v)}
            />
            <MultiCheck
              title="Rol dentro del evento"
              options={VOLUNTEER_EVENT_ROLES}
              value={answers.eventRoles}
              onChange={(v) => set("eventRoles", v)}
            />
            <MultiCheck
              title="¿Qué beneficios te gustaría recibir?"
              options={VOLUNTEER_BENEFITS}
              value={answers.benefits}
              onChange={(v) => set("benefits", v)}
            />
            <MultiCheck
              title="Idiomas en los que puedes atender"
              options={VOLUNTEER_LANGUAGES}
              value={answers.languages}
              onChange={(v) => set("languages", v)}
            />
            <MultiCheck
              title="Áreas institucionales"
              options={VOLUNTEER_INSTITUTIONAL}
              value={answers.institutional}
              onChange={(v) => set("institutional", v)}
            />

            <div>
              <Label className="text-sm font-semibold">Disponibilidad habitual</Label>
              <Input
                className="mt-2"
                placeholder="Ej. viernes tarde y sábados"
                value={answers.availability}
                onChange={(e) => set("availability", e.target.value)}
              />
            </div>

            <div className="border-t pt-4 space-y-3">
              <Label className="text-sm font-semibold">Sobre la cuota de socio</Label>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">¿Debería existir una cuota?</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={answers.duesOpinion === "yes"}
                    onCheckedChange={() => set("duesOpinion", answers.duesOpinion === "yes" ? "" : "yes")}
                  />
                  Sí
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={answers.duesOpinion === "no"}
                    onCheckedChange={() => set("duesOpinion", answers.duesOpinion === "no" ? "" : "no")}
                  />
                  No
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Importe anual justo (€)</Label>
                  <Input value={answers.duesAmount} onChange={(e) => set("duesAmount", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Beneficios que debería incluir</Label>
                  <Input value={answers.duesBenefits} onChange={(e) => set("duesBenefits", e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Comentarios y propuestas de mejora</Label>
              <Textarea
                className="mt-2"
                rows={4}
                value={answers.comments}
                onChange={(e) => set("comments", e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={send} disabled={saving} className="bg-coral text-cream hover:bg-coral/90">
                {saving ? "Enviando…" : "Enviar solicitud"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
