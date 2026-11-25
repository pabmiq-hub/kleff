import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Dices,
  Download,
  Eye,
  Mail,
  Play,
  Settings,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  HITSTER_CATEGORIES,
  HITSTER_COLORS,
  HITSTER_COLOR_STYLES,
  getRoundValidationProgress,
  hasSubmittedAnswer,
  type HitsterColor,
  type HitsterSide,
} from "@/lib/hitster";
import {
  hitsterAdminInviteCollaborator,
  hitsterAdminRemoveCollaborator,
  hitsterHostDeleteParticipant,
  hitsterHostGet,
  hitsterHostRevealAnswer,
  hitsterHostStartGame,
  hitsterHostTriggerCategory,
  hitsterHostUpdateSettings,
} from "@/lib/hitster.functions";
import { HitsterBoard } from "./HitsterBoard";
import { HitsterCategoryIcon } from "./HitsterCategoryIcon";

interface HitsterHostPanelProps {
  gameId: string;
  collabToken?: string;
  onBack?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Esperando inicio",
  playing: "En juego",
  tiebreak: "Desempate",
  finished: "Finalizada",
};

export function HitsterHostPanel({ gameId, collabToken, onBack }: HitsterHostPanelProps) {
  const qc = useQueryClient();
  const getFn = useServerFn(hitsterHostGet);
  const updateFn = useServerFn(hitsterHostUpdateSettings);
  const startFn = useServerFn(hitsterHostStartGame);
  const triggerFn = useServerFn(hitsterHostTriggerCategory);
  const revealFn = useServerFn(hitsterHostRevealAnswer);
  const delPFn = useServerFn(hitsterHostDeleteParticipant);
  const inviteFn = useServerFn(hitsterAdminInviteCollaborator);
  const removeCollabFn = useServerFn(hitsterAdminRemoveCollaborator);

  const qKey = ["hitster-host", gameId, collabToken ?? "admin"];
  const { data, isLoading, error } = useQuery({
    queryKey: qKey,
    queryFn: () => getFn({ data: { gameId, collabToken } }),
    refetchInterval: 2000,
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [side, setSide] = useState<HitsterSide>("A");
  const [timerSec, setTimerSec] = useState(30);
  const [syncedId, setSyncedId] = useState<string | null>(null);
  const [collabEmail, setCollabEmail] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data && syncedId !== data.game.id) {
      setTitle(data.game.title);
      setSlug(data.game.slug);
      setSide(data.game.side);
      setTimerSec(data.game.timer_seconds);
      setSyncedId(data.game.id);
    }
  }, [data, syncedId]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const invalidate = () => qc.invalidateQueries({ queryKey: qKey });

  const saveSettings = useMutation({
    mutationFn: () => updateFn({ data: { gameId, collabToken, title, slug, side, timer_seconds: timerSec } }),
    onSuccess: () => { toast.success("Ajustes guardados"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const startGame = useMutation({
    mutationFn: () => startFn({ data: { gameId, collabToken } }),
    onSuccess: () => { toast.success("Partida iniciada"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const triggerCategory = useMutation({
    mutationFn: (category?: HitsterColor) => triggerFn({ data: { gameId, collabToken, category } }),
    onSuccess: (res) => {
      if (res.finished) toast.success("¡Tenemos ganador!");
      else if (res.status === "tiebreak") toast.info("¡Empate! Ronda de desempate iniciada.");
      else toast.success("Categoría disparada");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revealAnswer = useMutation({
    mutationFn: () => revealFn({ data: { gameId, collabToken } }),
    onSuccess: () => { toast.success("Validación abierta en los móviles"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteParticipant = useMutation({
    mutationFn: (participantId: string) => delPFn({ data: { gameId, participantId, collabToken } }),
    onSuccess: () => { toast.success("Participante eliminado"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const inviteCollab = useMutation({
    mutationFn: () => inviteFn({ data: { gameId, email: collabEmail } }),
    onSuccess: (res) => {
      setCollabEmail("");
      if (res.emailSent) toast.success(`Invitación enviada a ${res.collaborator.email}`);
      else toast.warning(`Colaborador añadido, pero el correo falló: ${res.emailError ?? "copia el enlace manualmente"}`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeCollab = useMutation({
    mutationFn: (id: string) => removeCollabFn({ data: { id } }),
    onSuccess: () => { toast.success("Colaborador eliminado"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="py-10 text-center text-sm text-muted-foreground">Cargando partida…</p>;
  if (error || !data) return <p className="py-10 text-center text-sm text-destructive">{error instanceof Error ? error.message : "No se pudo cargar la partida."}</p>;

  const { game, currentRound, participants, collaborators, isAdmin } = data;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://kleff.es";
  const publicUrl = `${origin}/${game.slug}`;
  const cats = HITSTER_CATEGORIES[game.side];

  const serverDelta = data.serverNow - nowTick;
  const remainingSec = currentRound
    ? Math.max(0, Math.ceil((new Date(currentRound.ends_at).getTime() - (nowTick + serverDelta)) / 1000))
    : 0;

  const winners = participants.filter((p) => game.winner_participant_ids.includes(p.id));
  const tied = participants.filter((p) => game.tiebreak_participant_ids.includes(p.id));
  const validation = getRoundValidationProgress({
    status: game.status,
    tiebreakIds: game.tiebreak_participant_ids,
    participants,
  });
  const isValidating = Boolean(currentRound && currentRound.phase === "validating");
  const isAnswering = Boolean(currentRound && currentRound.phase === "answering");

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `hitster-${game.slug}-qr.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver
            </Button>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold">{game.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant={game.status === "playing" ? "default" : game.status === "tiebreak" ? "destructive" : "secondary"}>
                {STATUS_LABEL[game.status] ?? game.status}
              </Badge>
              <Badge variant="outline">Cara {game.side} · {game.side === "A" ? "Principiante" : "Experto"}</Badge>
              <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> {game.timer_seconds}s</Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("Enlace copiado"); }}
          >
            <Copy className="h-4 w-4 mr-1" /> {game.slug}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowQr((v) => !v)}>
            QR
          </Button>
        </div>
      </div>

      {showQr && (
        <div className="rounded-xl border bg-card p-5 flex flex-col items-center gap-3">
          <div ref={qrRef} className="rounded-lg bg-white p-3">
            <QRCodeCanvas value={publicUrl} size={220} marginSize={2} />
          </div>
          <p className="text-sm font-mono text-muted-foreground">{publicUrl}</p>
          <Button size="sm" variant="outline" onClick={downloadQr}>
            <Download className="h-4 w-4 mr-1" /> Descargar QR
          </Button>
        </div>
      )}

      {game.status === "finished" && winners.length > 0 && (
        <div className="rounded-xl border-2 border-amber-500 bg-amber-500/10 p-5 flex items-center gap-4">
          <Trophy className="h-10 w-10 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">¡Partida finalizada!</p>
            <p className="text-xl font-bold">
              Ganador: {winners.map((w) => w.nickname).join(", ")}
            </p>
          </div>
        </div>
      )}

      {game.status === "tiebreak" && (
        <div className="rounded-xl border-2 border-destructive bg-destructive/10 p-4">
          <p className="font-semibold text-destructive">¡Empate! Ronda de desempate</p>
          <p className="text-sm text-muted-foreground mt-1">
            Compiten: <strong>{tied.map((t) => t.nickname).join(", ")}</strong>. Gana quien se ponga en cabeza con la siguiente respuesta correcta.
          </p>
        </div>
      )}

      {/* 1. Zona activa de juego */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Control de partida</h2>
          {game.status === "draft" ? (
            <Button size="lg" onClick={() => startGame.mutate()} disabled={startGame.isPending}>
              <Play className="h-4 w-4 mr-2" /> Empezar partida
            </Button>
          ) : game.status !== "finished" ? (
            <div className="flex flex-wrap gap-2">
              {isAnswering ? (
                <>
                  <Button size="lg" onClick={() => revealAnswer.mutate()} disabled={revealAnswer.isPending}>
                    <Eye className="h-4 w-4 mr-2" /> Anunciar solución
                  </Button>
                  <Button variant="outline" onClick={() => triggerCategory.mutate(undefined)} disabled={triggerCategory.isPending}>
                    <Dices className="h-4 w-4 mr-2" /> Nueva categoría
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  variant={isValidating && !validation.allDone ? "secondary" : "default"}
                  onClick={() => triggerCategory.mutate(undefined)}
                  disabled={triggerCategory.isPending}
                >
                  <Dices className="h-4 w-4 mr-2" />
                  {currentRound ? "Disparar siguiente categoría" : "Disparar categoría aleatoria"}
                </Button>
              )}
            </div>
          ) : null}
        </div>

        {currentRound && currentRound.phase !== "closed" && (
          <div className={`rounded-xl border-2 p-4 ${HITSTER_COLOR_STYLES[currentRound.category_key].border} ${HITSTER_COLOR_STYLES[currentRound.category_key].soft}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`h-10 w-10 rounded-lg ${HITSTER_COLOR_STYLES[currentRound.category_key].bg} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                  <HitsterCategoryIcon side={game.side} color={currentRound.category_key} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase font-semibold text-muted-foreground">Ronda #{currentRound.round_number}</p>
                  <p className="text-lg font-bold">{cats[currentRound.category_key].name.es}</p>
                </div>
              </div>
              <div className="text-right">
                {currentRound.phase === "answering" ? (
                  <div className={`text-4xl font-mono font-bold tabular-nums ${remainingSec <= 5 ? "text-destructive" : ""}`}>
                    {remainingSec}s
                  </div>
                ) : validation.allDone ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-sm px-3 py-1 gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Todos listos
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    Validando ({validation.validated}/{validation.submitted} participantes)
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{cats[currentRound.category_key].description.es}</p>
          </div>
        )}

        {game.status !== "draft" && game.status !== "finished" && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">O dispara una categoría concreta:</p>
            <div className="flex flex-wrap gap-2">
              {HITSTER_COLORS.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant="outline"
                  disabled={triggerCategory.isPending}
                  onClick={() => triggerCategory.mutate(c)}
                  className="gap-2"
                >
                  <span className={`h-5 w-5 rounded-md ${HITSTER_COLOR_STYLES[c].bg} text-white flex items-center justify-center shrink-0`}>
                    <HitsterCategoryIcon side={game.side} color={c} className="h-3.5 w-3.5" />
                  </span>
                  {cats[c].name.es}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Monitor en vivo de participantes */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" /> Participantes ({participants.length})
          </h2>
        </div>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no se ha unido nadie. Comparte el enlace o el QR.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {participants.map((p) => {
              const answered = hasSubmittedAnswer(p.answer);
              return (
              <div key={p.id} className={`rounded-xl border p-3.5 space-y-3 ${p.hasLine ? "border-amber-500 bg-amber-500/5" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={p.avatar_url} alt="" className="h-9 w-9 rounded-full border bg-muted shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm truncate">{p.nickname}</p>
                        {p.hasLine && <Badge variant="default" className="text-[10px] px-1.5 py-0">¡Línea!</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{p.marksCount}/25 · {p.access_code}</p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Eliminar participante"
                    onClick={() => { if (confirm(`¿Eliminar a ${p.nickname}?`)) deleteParticipant.mutate(p.id); }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
                {currentRound && (
                  <div className="rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs flex items-center justify-between gap-2">
                    <span className={`truncate ${answered ? "text-foreground" : "text-muted-foreground italic"}`}>
                      {answered ? p.answer!.answer_text : "Sin respuesta"}
                    </span>
                    {p.answer?.is_correct === true && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                    {p.answer?.is_correct === false && <X className="h-4 w-4 text-destructive shrink-0" />}
                    {answered && p.answer?.is_correct == null && isValidating && (
                      <span className="text-[11px] text-amber-600 font-medium shrink-0">Pendiente</span>
                    )}
                  </div>
                )}
                <HitsterBoard board={p.board} marks={p.marks} size="sm" />
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Sección secundaria colapsable: Ajustes y Colaboradores */}
      <div className="space-y-3">
        <details className="group rounded-xl border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-display text-base font-semibold">
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" /> Ajustes de la partida
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="h-title">Título</Label>
                <Input id="h-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="h-slug">Enlace (kleff.es/…)</Label>
                <Input id="h-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="h-timer">Temporizador (segundos)</Label>
                <Input
                  id="h-timer"
                  type="number"
                  min={5}
                  max={300}
                  value={timerSec}
                  onChange={(e) => setTimerSec(Math.max(5, Math.min(300, Number(e.target.value) || 30)))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cara del casette</Label>
                <div className="flex gap-2">
                  {(["A", "B"] as const).map((s) => (
                    <Button
                      key={s}
                      type="button"
                      size="sm"
                      variant={side === s ? "default" : "outline"}
                      disabled={game.status !== "draft"}
                      onClick={() => setSide(s)}
                      className="flex-1"
                    >
                      Cara {s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <Button size="sm" onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
              Guardar ajustes
            </Button>
          </div>
        </details>

        {isAdmin && (
          <details className="group rounded-xl border bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-display text-base font-semibold">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" /> Colaboradores ({collaborators.length})
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Invita a un colaborador por correo electrónico: recibirá un enlace directo para gestionar esta partida sin ser superadministrador.
              </p>
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (collabEmail.trim()) inviteCollab.mutate();
                }}
              >
                <Input
                  type="email"
                  placeholder="colaborador@ejemplo.com"
                  value={collabEmail}
                  onChange={(e) => setCollabEmail(e.target.value)}
                  className="max-w-sm"
                  required
                />
                <Button type="submit" disabled={inviteCollab.isPending}>
                  Invitar por correo
                </Button>
              </form>
              {collaborators.length > 0 && (
                <div className="space-y-2">
                  {collaborators.map((c) => {
                    const link = `${origin}/hitster-host/${c.token}`;
                    return (
                      <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5 text-sm">
                        <span className="font-medium">{c.email}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { navigator.clipboard.writeText(link); toast.success("Enlace de colaborador copiado"); }}
                          >
                            <Copy className="h-3.5 w-3.5 mr-1" /> Copiar enlace
                          </Button>
                          <Button size="icon" variant="ghost" aria-label="Revocar colaborador" onClick={() => removeCollab.mutate(c.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}