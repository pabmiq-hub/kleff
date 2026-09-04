// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/konektum/supabase";
import { Button } from "@/konektum/ui/button";
import { Badge } from "@/konektum/ui/badge";
import { Card } from "@/konektum/ui/card";
import { CheckCircle2, Loader2, Users, XCircle } from "lucide-react";
import { toast } from "@/konektum/hooks/use-toast";
import AvatarCanvas from "./AvatarCanvas";
import AvatarBuilder from "./AvatarBuilder";
import type { AvatarLayers } from "@/konektum/lib/avatarPieces";

interface Mate {
  id: string;
  name: string;
  hasAvatar: boolean;
  ready: boolean;
}

interface Entry {
  token: string;
  layers: AvatarLayers;
  drawing: string | null;
  vote: { guessedId: string; correct: boolean; ownerId: string; ownerName: string } | null;
}

interface State {
  buildYourself?: boolean;
  config?: { build_seconds: number; allow_drawing: boolean; prefill: boolean };
  seat?: { round: number; table: number } | null;
  status?: string;
  startedAt?: string | null;
  countdownSeconds?: number;
  myAvatar?: { layers?: AvatarLayers; drawing?: string | null } | null;
  prefillHints?: string[];
  tablemates?: Mate[];
  iAmReady?: boolean;
  entries?: Entry[];
  rewards?: { round: number; type: string }[];
}

interface Props {
  eventId: string;
  verificationCode: string;
  lang: "es" | "en";
  onRewardsChange?: () => void;
}

const BuildYourselfGame = ({ eventId, verificationCode, lang, onRewardsChange }: Props) => {
  const [state, setState] = useState<State | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const editingRef = useRef(false);

  const t = (es: string, en: string) => (lang === "en" ? en : es);

  const call = useCallback(
    async (action: string, extra: Record<string, unknown> = {}) => {
      const { data, error } = await supabase.functions.invoke("icebreakers", {
        body: { eventId, verificationCode, action, ...extra },
      });
      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "error");
      }
      return data as State;
    },
    [eventId, verificationCode],
  );

  const refresh = useCallback(async () => {
    try {
      const data = await call("state");
      setState(data);
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
    editingRef.current = editing;
  }, [editing]);

  const saveAvatar = async (layers: AvatarLayers, drawing: string | null) => {
    setBusy(true);
    try {
      const data = await call("save_avatar", { layers, drawing });
      setState(data);
      setEditing(false);
      toast({ title: t("Avatar guardado", "Avatar saved") });
    } catch {
      toast({ title: t("No se pudo guardar el avatar", "Could not save the avatar"), variant: "destructive" });
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

  if (!state?.buildYourself || !state.seat) {
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

  if (!state.myAvatar || editing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            {roundLabel} · {t("Mesa", "Table")} {state.seat.table}
          </Badge>
          {state.myAvatar && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              {t("Cancelar", "Cancel")}
            </Button>
          )}
        </div>
        <AvatarBuilder
          lang={lang}
          initialLayers={state.myAvatar?.layers}
          initialDrawing={state.myAvatar?.drawing}
          allowDrawing={state.config?.allow_drawing !== false}
          prefillHints={state.prefillHints || []}
          saving={busy}
          onSave={saveAvatar}
        />
      </div>
    );
  }

  const countdownLeft = (() => {
    if (state.status !== "countdown" || !state.startedAt) return 0;
    const total = state.countdownSeconds ?? 5;
    return Math.max(0, Math.ceil(total - (now - new Date(state.startedAt).getTime()) / 1000));
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary">
          {roundLabel} · {t("Mesa", "Table")} {state.seat.table}
        </Badge>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {readyCount}/{mates.length + 1} {t("listos", "ready")}
        </span>
      </div>

      {state.status !== "playing" && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <AvatarCanvas layers={state.myAvatar.layers} drawing={state.myAvatar.drawing} size={96} />
            <div className="space-y-1">
              <p className="font-medium">{t("Tu avatar está listo", "Your avatar is ready")}</p>
              <p className="text-sm text-muted-foreground">
                {t(
                  "Cuando todos en tu mesa estéis listos empezará la cuenta atrás.",
                  "The countdown starts once everyone at your table is ready.",
                )}
              </p>
              <Button variant="link" size="sm" className="px-0" onClick={() => setEditing(true)}>
                {t("Editar avatar", "Edit avatar")}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            {mates.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span>{m.name}</span>
                <span className="text-muted-foreground">
                  {m.ready
                    ? t("Listo", "Ready")
                    : m.hasAvatar
                      ? t("Construyendo…", "Building…")
                      : t("Sin avatar", "No avatar yet")}
                </span>
              </div>
            ))}
          </div>

          {state.status === "countdown" ? (
            <div className="text-center py-2">
              <p className="text-4xl font-bold tabular-nums animate-scale-in">{countdownLeft}</p>
              <p className="text-sm text-muted-foreground">{t("¡Empezamos!", "Here we go!")}</p>
            </div>
          ) : (
            <Button className="w-full" disabled={busy || state.iAmReady} onClick={markReady}>
              {state.iAmReady ? t("Esperando al resto…", "Waiting for the others…") : t("Estoy listo", "I'm ready")}
            </Button>
          )}
        </Card>
      )}

      {state.status === "playing" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t(
              "¿De quién es cada avatar? Elige una persona para cada uno.",
              "Whose avatar is this? Pick a person for each one.",
            )}
          </p>
          {(state.entries || []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("Nadie más de tu mesa ha creado su avatar todavía.", "Nobody else at your table has built an avatar yet.")}
            </p>
          )}
          {(state.entries || []).map((entry) => (
            <Card key={entry.token} className="p-4 space-y-3">
              <div className="flex justify-center">
                <AvatarCanvas layers={entry.layers} drawing={entry.drawing} size={132} animate />
              </div>
              {entry.vote ? (
                <div
                  className={`flex items-center justify-center gap-2 text-sm font-medium ${
                    entry.vote.correct ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  {entry.vote.correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {entry.vote.correct
                    ? t(`¡Correcto! Es ${entry.vote.ownerName}`, `Correct! It's ${entry.vote.ownerName}`)
                    : t(`Era ${entry.vote.ownerName}`, `It was ${entry.vote.ownerName}`)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {mates.map((m) => (
                    <Button
                      key={m.id}
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => guess(entry.token, m.id)}
                    >
                      {m.name}
                    </Button>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuildYourselfGame;
