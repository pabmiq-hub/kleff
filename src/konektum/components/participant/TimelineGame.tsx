// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/konektum/supabase";
import { Button } from "@/konektum/ui/button";
import { Badge } from "@/konektum/ui/badge";
import { Card } from "@/konektum/ui/card";
import { ArrowDown, ArrowUp, CheckCircle2, Clock, Loader2, Lock, Unlock, Users, XCircle } from "lucide-react";
import { toast } from "@/konektum/hooks/use-toast";

interface Milestone {
  id: string;
  label_es: string;
  label_en: string;
}

interface Mate {
  id: string;
  name: string;
  hasEntry: boolean;
  ready: boolean;
}

interface TargetState {
  token: string;
  isMe: boolean;
  name: string | null;
  items: Milestone[];
  myGuess: string[] | null;
  answered: boolean;
  correct: boolean | null;
  revealedOrder: string[] | null;
  votesCount: number;
  totalVoters: number;
  turnComplete: boolean;
}

interface State {
  gameEnabled?: boolean;
  config?: { create_seconds: number; guess_seconds: number };
  seat?: { round: number; table: number } | null;
  status?: string;
  startedAt?: string | null;
  countdownSeconds?: number;
  myItems?: Milestone[];
  myOrder?: string[] | null;
  tablemates?: Mate[];
  iAmReady?: boolean;
  turn?: number;
  totalTurns?: number;
  target?: TargetState | null;
  rewards?: { round: number; type: string }[];
}

interface Props {
  eventId: string;
  verificationCode: string;
  lang: "es" | "en";
  onRewardsChange?: () => void;
}

