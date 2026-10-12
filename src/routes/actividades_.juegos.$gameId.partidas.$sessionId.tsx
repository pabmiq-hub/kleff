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
      <div className="flex flex-wrap gap-2">
        {s.status === "lobby" && <Button onClick={() => act("start")}>Iniciar partida</Button>}
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
                    <p className="truncate font-semibold">{p.display_name} {p.ready && s.status === "lobby" && "✓"} {p.voted && "🗳"}</p>
                    <p className="truncate text-xs text-ink/60">{p.email ?? "sin email"} · {p.online ? "conectado" : "desconectado"}</p>
                  </div>
                  <button title="Ver como jugador" onClick={async () => setAsPlayer(await viewAs({ data: { playerId: p.id } }))}><Eye className="h-4 w-4" /></button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <select value={p.character_id ?? ""} onChange={(e) => mp("assign", { playerId: p.id, characterId: e.target.value || null })} className="rounded border border-ink/20 bg-background p-1 text-sm">
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
          {d.action_requests.length ? d.action_requests.map((r: any) => <p key={r.id} className="text-sm">{r.status} · {new Date(r.created_at).toLocaleTimeString("es-ES")}</p>) : <p className="text-sm text-ink/50">Ninguna todavía (se activan en la fase 2).</p>}
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
