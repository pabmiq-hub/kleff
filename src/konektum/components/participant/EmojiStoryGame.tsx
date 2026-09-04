// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/konektum/supabase";
import { Button } from "@/konektum/ui/button";
import { Badge } from "@/konektum/ui/badge";
import { Card } from "@/konektum/ui/card";
import { Input } from "@/konektum/ui/input";
import { CheckCircle2, Clock, Delete, Loader2, Lock, Unlock, Users, XCircle } from "lucide-react";
import { toast } from "@/konektum/hooks/use-toast";
import { EMOJI_CATEGORIES, MAX_STORY_EMOJIS, MIN_STORY_EMOJIS } from "@/konektum/lib/emojiPalette";

interface Mate {
  id: string;
  name: string;
  hasEntry: boolean;
  ready: boolean;
}

interface Story {
  token: string;
  emojis: string[];
  prompt: { es: string; en: string } | null;
  vote: { guessedId: string; correct: boolean; ownerName: string; story: string } | null;
}

interface State {
  gameEnabled?: boolean;
  config?: { compose_seconds: number; guess_seconds: number };
  seat?: { round: number; table: number } | null;
  status?: string;
  startedAt?: string | null;
  countdownSeconds?: number;
  myPrompt?: { es: string; en: string };
  myEntry?: { emojis: string[]; story: string } | null;
  tablemates?: Mate[];
  iAmReady?: boolean;
  stories?: Story[];
  rewards?: { round: number; type: string }[];
}

interface Props {
  eventId: string;
  verificationCode: string;
  lang: "es" | "en";
  onRewardsChange?: () => void;
}