const TimelineGame = ({ eventId, verificationCode, lang, onRewardsChange }: Props) => {
  const [state, setState] = useState<State | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ownOrder, setOwnOrder] = useState<string[] | null>(null);
  const [guessOrder, setGuessOrder] = useState<string[] | null>(null);
  const [now, setNow] = useState(Date.now());
  const [deadline, setDeadline] = useState<number | null>(null);
  const draggingRef = useRef(false);

  const t = (es: string, en: string) => (lang === "en" ? en : es);
  const label = (m: Milestone) => (lang === "en" ? m.label_en || m.label_es : m.label_es);

  const call = useCallback(
    async (action: string, extra: Record<string, unknown> = {}) => {
      const { data, error } = await supabase.functions.invoke("icebreaker-timeline", {
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
      if (!draggingRef.current) refresh();
    }, 4000);
    return () => window.clearInterval(id);
  }, [refresh]);

  // Local ordering state seeded from the server.
  useEffect(() => {
    if (!state) return;
    if (ownOrder === null) {
      setOwnOrder(state.myOrder || (state.myItems || []).map((i) => i.id));
    }
    const target = state.target;
    if (target && !target.isMe && !target.answered && guessOrder === null) {
      setGuessOrder(target.items.map((i) => i.id));
    }
    if (target?.answered && guessOrder !== null) setGuessOrder(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Turn timer.
  useEffect(() => {
    if (!state) return;
    const seconds = state.myOrder
      ? state.config?.guess_seconds ?? 60
      : state.config?.create_seconds ?? 60;
    setDeadline(Date.now() + seconds * 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.myOrder ? state?.target?.token : "compose"]);

  const secondsLeft = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;

  const move = (list: string[], id: string, dir: -1 | 1) => {
    const idx = list.indexOf(id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= list.length) return list;
    const copy = [...list];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    return copy;
  };

  const saveOwn = async () => {
    if (!ownOrder) return;
    setBusy(true);
    try {
      setState(await call("save_order", { order: ownOrder }));
      toast({ title: t("Timeline guardada", "Timeline saved") });
    } catch {
      toast({ title: t("No se pudo guardar tu timeline", "Could not save your timeline"), variant: "destructive" });
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

  const submitGuess = async () => {
    if (!guessOrder || !state?.target) return;
    setBusy(true);
    try {
      const data = await call("guess", { token: state.target.token, order: guessOrder });
      setState(data);
      onRewardsChange?.();
    } catch {
      toast({ title: t("No se pudo enviar tu respuesta", "Could not submit your answer"), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const nextTurn = async () => {
    setBusy(true);
    try {
      setGuessOrder(null);
      setState(await call("next_turn"));
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

  const items = state.myItems || [];
  const itemById = new Map(items.map((i) => [i.id, i]));
  const mates = state.tablemates || [];
  const readyCount = mates.filter((m) => m.ready).length + (state.iAmReady ? 1 : 0);
  const roundLabel =
    state.seat.round === 0 ? t("Ronda preliminar", "Preliminary round") : `${t("Ronda", "Round")} ${state.seat.round}`;

  const header = (
    <div className="flex items-center justify-between gap-2">
      <Badge variant="secondary">
        {roundLabel} · {t("Mesa", "Table")} {state.seat.table}
      </Badge>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {secondsLeft !== null && (
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {secondsLeft}s
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {readyCount}/{mates.length + 1} {t("listos", "ready")}
        </span>
      </div>
    </div>
  );

  const OrderList = ({
    order,
    onChange,
    disabled,
    realOrder,
  }: {
    order: string[];
    onChange?: (next: string[]) => void;
    disabled?: boolean;
    realOrder?: string[] | null;
  }) => (
    <ol className="space-y-2">
      {order.map((id, index) => {
        const m = itemById.get(id) || state.target?.items.find((i) => i.id === id);
        const okPosition = realOrder ? realOrder[index] === id : null;
        return (
          <li
            key={id}
            className={`flex items-center gap-2 rounded-xl border p-2.5 bg-card ${
              okPosition === true ? "border-green-500/60" : okPosition === false ? "border-destructive/50" : ""
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-muted grid place-items-center text-xs font-semibold shrink-0">
              {index + 1}
            </span>
            <span className="flex-1 text-sm">{m ? label(m as Milestone) : id}</span>
            {!disabled && onChange && (
              <span className="flex flex-col gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === 0}
                  onPointerDown={() => {
                    draggingRef.current = true;
                  }}
                  onClick={() => {
                    onChange(move(order, id, -1));
                    draggingRef.current = false;
                  }}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === order.length - 1}
                  onPointerDown={() => {
                    draggingRef.current = true;
                  }}
                  onClick={() => {
                    onChange(move(order, id, 1));
                    draggingRef.current = false;
                  }}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );

  // 1) Build my own timeline.
  if (!state.myOrder) {
    return (
      <div className="space-y-3">
        {header}
        <Card className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold">{t("Ordena tu línea de tiempo", "Order your timeline")}</h3>
            <p className="text-sm text-muted-foreground">
              {t(
                "Coloca estos hitos en el orden real en el que te pasaron, del más antiguo al más reciente.",
                "Place these milestones in the real order they happened, from oldest to most recent.",
              )}
            </p>
          </div>
          {ownOrder && <OrderList order={ownOrder} onChange={setOwnOrder} />}
          <Button className="w-full" onClick={saveOwn} disabled={busy || !ownOrder}>
            {busy ? t("Guardando…", "Saving…") : t("Guardar mi timeline", "Save my timeline")}
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
          <p className="font-medium">{t("Tu timeline está lista", "Your timeline is ready")}</p>
          <OrderList order={state.myOrder} disabled />
          {state.status === "countdown" ? (
            <p className="text-center text-3xl font-bold text-primary">{countdownLeft}</p>
          ) : (
            <Button className="w-full" onClick={markReady} disabled={busy || state.iAmReady}>
              {state.iAmReady ? t("Esperando a tu mesa…", "Waiting for your table…") : t("Estoy listo/a", "I'm ready")}
            </Button>
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
                      {m.hasEntry ? t("ordenando", "ordering") : t("sin timeline", "no timeline")}
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

  const target = state.target;

  // 3) Playing: turns.
  return (
    <div className="space-y-3">
      {header}
      <p className="text-xs text-muted-foreground">
        {t("Turno", "Turn")} {(state.turn ?? 0) + 1}/{state.totalTurns ?? 1}
      </p>

      {!target ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          {t("Esperando al siguiente turno…", "Waiting for the next turn…")}
        </p>
      ) : target.isMe ? (
        <Card className="p-4 space-y-3">
          <p className="font-medium">{t("¡Es tu turno! Eres la protagonista", "Your turn! You are the protagonist")}</p>
          <p className="text-sm text-muted-foreground">
            {t(
              "El resto de tu mesa está ordenando tus hitos. Cuenta la historia detrás de cada uno cuando se revele.",
              "The rest of your table is ordering your milestones. Tell the story behind each one when revealed.",
            )}
          </p>
          <OrderList order={target.revealedOrder || state.myOrder} disabled />
          <p className="text-xs text-muted-foreground">
            {target.votesCount}/{target.totalVoters} {t("respuestas recibidas", "answers received")}
          </p>
          <Button className="w-full" variant="outline" onClick={nextTurn} disabled={busy}>
            {t("Pasar al siguiente turno", "Go to next turn")}
          </Button>
        </Card>
      ) : (
        <Card className="p-4 space-y-3">
          <p className="font-medium">
            {t("Ordena la timeline de", "Order the timeline of")} {target.name}
          </p>
          {!target.answered ? (
            <>
              {guessOrder && <OrderList order={guessOrder} onChange={setGuessOrder} />}
              <Button className="w-full" onClick={submitGuess} disabled={busy || !guessOrder}>
                {t("Enviar mi orden", "Submit my order")}
              </Button>
            </>
          ) : (
            <>
              <div
                className={`flex items-center gap-2 text-sm font-medium ${
                  target.correct ? "text-green-600" : "text-destructive"
                }`}
              >
                {target.correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {target.correct
                  ? t("¡Orden exacto! Has ganado un Super Like extra", "Exact order! You earned an extra Super Like")
                  : t("No era el orden exacto", "That was not the exact order")}
              </div>
              <p className="text-xs text-muted-foreground">{t("Orden real:", "Real order:")}</p>
              <OrderList order={target.revealedOrder || []} disabled />
              {target.myGuess && !target.correct && (
                <>
                  <p className="text-xs text-muted-foreground">{t("Tu orden:", "Your order:")}</p>
                  <OrderList order={target.myGuess} disabled realOrder={target.revealedOrder} />
                </>
              )}
              <Button className="w-full" variant="outline" onClick={nextTurn} disabled={busy}>
                {t("Siguiente turno", "Next turn")}
              </Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default TimelineGame;
