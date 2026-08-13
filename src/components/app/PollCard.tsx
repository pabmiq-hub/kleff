import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMyPolls, submitPollVote, submitPollResponse } from "@/lib/polls.functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAppLocale, pickLocalized } from "@/i18n/app-i18n";
import { pollsDict } from "@/i18n/app/polls";

const DATE_LOCALE: Record<string, string> = { es: "es-ES", ca: "ca-ES", en: "en-GB" };

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
  const { locale } = useAppLocale();
  const t = pollsDict[locale].card;
  const voteFn = useServerFn(submitPollVote);
  const responseFn = useServerFn(submitPollResponse);
  const [selected, setSelected] = useState<string[]>(poll.myVotes);
  const [answers, setAnswers] = useState<Record<string, string>>(poll.myAnswers ?? {});
  const [busy, setBusy] = useState(false);

  const totalVotes = poll.options.reduce((sum, o) => sum + (o.votes ?? 0), 0);
  const title = pickLocalized(locale, { es: poll.title, ca: poll.titleCa, en: poll.titleEn });
  const description = pickLocalized(locale, { es: poll.description, ca: poll.descriptionCa, en: poll.descriptionEn });

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
      toast.success(r.weight === 2 ? t.voteRegisteredDouble : t.voteRegistered);
      if (r.karma?.awarded) toast.success(t.karmaAwarded(r.karma.points));
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.genericError);
    } finally {
      setBusy(false);
    }
  };

  const handleAnswers = async () => {
    const missing = poll.questions.some((q) => (q.required ?? true) && !(answers[q.id] ?? "").trim());
    if (missing) {
      toast.error(t.answerRequired);
      return;
    }
    setBusy(true);
    try {
      const r = await responseFn({ data: { pollId: poll.id, answers } });
      toast.success(t.answersSent);
      if (r.karma?.awarded) toast.success(t.karmaAwarded(r.karma.points));
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.genericError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm space-y-4">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl font-bold">{title}</h3>
          <Badge variant="outline">{poll.kind === "survey" ? t.kindSurvey : t.kindAcquisition}</Badge>
          {!poll.open && <Badge variant="secondary">{t.closed}</Badge>}
          {poll.participated && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> {t.alreadyParticipated}
            </span>
          )}
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {poll.closesAt && (
          <p className="text-xs text-muted-foreground">
            {t.closesOn} {new Date(poll.closesAt).toLocaleDateString(DATE_LOCALE[locale] ?? "es-ES", { day: "numeric", month: "long" })}
          </p>
        )}
      </header>

      {poll.kind === "acquisition" ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{t.chooseUpTo(poll.maxChoices)}</p>
          <ul className="space-y-2">
            {poll.options.map((o) => {
              const checked = selected.includes(o.id);
              const optLabel = pickLocalized(locale, { es: o.label, ca: o.labelCa, en: o.labelEn });
              const optDescription = pickLocalized(locale, {
                es: o.description,
                ca: o.descriptionCa,
                en: o.descriptionEn,
              });
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
                        {optLabel} {o.year ? <span className="text-muted-foreground font-normal">({o.year})</span> : null}
                      </p>
                      {optDescription && <p className="text-xs text-muted-foreground line-clamp-2">{optDescription}</p>}
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
              {busy ? t.sending : poll.myVotes.length ? t.changeVote : t.vote}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {poll.questions.map((q) => {
            const qLabel = pickLocalized(locale, { es: q.label, ca: q.labelCa, en: q.labelEn });
            const qHelp = pickLocalized(locale, { es: q.help ?? "", ca: q.helpCa, en: q.helpEn });
            const qOptions =
              (locale === "ca" && q.optionsCa?.length ? q.optionsCa : locale === "en" && q.optionsEn?.length ? q.optionsEn : q.options) ??
              [];
            return (
              <div key={q.id} className="space-y-2">
                <Label>
                  {qLabel}
                  {(q.required ?? true) && <span className="text-coral-deep"> *</span>}
                </Label>
                {qHelp && <p className="text-xs text-muted-foreground">{qHelp}</p>}
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
                    {(q.options ?? []).map((opt, i) => (
                      <div key={opt} className="flex items-center gap-2">
                        <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                        <Label htmlFor={`${q.id}-${opt}`} className="font-normal">
                          {qOptions[i] ?? opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : q.type === "select" ? (
                  <Select
                    value={answers[q.id] ?? ""}
                    onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}
                    disabled={!poll.open}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {(q.options ?? []).map((opt, i) => (
                        <SelectItem key={opt} value={opt}>
                          {qOptions[i] ?? opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : q.type === "multi" ? (
                  <div className="space-y-1">
                    {(q.options ?? []).map((opt, i) => {
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
                          {qOptions[i] ?? opt}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <Input
                    type={
                      q.type === "email" ? "email" : q.type === "phone" ? "tel" : q.type === "number" ? "number" : q.type === "date" ? "date" : "text"
                    }
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    disabled={!poll.open}
                    maxLength={2000}
                  />
                )}
              </div>
            );
          })}
          {poll.open && (
            <Button onClick={handleAnswers} disabled={busy}>
              <Sparkles className="h-4 w-4 mr-2" />
              {busy ? t.sending : poll.myAnswers ? t.updateAnswers : t.sendAnswers}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
