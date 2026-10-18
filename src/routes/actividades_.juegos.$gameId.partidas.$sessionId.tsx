import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, RefreshCw, Mail, Eye, Trash2, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MMAdminGate } from "@/components/mm/AdminGate";
import { MMAvatar, describeEvent, fmtClock, sessionTopicName, useBroadcast, useCountdown } from "@/components/mm/shared";
import { PlayerView, Results } from "@/components/mm/PlayerView";
import { AdminReadings } from "@/components/mm/AdminReadings";
import { MM_LANGS } from "@/lib/mm/i18n";
import { isSessionLanguageLocked, shouldTriggerMurder } from "@/lib/mm/session-rules";
import { mmControlSession, mmGetSessionAdmin, mmManagePlayers, mmViewAsPlayer } from "@/lib/mm/admin.functions";

export const Route = createFileRoute("/actividades_/juegos/$gameId/partidas/$sessionId")({
  head: () => ({
    meta: [
      { title: "Panel de partida — KLEFF Juegos" },
      { name: "description", content: "Controla los actos, jugadores y actividad en vivo de la partida." },
      { property: "og:title", content: "Panel de partida — KLEFF" },
      { property: "og:description", content: "Control en vivo de una partida de misterio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => {
    const { gameId } = Route.useParams();
    return (
      <MMAdminGate back={{ to: "/actividades/juegos/$gameId", params: { gameId }, label: "Volver al juego" }}>
        <Panel />
      </MMAdminGate>
    );
  },
});

const STATUS: Record<string, string> = { lobby: "Sala de espera", running: "En juego", paused: "Pausada", finished: "Finalizada" };

function Panel() {
  const { sessionId } = Route.useParams();
  const get = useServerFn(mmGetSessionAdmin);
  const control = useServerFn(mmControlSession);
  const manage = useServerFn(mmManagePlayers);
  const viewAs = useServerFn(mmViewAsPlayer);
  const [d, setD] = useState<any>(null);
  const [emails, setEmails] = useState("");
  const [newName, setNewName] = useState("");
  const [filterPlayer, setFilterPlayer] = useState("");
  const [filterType, setFilterType] = useState("");
  const [murderPreview, setMurderPreview] = useState(false);
  const [asPlayer, setAsPlayer] = useState<any>(null);

  const load = useCallback(() => get({ data: { sessionId } }).then(setD).catch((e) => toast.error(e.message)), [sessionId]);
  useEffect(() => {
    void load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);
  useBroadcast(sessionTopicName(sessionId), () => void load());

  const s = d?.session;
  const remaining = useCountdown(s?.act_ends_at, s?.server_now, s?.paused_remaining_seconds);
  useEffect(() => {
    if (remaining === 0 && s?.control_mode !== "manual") void load();
  }, [remaining === 0]);

  const act = async (action: any, extra: Record<string, unknown> = {}) => {
    try {
      await control({ data: { sessionId, action, ...extra } as any });
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const mp = async (action: any, extra: Record<string, unknown> = {}) => {
    try {
      const r: any = await manage({ data: { sessionId, action, ...extra } as any });
      await load();
      return r;
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const charById = useMemo(() => new Map((d?.characters ?? []).map((c: any) => [c.id, c])), [d]);
  const playerById = useMemo(() => new Map((d?.players ?? []).map((p: any) => [p.id, p])), [d]);
  if (!d) return <p className="text-ink/60">Cargando…</p>;

  const log = d.log.filter((e: any) => (!filterPlayer || e.player_id === filterPlayer) && (!filterType || e.type === filterType));
  const freeChars = d.characters.filter((c: any) => !c.victim);
  const totalObj = d.players.reduce((n: number, p: any) => n + p.progress.objectives_total, 0);
  const doneObj = d.players.reduce((n: number, p: any) => n + p.progress.objectives_done, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-ink p-4 text-cream md:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="mr-auto min-w-0">
            <p className="text-xs uppercase tracking-widest opacity-60">{s.game.title}</p>
            <h1 className="truncate font-display text-2xl font-bold">{s.name}</h1>
            <p className="text-sm opacity-80">
              {STATUS[s.status]} {s.act && `· ${s.act.name}`} {s.murder_triggered_at && "· 🔪 asesinato lanzado"} {s.voting_open && "· 🗳 votación abierta"}
            </p>
          </div>
          <div className="font-mono text-5xl tabular-nums">{s.status === "running" || s.status === "paused" ? fmtClock(remaining) : "--:--"}</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["manual", "timer", "auto"] as const).map((m) => (
            <button key={m} onClick={() => act("set_mode", { mode: m })} className={`rounded-lg px-3 py-1.5 text-sm ${s.control_mode === m ? "bg-coral text-ink" : "bg-cream/10"}`}>
              {m === "manual" ? "Manual" : m === "timer" ? "Temporizador" : "Automático"}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.blind_mode} onChange={(e) => act("set_blind", { blind: e.target.checked })} /> Modo ciego
          </label>
        </div>
      </div>

      {/* Controls */}
      {s.status === "lobby" && d.eligibility && (
        <div role={d.eligibility.allowed ? "status" : "alert"} className={`border-l-4 p-3 text-sm ${d.eligibility.allowed ? "border-primary bg-primary/10" : "border-destructive bg-destructive/10 text-destructive"}`}>
          <p className="font-semibold">Jugadores: {d.eligibility.registered} · Mínimo: {d.eligibility.minimum} · Máximo: {d.eligibility.maximum}</p>
          {d.eligibility.allowed ? <p>Mínimo completo. La partida puede comenzar.</p> : d.eligibility.issues.map((issue: string) => <p key={issue}>{issue}</p>)}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {s.status === "lobby" && <Button disabled={!d.eligibility?.allowed} onClick={() => act("start")}>Iniciar partida</Button>}
        {s.status === "running" && <Button variant="outline" onClick={() => act("pause")}>Pausar</Button>}
        {s.status === "paused" && <Button onClick={() => act("resume")}>Reanudar</Button>}
        {(s.status === "running" || s.status === "paused") && (
          <>
            <Button variant="outline" onClick={() => act("add_minutes", { minutes: -1 })}>−1 min</Button>
            <Button variant="outline" onClick={() => act("add_minutes", { minutes: 1 })}>+1 min</Button>
            <Button variant="outline" onClick={() => act("add_minutes", { minutes: 5 })}>+5 min</Button>
            <Button onClick={() => confirm("¿Avanzar al siguiente acto?") && act("advance", { expectedActId: s.act?.id ?? null })}>Avanzar de acto</Button>
            {!s.murder_triggered_at && <Button variant="destructive" onClick={() => setMurderPreview(true)}>Lanzar evento del asesinato</Button>}
            <Button variant="outline" onClick={() => act(s.voting_open ? "voting_close" : "voting_open")}>{s.voting_open ? "Cerrar votación" : "Abrir votación"}</Button>
            <Button variant="outline" onClick={() => confirm("¿Finalizar la partida y lanzar la revelación?") && act("finish")}>Finalizar</Button>
          </>
        )}
        {s.status === "finished" && !s.archived && <Button variant="outline" onClick={() => act("archive")}>Archivar</Button>}
      </div>

      <SessionPlanning d={d} act={act} />
      <AdminReadings state={d} />
      {(d.wallets ?? []).length > 0 && <section className="border-b border-border pb-4">
        <h2 className="font-semibold">Dinero ficticio</h2>
        <div className="mt-3 flex flex-wrap gap-4">{d.wallets.map((w: any) => <p key={w.session_player_id} className="text-sm">{w.name}: <strong>{w.amount} {w.currency}</strong></p>)}</div>
        {(d.economy?.income_events ?? []).map((e: any) => <p key={e.ref} className="mt-2 text-sm text-muted-foreground">{e.title ?? e.ref} · {e.act} · +{e.amount} EUR</p>)}
      </section>}

      {s.status === "finished" && d.results && <div className="rounded-2xl bg-ink p-2 text-cream"><Results results={d.results} /></div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Players */}
        <section className="space-y-3 rounded-2xl border border-ink/10 bg-card p-4">
          <div className="flex items-center gap-2">
            <h2 className="mr-auto text-lg font-semibold">Jugadores ({d.players.length})</h2>
            <Button size="sm" variant="outline" onClick={() => mp("random_assign")}><Shuffle className="mr-1 h-4 w-4" /> Reparto aleatorio</Button>
          </div>
          {d.players.map((p: any) => {
            const c: any = charById.get(p.character_id);
            return (
              <div key={p.id} className="rounded-xl bg-cream-deep p-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {c ? <MMAvatar name={c.name} config={c.avatar_config} url={c.avatar_url} size={40} /> : <div className="h-10 w-10 rounded-full bg-ink/10" />}
                    <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-cream ${p.online ? "animate-pulse bg-primary" : "bg-ink/30"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {p.display_name} {p.voted && "🗳"}
                      {s.status === "lobby" && <span className={`ml-1 rounded px-1.5 text-xs ${p.ready ? "bg-primary/15 text-primary" : p.confirmed ? "bg-ink/10" : "bg-destructive/10 text-destructive"}`}>{p.ready ? "Listo" : p.confirmed ? "Confirmado" : "Sin confirmar"}</span>}
                    </p>
                    <p className="truncate text-xs text-ink/60">{p.email ?? "sin email"} · {p.online ? "conectado" : "desconectado"}</p>
                  </div>
                  <button title="Ver como jugador" onClick={async () => setAsPlayer(await viewAs({ data: { playerId: p.id } }))}><Eye className="h-4 w-4" /></button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <select value={p.character_id ?? ""} onChange={async (e) => {
                    const r = await mp("assign", { playerId: p.id, characterId: e.target.value || null });
                    if (r?.notified) toast.success("Personaje asignado y email enviado");
                  }} className="rounded border border-ink/20 bg-background p-1 text-sm">
                    <option value="">Sin personaje</option>
                    {freeChars.map((ch: any) => <option key={ch.id} value={ch.id}>{ch.name}{ch.is_killer ? " (asesino)" : ""}</option>)}
                  </select>
                  <code className="rounded bg-background px-2 py-1 font-mono">{p.access_code}</code>
                  <button title="Copiar código" onClick={() => { void navigator.clipboard.writeText(p.access_code); toast.success("Código copiado"); }}><Copy className="h-4 w-4" /></button>
                  <button title="Reenviar código" onClick={async () => { await mp("resend", { playerId: p.id }); toast.success("Código reenviado"); }}><Mail className="h-4 w-4" /></button>
                  <button title="Regenerar código" onClick={() => confirm("¿Generar un código nuevo? El anterior dejará de funcionar.") && mp("regenerate_code", { playerId: p.id })}><RefreshCw className="h-4 w-4" /></button>
                  <button title="Quitar" className="ml-auto text-destructive" onClick={() => confirm("¿Quitar jugador?") && mp("remove_player", { playerId: p.id })}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
          <div className="flex gap-2">
            <Input placeholder="Añadir jugador sin email (nombre)" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button variant="outline" disabled={!newName} onClick={async () => { await mp("add_player", { displayName: newName }); setNewName(""); }}>Añadir</Button>
          </div>
        </section>

        {/* Invitations */}
        <section className="space-y-3 rounded-2xl border border-ink/10 bg-card p-4">
          <h2 className="text-lg font-semibold">Invitaciones</h2>
          <Textarea placeholder="Emails separados por comas o saltos de línea" value={emails} onChange={(e) => setEmails(e.target.value)} rows={3} />
          <Button onClick={async () => { const r = await mp("invite", { emails: emails.split(/[\s,;]+/) }); if (r) { toast.success(`${r.count} invitación(es) enviadas`); setEmails(""); } }}>Enviar invitaciones</Button>
          <ul className="space-y-2">
            {d.invitations.map((i: any) => (
              <li key={i.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-cream-deep p-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{i.email}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${i.status === "registered" ? "bg-primary/15 text-primary" : "bg-ink/10"}`}>{i.status === "registered" ? "Aceptada" : "Enviada"}</span>
                {i.status === "sent" && (
                  <>
                    <select value={i.character_id ?? ""} onChange={(e) => mp("assign", { invitationId: i.id, characterId: e.target.value || null })} className="rounded border border-ink/20 bg-background p-1 text-xs">
                      <option value="">Personaje al azar</option>
                      {freeChars.map((ch: any) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                    </select>
                    <button title="Reenviar" onClick={async () => { await mp("resend", { invitationId: i.id }); toast.success("Invitación reenviada"); }}><Mail className="h-4 w-4" /></button>
                    <button title="Eliminar" className="text-destructive" onClick={() => mp("remove_invitation", { invitationId: i.id })}><Trash2 className="h-4 w-4" /></button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Progress */}
        <section className="space-y-3 rounded-2xl border border-ink/10 bg-card p-4">
          <h2 className="text-lg font-semibold">Progreso</h2>
          <div>
            <p className="text-sm text-ink/70">Objetivos globales: {doneObj}/{totalObj}</p>
            <Progress value={totalObj ? (doneObj / totalObj) * 100 : 0} />
          </div>
          {d.players.map((p: any) => (
            <div key={p.id} className="text-sm">
              <div className="flex justify-between"><span>{p.display_name}</span><span className="text-ink/60">{p.progress.objectives_done}/{p.progress.objectives_total}</span></div>
              <Progress value={p.progress.objectives_total ? (p.progress.objectives_done / p.progress.objectives_total) * 100 : 0} className="h-2" />
              <p className="text-xs text-ink/50">Evidencias {p.progress.evidences} · Secretos {p.progress.secrets} · Habilidades usadas {p.progress.abilities_used} · Acciones conjuntas {p.progress.joint_actions}</p>
            </div>
          ))}
        </section>

        {/* Live log */}
        <section className="space-y-3 rounded-2xl border border-ink/10 bg-card p-4">
          <h2 className="text-lg font-semibold">Actividad en vivo</h2>
          <div className="flex gap-2">
            <select value={filterPlayer} onChange={(e) => setFilterPlayer(e.target.value)} className="flex-1 rounded border border-ink/20 bg-background p-1 text-sm">
              <option value="">Todos los jugadores</option>
              {d.players.map((p: any) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="flex-1 rounded border border-ink/20 bg-background p-1 text-sm">
              <option value="">Todos los tipos</option>
              {[...new Set(d.log.map((e: any) => e.type))].map((t: any) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <ul className="max-h-96 space-y-2 overflow-y-auto">
            {log.map((e: any) => {
              const p: any = e.player_id ? playerById.get(e.player_id) : null;
              const c: any = p ? charById.get(p.character_id) : null;
              return (
                <li key={e.id} className="flex items-center gap-2 text-sm">
                  <span className="w-12 shrink-0 font-mono text-xs text-ink/50">{new Date(e.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
                  {c ? <MMAvatar name={c.name} config={c.avatar_config} url={c.avatar_url} size={24} /> : <span className="h-6 w-6 shrink-0" />}
                  <span>{describeEvent(e, p?.display_name)}</span>
                </li>
              );
            })}
            {!log.length && <li className="text-sm text-ink/50">Sin actividad todavía.</li>}
          </ul>
        </section>

        <section className="space-y-2 rounded-2xl border border-ink/10 bg-card p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold">Acciones conjuntas</h2>
          {d.action_requests.length ? d.action_requests.map((r: any) => <p key={r.id} className="text-sm">{r.payload?.title} · {r.status} · {new Date(r.created_at).toLocaleTimeString("es-ES")}</p>) : <p className="text-sm text-ink/50">Ninguna todavía.</p>}
        </section>
      </div>

      <Dialog open={murderPreview} onOpenChange={setMurderPreview}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vista previa del asesinato</DialogTitle></DialogHeader>
          <p className="text-xl font-bold">{s.murder_event?.title}</p>
          <p>{s.murder_event?.text}</p>
          <Button variant="destructive" onClick={async () => { setMurderPreview(false); await act("murder"); }}>Enviar a todos los jugadores</Button>
        </DialogContent>
      </Dialog>

      {asPlayer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <button onClick={() => setAsPlayer(null)} className="fixed right-3 top-3 z-[60] rounded-full bg-ink px-3 py-1 text-sm text-cream">Cerrar</button>
          <PlayerView state={asPlayer} readOnly />
        </div>
      )}
    </div>
  );
}

function fmt(iso: string | null | undefined) {
  return iso ? new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" }) : "—";
}
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function SessionPlanning({ d, act }: { d: any; act: (a: any, extra?: Record<string, unknown>) => Promise<void> }) {
  const s = d.session;
  const acts = d.acts_full ?? [];
  const curIdx = s.act ? acts.findIndex((a: any) => a.id === s.act.id) : -1;
  const current = curIdx >= 0 ? acts[curIdx] : null;
  const next = s.status === "lobby" ? acts[0] : acts[curIdx + 1] ?? null;
  const [releaseAt, setReleaseAt] = useState(toLocalInput(s.release_at));
  const [busy, setBusy] = useState("");
  const playable = d.characters.filter((c: any) => !c.victim);
  const assignedIds = new Set(d.players.map((p: any) => p.character_id).filter(Boolean));
  const unassigned = playable.filter((c: any) => !assignedIds.has(c.id));
  const confirmed = d.players.filter((p: any) => p.confirmed).length;
  const killerFree = unassigned.some((c: any) => c.is_killer);
  const released = !!s.characters_released_at;
  const languageLocked = isSessionLanguageLocked(s);
  const tr = (d.translations ?? []).find((t: any) => t.lang === s.language);
  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Acts */}
      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border-2 border-primary/40 bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-ink/60">Acto actual {current ? `· ${current.position} de ${acts.length}` : ""}</p>
          {current ? (
            <>
              <p className="text-xl font-bold">{current.name}</p>
              <p className="text-xs text-ink/60">{current.duration_minutes} min · {current.evidences} evidencia(s) · {current.key}</p>
              {current.narrative_text && <p className="mt-2 text-sm text-ink/80">{current.narrative_text}</p>}
            </>
          ) : (
            <p className="text-lg font-semibold">{s.status === "finished" ? "Partida finalizada" : "La partida aún no ha empezado"}</p>
          )}
        </div>
        <div className="rounded-2xl border border-ink/10 bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-ink/60">{s.status === "lobby" ? "Primer acto al iniciar" : "Siguiente al avanzar"}</p>
          {next ? (
            <>
              <p className="text-xl font-bold">{next.position}. {next.name}</p>
              <p className="text-xs text-ink/60">
                {next.duration_minutes} min · {next.evidences} evidencia(s)
                {shouldTriggerMurder(next, s) ? " · lanza el asesinato" : ""}
                {next.key === "conclusion" ? " · abre la votación" : ""}
              </p>
              {next.narrative_text && <p className="mt-2 text-sm text-ink/80">{next.narrative_text}</p>}
            </>
          ) : (
            s.status !== "finished" && <p className="text-lg font-semibold">Revelación final (al avanzar se termina la partida)</p>
          )}
        </div>
        <ol className="flex flex-wrap gap-2 md:col-span-2">
          {acts.map((a: any) => (
            <li key={a.id} className={`rounded-full px-3 py-1 text-xs ${current?.id === a.id ? "bg-primary text-primary-foreground" : current && a.position < current.position ? "bg-ink/10 line-through" : "bg-ink/5"}`}>
              {a.position}. {a.name}
            </li>
          ))}
          <li className="rounded-full bg-ink/5 px-3 py-1 text-xs">Revelación</li>
        </ol>
      </section>

      {/* Hand-out + language */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-ink/10 bg-card p-4">
          <h2 className="text-lg font-semibold">Reparto de personajes</h2>
          <p className="text-sm text-ink/70">
            Asistencia confirmada: <strong>{confirmed}</strong> de {d.players.length} registrados · {playable.length} personajes jugables
          </p>
          {released ? (
            <p className="rounded-lg bg-primary/10 p-2 text-sm">✓ Repartido el {fmt(s.characters_released_at)}. Los jugadores ya ven su personaje y han recibido el email.</p>
          ) : (
            <>
              <p className="text-sm text-ink/70">Los jugadores no ven su personaje hasta que repartas. Si no repartes, se hará automáticamente al iniciar la partida.</p>
              <label className="block text-sm">
                Reparto programado (recomendado: 24 h antes)
                <div className="mt-1 flex gap-2">
                  <Input type="datetime-local" value={releaseAt} onChange={(e) => setReleaseAt(e.target.value)} />
                  <Button variant="outline" disabled={!!busy} onClick={() => run("sched", () => act("schedule_release", { releaseAt: releaseAt ? new Date(releaseAt).toISOString() : null }))}>Guardar</Button>
                </div>
              </label>
              {s.scheduled_at && (
                <button className="text-xs underline" onClick={() => setReleaseAt(toLocalInput(new Date(new Date(s.scheduled_at).getTime() - 24 * 3600 * 1000).toISOString()))}>
                  Usar 24 h antes de la partida ({fmt(new Date(new Date(s.scheduled_at).getTime() - 24 * 3600 * 1000).toISOString())})
                </button>
              )}
              {s.release_at && <p className="text-xs text-ink/60">Programado para {fmt(s.release_at)} (se ejecuta en cuanto alguien abre la partida a partir de esa hora).</p>}
              <Button
                disabled={!!busy || !d.eligibility?.allowed || s.status !== "lobby"}
                onClick={() =>
                  confirm(`¿Repartir personajes ahora a ${d.players.length} jugador(es) y enviarles el email «Se te ha asignado…»?`) &&
                  run("rel", () => act("release"))
                }
              >
                {busy === "rel" ? "Repartiendo…" : "Repartir personajes y enviar emails"}
              </Button>
            </>
          )}
          {unassigned.length > 0 && (
            <div className={`rounded-lg p-2 text-sm ${killerFree && released ? "bg-destructive/15 text-destructive" : "bg-ink/5"}`}>
              <p className="font-semibold">{released ? "Personajes sin jugador (bajas o faltan asistentes):" : "Personajes que quedarían libres:"}</p>
              <p>{unassigned.map((c: any) => c.name + (c.is_killer ? " (asesino)" : "")).join(", ")}</p>
              {released && <p className="mt-1 text-xs">Para cubrir una baja, asigna el personaje a otro jugador en la lista: recibirá su ficha por email.</p>}
              {!released && <p className="mt-1 text-xs">Al repartir, el asesino se asigna siempre primero.</p>}
            </div>
          )}
        </div>
        <div className="space-y-3 rounded-2xl border border-ink/10 bg-card p-4">
          <h2 className="text-lg font-semibold">Idioma de la partida</h2>
          {languageLocked && <p role="status" className="rounded-lg bg-ink/5 p-2 text-sm font-semibold">Idioma fijado: {MM_LANGS.find((l) => l.code === s.language)?.label ?? s.language} (bloqueado tras el reparto o inicio).</p>}
          <p className="text-sm text-ink/70">Los jugadores verán la interfaz, los textos del juego y los emails en este idioma. El juego se traduce automáticamente la primera vez y se guarda.</p>
          <div className="flex flex-wrap gap-2">
            {MM_LANGS.map((l) => (
              <Button
                key={l.code}
                variant="outline"
                disabled={!!busy || languageLocked}
                onClick={() => run("lang", () => act("set_language", { language: l.code }))}
                className={`rounded-lg border px-3 py-1.5 text-sm ${s.language === l.code ? "border-primary bg-primary/10" : "border-ink/15"}`}
              >
                {l.label}
              </Button>
            ))}
          </div>
          {busy === "lang" && <p className="text-sm text-ink/60">Traduciendo el juego… puede tardar un minuto.</p>}
          {s.language !== "es" && tr && <p className="text-xs text-ink/60">Traducción guardada el {fmt(tr.created_at)}{tr.source_hash ? "" : " (incompleta: vuelve a pulsar el idioma para completarla)"}.</p>}
          {!languageLocked && <p className="text-xs text-ink/50">Si actualizas el JSON del juego, vuelve a pulsar el idioma para regenerar la traducción antes de repartir.</p>}
        </div>
      </section>

      {/* Dossiers */}
      <section className="space-y-2 rounded-2xl border border-ink/10 bg-card p-4">
        <h2 className="text-lg font-semibold">Fichas de personajes</h2>
        {s.blind_mode && s.status !== "finished" && <p className="text-xs text-ink/60">Modo ciego: se oculta quién es el asesino, pero los secretos pueden dar pistas.</p>}
        {d.characters.map((c: any) => {
          const pl = d.players.find((p: any) => p.character_id === c.id);
          return (
            <details key={c.id} className="rounded-xl bg-cream-deep p-3">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <MMAvatar name={c.name} config={c.avatar_config} url={c.avatar_url} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {c.name}
                    {c.is_killer && <span className="ml-1 rounded bg-destructive/15 px-1.5 text-xs text-destructive">Asesino</span>}
                    {c.victim && <span className="ml-1 rounded bg-ink/10 px-1.5 text-xs">Víctima</span>}
                  </p>
                  <p className="truncate text-xs text-ink/60">{pl ? `${pl.display_name}${pl.online ? " · conectado" : ""}` : c.victim ? "No jugable" : "Sin jugador"}</p>
                </div>
              </summary>
              <div className="mt-3 space-y-3 text-sm">
                {c.public_summary && <Field label="Presentación pública">{c.public_summary}</Field>}
                {c.description && <Field label="Descripción">{c.description}</Field>}
                {c.costume && <Field label="Vestuario">{c.costume}</Field>}
                {c.alibi && <Field label="Coartada">{c.alibi}</Field>}
                {Array.isArray(c.relationships) && c.relationships.length > 0 && (
                  <Field label="Relaciones">
                    <ul className="list-disc pl-5">{c.relationships.map((r: any, i: number) => <li key={i}>{typeof r === "string" ? r : `${r.ref ?? ""}: ${r.text ?? ""}`}</li>)}</ul>
                  </Field>
                )}
                {c.secrets.length > 0 && (
                  <Field label="Secretos">
                    <ul className="list-disc pl-5">{c.secrets.map((x: any) => <li key={x.id}>{x.content}{x.known_by.length ? <span className="text-ink/50"> — lo saben: {x.known_by.join(", ")}</span> : null}</li>)}</ul>
                  </Field>
                )}
                {c.objectives.length > 0 && (
                  <Field label="Objetivos">
                    <ul className="list-disc pl-5">{c.objectives.map((x: any) => <li key={x.id}>{x.text} <span className="text-ink/50">({x.act ?? "general"} · {x.points} pts · {x.completion_type})</span></li>)}</ul>
                  </Field>
                )}
                {c.items.length > 0 && (
                  <Field label="Objetos">
                    <ul className="list-disc pl-5">{c.items.map((x: any) => <li key={x.id}><strong>{x.name}</strong>{x.description ? ` — ${x.description}` : ""}{x.from ? <span className="text-ink/50"> (desde {x.from})</span> : null}</li>)}</ul>
                  </Field>
                )}
                {c.abilities.length > 0 && (
                  <Field label="Habilidades">
                    <ul className="list-disc pl-5">{c.abilities.map((x: any) => <li key={x.id}><strong>{x.name}</strong>{x.description ? ` — ${x.description}` : ""} <span className="text-ink/50">({x.max_uses} usos{x.from ? `, desde ${x.from}` : ""})</span></li>)}</ul>
                  </Field>
                )}
                {pl && <p className="text-xs text-ink/60">Código: <code>{pl.access_code}</code> · Objetivos {pl.progress.objectives_done}/{pl.progress.objectives_total} · {pl.voted ? "Ha votado" : "Sin voto"}</p>}
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">{label}</p>
      <div className="whitespace-pre-line">{children}</div>
    </div>
  );
}