const EmojiStoryGame = ({ eventId, verificationCode, lang, onRewardsChange }: Props) => {
  const [state, setState] = useState<State | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [story, setStory] = useState("");
  const [category, setCategory] = useState(EMOJI_CATEGORIES[0].id);
  const [now, setNow] = useState(Date.now());
  const editingRef = useRef(false);

  const t = (es: string, en: string) => (lang === "en" ? en : es);

  const call = useCallback(
    async (action: string, extra: Record<string, unknown> = {}) => {
      const { data, error } = await supabase.functions.invoke("icebreaker-emoji", {
        body: { eventId, verificationCode, action, ...extra },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "error");
      return data as State;
    },
    [eventId, verificationCode],
  );

  const refresh = useCallback(async () => {
    try {
      setState(await call("state"));
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  }, [call]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
      if (!editingRef.current) refresh();
    }, 4000);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    editingRef.current = editing || !state?.myEntry;
  }, [editing, state?.myEntry]);

  const submitStory = async () => {
    setBusy(true);
    try {
      const data = await call("save_story", { emojis: picked, story });
      setState(data);
      setEditing(false);
      toast({ title: t("Historia enviada", "Story submitted") });
    } catch {
      toast({ title: t("Elige entre 4 y 6 emojis", "Pick between 4 and 6 emojis"), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const markReady = async () => {
    setBusy(true);
    try {
      setState(await call("ready"));
    } catch {
      toast({ title: t("Aún no puedes marcarte como listo", "You cannot get ready yet"), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const guess = async (token: string, guessedParticipantId: string) => {
    setBusy(true);
    try {
      const data = await call("guess", { token, guessedParticipantId });
      setState(data);
      onRewardsChange?.();
    } catch {
      toast({ title: t("No se pudo enviar tu respuesta", "Could not submit your guess"), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!state?.gameEnabled || !state.seat) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {t(
          "Este juego estará disponible cuando tengas una mesa asignada.",
          "This game becomes available once you have a table assigned.",
        )}
      </p>
    );
  }

  const mates = state.tablemates || [];
  const readyCount = mates.filter((m) => m.ready).length + (state.iAmReady ? 1 : 0);
  const roundLabel =
    state.seat.round === 0 ? t("Ronda preliminar", "Preliminary round") : `${t("Ronda", "Round")} ${state.seat.round}`;
  const prompt = state.myPrompt ? (lang === "en" ? state.myPrompt.en : state.myPrompt.es) : "";

  const header = (
    <div className="flex items-center justify-between gap-2">
      <Badge variant="secondary">
        {roundLabel} · {t("Mesa", "Table")} {state.seat.table}
      </Badge>
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Users className="w-3.5 h-3.5" />
        {readyCount}/{mates.length + 1} {t("listos", "ready")}
      </span>
    </div>
  );

  // 1) Compose my emoji story.
  if (!state.myEntry || editing) {
    const cat = EMOJI_CATEGORIES.find((c) => c.id === category) || EMOJI_CATEGORIES[0];
    return (
      <div className="space-y-3">
        {header}
        <Card className="p-4 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">{t("Tu pregunta:", "Your prompt:")}</p>
            <h3 className="font-semibold">{prompt}</h3>
          </div>

          <div className="min-h-14 rounded-xl border bg-muted/40 flex items-center justify-center gap-1 p-2 text-3xl">
            {picked.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                {t(`Elige ${MIN_STORY_EMOJIS}-${MAX_STORY_EMOJIS} emojis`, `Pick ${MIN_STORY_EMOJIS}-${MAX_STORY_EMOJIS} emojis`)}
              </span>
            ) : (
              picked.map((e, i) => (
                <button key={`${e}-${i}`} type="button" onClick={() => setPicked(picked.filter((_, idx) => idx !== i))}>
                  {e}
                </button>
              ))
            )}
          </div>
          {picked.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setPicked(picked.slice(0, -1))}>
              <Delete className="w-4 h-4 mr-1.5" />
              {t("Borrar último", "Delete last")}
            </Button>
          )}

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {EMOJI_CATEGORIES.map((c) => (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={c.id === category ? "default" : "outline"}
                className="shrink-0 rounded-full"
                onClick={() => setCategory(c.id)}
              >
                {lang === "en" ? c.label_en : c.label_es}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-1">
            {cat.emojis.map((e) => (
              <button
                key={e}
                type="button"
                className="text-2xl rounded-lg py-1.5 hover:bg-muted disabled:opacity-40"
                disabled={picked.length >= MAX_STORY_EMOJIS}
                onClick={() => setPicked([...picked, e])}
              >
                {e}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">{t("La historia real (solo para ti)", "The real story (only for you)")}</p>
            <Input
              value={story}
              onChange={(e) => setStory(e.target.value)}
              maxLength={300}
              placeholder={t("Se revelará cuando tu mesa vote", "It will be revealed once your table votes")}
            />
          </div>

          <Button
            className="w-full"
            onClick={submitStory}
            disabled={busy || picked.length < MIN_STORY_EMOJIS || picked.length > MAX_STORY_EMOJIS}
          >
            {busy ? t("Enviando…", "Submitting…") : t("Enviar mi historia", "Submit my story")}
          </Button>
        </Card>
      </div>
    );
  }

  const countdownLeft = (() => {
    if (state.status !== "countdown" || !state.startedAt) return 0;
    const total = state.countdownSeconds ?? 5;
    return Math.max(0, Math.ceil(total - (now - new Date(state.startedAt).getTime()) / 1000));
  })();

  // 2) Lobby / countdown.
  if (state.status !== "playing") {
    return (
      <div className="space-y-3">
        {header}
        <Card className="p-4 space-y-3">
          <p className="font-medium">{t("Tu historia está lista", "Your story is ready")}</p>
          <div className="text-3xl flex gap-1">{state.myEntry.emojis.join(" ")}</div>
          {state.status === "countdown" ? (
            <p className="text-center text-3xl font-bold text-primary">{countdownLeft}</p>
          ) : (
            <div className="flex gap-2">
              <Button className="flex-1" onClick={markReady} disabled={busy || state.iAmReady}>
                {state.iAmReady ? t("Esperando a tu mesa…", "Waiting for your table…") : t("Estoy listo/a", "I'm ready")}
              </Button>
              {!state.iAmReady && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setPicked(state.myEntry?.emojis || []);
                    setStory(state.myEntry?.story || "");
                    setEditing(true);
                  }}
                >
                  {t("Editar", "Edit")}
                </Button>
              )}
            </div>
          )}
          <div className="space-y-1">
            {mates.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span>{m.name}</span>
                <span className="text-muted-foreground text-xs flex items-center gap-1">
                  {m.ready ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-green-600" />
                      {t("listo", "ready")}
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      {m.hasEntry ? t("escribiendo", "writing") : t("sin historia", "no story")}
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // 3) Playing: guess who wrote each emoji story.
  const stories = state.stories || [];
  const guessSeconds = state.config?.guess_seconds ?? 45;

  return (
    <div className="space-y-3">
      {header}
      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        {t(
          `Comentad las historias en voz alta (~${guessSeconds}s cada una) y asigna cada secuencia a su autor/a.`,
          `Discuss the stories out loud (~${guessSeconds}s each) and assign every sequence to its author.`,
        )}
      </p>

      {stories.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          {t("Nadie más de tu mesa ha enviado su historia.", "Nobody else at your table submitted a story.")}
        </p>
      )}

      {stories.map((s) => (
        <Card key={s.token} className="p-4 space-y-3">
          {s.prompt && (
            <p className="text-xs text-muted-foreground">{lang === "en" ? s.prompt.en : s.prompt.es}</p>
          )}
          <div className="text-3xl text-center">{s.emojis.join(" ")}</div>
          {s.vote ? (
            <div className="space-y-1.5">
              <div
                className={`flex items-center gap-2 text-sm font-medium ${
                  s.vote.correct ? "text-green-600" : "text-destructive"
                }`}
              >
                {s.vote.correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {s.vote.correct ? t("¡Correcto!", "Correct!") : t("Era de", "It was")} {s.vote.ownerName}
              </div>
              {s.vote.story && (
                <p className="text-sm bg-muted/50 rounded-lg p-2.5">
                  <span className="text-muted-foreground">{t("Historia real:", "Real story:")}</span> {s.vote.story}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mates.map((m) => (
                <Button key={m.id} variant="outline" size="sm" disabled={busy} onClick={() => guess(s.token, m.id)}>
                  {m.name}
                </Button>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default EmojiStoryGame;
