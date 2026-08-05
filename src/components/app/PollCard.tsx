import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMyPolls, submitPollVote, submitPollResponse } from "@/lib/polls.functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export type MemberPoll = Awaited<ReturnType<typeof listMyPolls>>["polls"][number];

export function usePolls() {
  const listFn = useServerFn(listMyPolls);
  const [polls, setPolls] = useState<MemberPoll[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    () => listFn({ data: undefined as never }).then((r) => setPolls(r.polls as MemberPoll[])),
    [listFn],
  );

  useEffect(() => {
    void reload().finally(() => setLoading(false));
  }, [reload]);

  return { polls, loading, reload };
}

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function PollCard({ poll, onDone }: { poll: MemberPoll; onDone: () => void }) {
  const voteFn = useServerFn(submitPollVote);
  const responseFn = useServerFn(submitPollResponse);
  const [selected, setSelected] = useState<string[]>(poll.myVotes);
  const [answers, setAnswers] = useState<Record<string, string>>(poll.myAnswers ?? {});
  const [busy, setBusy] = useState(false);

  const totalVotes = poll.options.reduce((sum, o) => sum + (o.votes ?? 0), 0);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (poll.maxChoices === 1) return [id];
      if (prev.length >= poll.maxChoices) return prev;
      return [...prev, id];
    });
  };

  const handleVote = async () => {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      const r = await voteFn({ data: { pollId: poll.id, optionIds: selected } });
      toast.success(r.weight === 2 ? "Voto registrado con peso doble ✨" : "Voto registrado");
      if (r.karma?.awarded) toast.success(`+${r.karma.points} de karma por participar`);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const handleAnswers = async () => {
    const missing = poll.questions.some((q) => !(answers[q.id] ?? "").trim());
    if (missing) {
      toast.error("Responde a todas las preguntas");
      return;
    }
    setBusy(true);
    try {
      const r = await responseFn({ data: { pollId: poll.id, answers } });
      toast.success("Respuestas enviadas");
      if (r.karma?.awarded) toast.success(`+${r.karma.points} de karma por participar`);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm space-y-4">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl font-bold">{poll.title}</h3>
          <Badge variant="outline">{poll.kind === "survey" ? "Encuesta" : "Adquisiciones"}</Badge>
          {!poll.open && <Badge variant="secondary">Cerrada</Badge>}
          {poll.participated && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Ya participaste
            </span>
          )}
        </div>
        {poll.description && <p className="text-sm text-muted-foreground">{poll.description}</p>}
        {poll.closesAt && (
          <p className="text-xs text-muted-foreground">
            Cierra el {new Date(poll.closesAt).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
          </p>
        )}
      </header>

      {poll.kind === "acquisition" ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Puedes elegir hasta {poll.maxChoices} {poll.maxChoices === 1 ? "opción" : "opciones"}.
          </p>
          <ul className="space-y-2">
            {poll.options.map((o) => {
              const checked = selected.includes(o.id);
              return (
                <li key={o.id}>
                  <label
                    className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      checked ? "border-coral-deep bg-primary-soft/30" : "border-ink/15 hover:bg-cream-deep/40"
                    } ${!poll.open ? "pointer-events-none opacity-80" : ""}`}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(o.id)} disabled={!poll.open} />
                    {o.imageUrl && (
                      <img src={o.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover border border-ink/10" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">
                        {o.label} {o.year ? <span className="text-muted-foreground font-normal">({o.year})</span> : null}
                      </p>
                      {o.description && <p className="text-xs text-muted-foreground line-clamp-2">{o.description}</p>}
                      {poll.showResults && o.votes !== null && (
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-ink/10 overflow-hidden">
                            <div
                              className="h-full bg-coral-deep"
                              style={{ width: `${pct(o.votes, totalVotes)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-muted-foreground tabular-nums">{o.votes}</span>
                        </div>
                      )}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
          {poll.open && (
            <Button onClick={handleVote} disabled={busy || selected.length === 0}>
              {busy ? "Enviando…" : poll.myVotes.length ? "Cambiar mi voto" : "Votar"}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {poll.questions.map((q) => (
            <div key={q.id} className="space-y-2">
              <Label>{q.label}</Label>
              {q.type === "textarea" ? (
                <Textarea
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  disabled={!poll.open}
                  maxLength={2000}
                />
              ) : q.type === "single" ? (
                <RadioGroup
                  value={answers[q.id] ?? ""}
                  onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}
                  disabled={!poll.open}
                >
                  {(q.options ?? []).map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                      <Label htmlFor={`${q.id}-${opt}`} className="font-normal">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : q.type === "multi" ? (
                <div className="space-y-1">
                  {(q.options ?? []).map((opt) => {
                    const current = (answers[q.id] ?? "").split("|").filter(Boolean);
                    const checked = current.includes(opt);
                    return (
                      <label key={opt} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          disabled={!poll.open}
                          onCheckedChange={() =>
                            setAnswers({
                              ...answers,
                              [q.id]: (checked ? current.filter((c) => c !== opt) : [...current, opt]).join("|"),
                            })
                          }
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <Input
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  disabled={!poll.open}
                  maxLength={2000}
                />
              )}
            </div>
          ))}
          {poll.open && (
            <Button onClick={handleAnswers} disabled={busy}>
              <Sparkles className="h-4 w-4 mr-2" />
              {busy ? "Enviando…" : poll.myAnswers ? "Actualizar respuestas" : "Enviar respuestas"}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
