import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { User, Lock, ListChecks, Backpack, FileSearch, Handshake, Gavel } from "lucide-react";
import { MMAvatar, MMShell, fmtClock, useCountdown } from "./shared";
import { ActIntro, FinalReveal, FlipCard, MurderOverlay, SealedDoc } from "./animations";

type Tab = "personaje" | "secretos" | "objetivos" | "inventario" | "evidencias" | "acciones" | "acusacion";

export interface PlayerActions {
  ready: () => Promise<void>;
  toggleObjective: (id: string) => Promise<void>;
  vote: (v: { accusedCharacterId: string; motive: string; method: string }) => Promise<void>;
}

function useSeen(key: string) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  useEffect(() => setSeen(new Set(JSON.parse(localStorage.getItem(key) ?? "[]"))), [key]);
  const mark = (ids: string[]) => {
    const next = new Set([...seen, ...ids]);
    localStorage.setItem(key, JSON.stringify([...next]));
    setSeen(next);
  };
  return { seen, mark };
}

export function PlayerView({ state, actions, readOnly }: { state: any; actions?: PlayerActions; readOnly?: boolean }) {
  const s = state.session;
  const me = state.me;
  const [tab, setTab] = useState<Tab>("personaje");
  const remaining = useCountdown(s.act_ends_at, s.server_now, s.paused_remaining_seconds);
  const [overlay, setOverlay] = useState<null | "act" | "murder" | "reveal">(null);
  const prev = useRef<{ act?: string; murder?: string | null; status?: string } | null>(null);
  const storePrefix = `mm-${readOnly ? "ro" : "p"}-${me.id}`;

  // Trigger synchronized animations on state transitions (driven by server broadcast → refetch).
  useEffect(() => {
    const p = prev.current;
    const cur = { act: s.act?.id, murder: s.murder_triggered_at, status: s.status };
    if (p && !readOnly) {
      if (cur.status === "finished" && p.status !== "finished") setOverlay("reveal");
      else if (cur.murder && !p.murder) setOverlay("murder");
      else if (cur.act && cur.act !== p.act) setOverlay("act");
    }
    prev.current = cur;
  }, [s.act?.id, s.murder_triggered_at, s.status, readOnly]);

  const badgeIds: Record<Tab, string[]> = useMemo(
    () => ({
      personaje: [],
      secretos: state.secrets.map((x: any) => x.id),
      objetivos: state.objectives.map((x: any) => x.id),
      inventario: [...state.items.map((x: any) => x.id), ...state.abilities.map((x: any) => x.id)],
      evidencias: state.evidences.map((x: any) => x.id),
      acciones: [],
      acusacion: s.voting_open ? ["voting"] : [],
    }),
    [state, s.voting_open],
  );
  const { seen, mark } = useSeen(`${storePrefix}-seen`);
  useEffect(() => {
    mark(badgeIds[tab]);
  }, [tab, badgeIds[tab].join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: { id: Tab; label: string; icon: any; hidden?: boolean }[] = [
    { id: "personaje", label: "Personaje", icon: User },
    { id: "secretos", label: "Secretos", icon: Lock },
    { id: "objetivos", label: "Objetivos", icon: ListChecks },
    { id: "inventario", label: "Inventario", icon: Backpack },
    { id: "evidencias", label: "Evidencias", icon: FileSearch },
    { id: "acciones", label: "Acciones", icon: Handshake },
    { id: "acusacion", label: "Acusar", icon: Gavel, hidden: !s.voting_open && !state.vote },
  ];

  const ch = me.character;
  const statusLabel = s.status === "lobby" ? "Sala de espera" : s.status === "paused" ? "En pausa" : s.status === "finished" ? "Finalizada" : s.act?.name ?? "";

  return (
    <MMShell theme={s.game.theme}>
      <AnimatePresence>
        {overlay === "act" && s.act && <ActIntro title={s.act.name} subtitle={s.act.narrative_text} onDone={() => setOverlay(null)} />}
        {overlay === "murder" && <MurderOverlay event={s.murder_event} onDone={() => setOverlay(null)} />}
        {overlay === "reveal" && state.results && <FinalReveal results={state.results} onDone={() => setOverlay(null)} />}
      </AnimatePresence>

      <header className="sticky top-0 z-30 border-b border-[var(--mm-accent)]/20 bg-[var(--mm-bg)]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          {ch && <MMAvatar name={ch.name} config={ch.avatar_config} url={ch.avatar_url} size={44} />}
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold" style={{ fontFamily: "var(--mm-font)" }}>
              {ch?.name ?? me.display_name}
            </p>
            <p className="truncate text-xs opacity-70">{statusLabel}</p>
          </div>
          {(s.status === "running" || s.status === "paused") && (
            <div className={`rounded-lg bg-[var(--mm-surface)] px-3 py-1.5 font-mono text-xl tabular-nums ${remaining !== null && remaining < 60 ? "text-[var(--mm-primary)]" : ""}`}>
              {fmtClock(remaining)}
            </div>
          )}
        </div>
        {readOnly && <p className="mx-auto mt-2 max-w-2xl rounded bg-[var(--mm-accent)]/20 px-2 py-1 text-center text-xs">Vista de solo lectura del administrador</p>}
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">
        {s.status === "lobby" && <Lobby state={state} actions={actions} readOnly={readOnly} />}
        {s.status === "paused" && <div className="mb-4 rounded-xl bg-[var(--mm-surface)] p-4 text-center">⏸ La partida está en pausa</div>}
        {s.status === "finished" && state.results && <Results results={state.results} onReplay={() => setOverlay("reveal")} />}
        {s.murder_triggered_at && s.status !== "finished" && s.murder_event && (
          <div className="mb-4 rounded-xl border border-[var(--mm-primary)]/50 bg-[var(--mm-primary)]/15 p-3 text-sm">
            <strong>{s.murder_event.title}</strong> {s.murder_event.text}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.section key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {tab === "personaje" && <CharacterTab state={state} storePrefix={storePrefix} />}
            {tab === "secretos" && (
              <List empty="No tienes secretos todavía.">
                {state.secrets.map((x: any) => (
                  <SealedDoc key={x.id} id={`${storePrefix}-${x.id}`} label={x.own ? "Tu secreto" : `Secreto de ${x.owner}`}>
                    <p>{x.content}</p>
                  </SealedDoc>
                ))}
              </List>
            )}
            {tab === "objetivos" && <ObjectivesTab state={state} actions={actions} readOnly={readOnly} />}
            {tab === "inventario" && (
              <div className="space-y-6">
                <Section title="Objetos">
                  <List empty="Tu inventario está vacío.">
                    {state.items.map((i: any) => (
                      <Card key={i.id} title={i.name} body={i.description} />
                    ))}
                  </List>
                </Section>
                <Section title="Habilidades">
                  <List empty="Sin habilidades disponibles en este acto.">
                    {state.abilities.map((a: any) => (
                      <Card key={a.id} title={a.name} body={a.description} extra={`${a.uses_left}/${a.max_uses} usos`} />
                    ))}
                  </List>
                </Section>
                <p className="text-xs opacity-60">Usar habilidades y entregar objetos llegará en la próxima fase.</p>
              </div>
            )}
            {tab === "evidencias" && (
              <List empty="Aún no se ha liberado ninguna evidencia.">
                {state.evidences.map((e: any, i: number) => (
                  <motion.div key={e.id} initial={{ opacity: 0, rotate: i % 2 ? 2 : -2, y: -10 }} animate={{ opacity: 1, rotate: i % 2 ? 0.6 : -0.6, y: 0 }} className="relative rounded-md bg-[var(--mm-text)] p-4 pt-6 text-[var(--mm-bg)] shadow-lg">
                    <span className="absolute left-1/2 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full bg-[var(--mm-primary)]" />
                    <p className="text-[10px] uppercase tracking-widest opacity-60">
                      {e.scope === "personal" ? "Pista personal" : "Ficha del caso"}
                      {e.act ? ` · ${e.act}` : ""}
                    </p>
                    <p className="font-bold" style={{ fontFamily: "var(--mm-font)" }}>
                      {e.title}
                    </p>
                    {e.content && <p className="mt-1 text-sm">{e.content}</p>}
                    {e.image_url && <img src={e.image_url} alt={e.title} className="mt-2 rounded" loading="lazy" />}
                  </motion.div>
                ))}
              </List>
            )}
            {tab === "acciones" && (
              <div className="rounded-xl bg-[var(--mm-surface)] p-5 text-center text-sm opacity-80">
                Las acciones conjuntas (combinar objetos, habilidades y fragmentos con otros jugadores) se activarán en la próxima fase del módulo.
              </div>
            )}
            {tab === "acusacion" && <VoteTab state={state} actions={actions} readOnly={readOnly} />}
          </motion.section>
        </AnimatePresence>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--mm-accent)]/20 bg-[var(--mm-bg)]/95 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto flex max-w-2xl">
          {tabs
            .filter((t) => !t.hidden)
            .map((t) => {
              const fresh = badgeIds[t.id].some((x) => !seen.has(x));
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${tab === t.id ? "text-[var(--mm-accent)]" : "opacity-70"}`}>
                  <Icon className="h-5 w-5" />
                  <span className="truncate">{t.label}</span>
                  {fresh && tab !== t.id && <span className="absolute right-1/4 top-1.5 h-2 w-2 animate-pulse rounded-full bg-[var(--mm-primary)]" />}
                </button>
              );
            })}
        </div>
      </nav>
    </MMShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm uppercase tracking-wider text-[var(--mm-accent)]">{title}</h3>
      {children}
    </div>
  );
}
function List({ children, empty }: { children: React.ReactNode; empty: string }) {
  const arr = Array.isArray(children) ? children : [children];
  if (!arr.filter(Boolean).length) return <p className="py-6 text-center text-sm opacity-60">{empty}</p>;
  return <div className="space-y-3">{children}</div>;
}
function Card({ title, body, extra }: { title: string; body?: string | null; extra?: string }) {
  return (
    <div className="rounded-xl bg-[var(--mm-surface)] p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">{title}</p>
        {extra && <span className="shrink-0 rounded-full bg-[var(--mm-accent)]/20 px-2 py-0.5 text-xs">{extra}</span>}
      </div>
      {body && <p className="mt-1 text-sm opacity-80">{body}</p>}
    </div>
  );
}

function CharacterTab({ state, storePrefix }: { state: any; storePrefix: string }) {
  const ch = state.me.character;
  if (!ch) return <p className="py-6 text-center opacity-70">Aún no se te ha asignado personaje.</p>;
  return (
    <div className="space-y-5">
      <FlipCard
        storageKey={`${storePrefix}-flip`}
        front={
          <>
            <span className="text-5xl">🎭</span>
            <span className="mt-3 text-xl font-bold" style={{ fontFamily: "var(--mm-font)" }}>
              Tu papel
            </span>
          </>
        }
      >
        <div className="rounded-2xl bg-[var(--mm-surface)] p-5 text-center">
          <MMAvatar name={ch.name} config={ch.avatar_config} url={ch.avatar_url} size={120} className="mx-auto" />
          <h2 className="mt-3 text-2xl font-extrabold" style={{ fontFamily: "var(--mm-font)" }}>
            {ch.name}
          </h2>
          {ch.is_killer && <p className="mx-auto mt-2 w-fit rounded-full bg-[var(--mm-primary)] px-3 py-1 text-xs font-bold">Eres el asesino. Que nadie lo sepa.</p>}
          {ch.description && <p className="mt-3 text-sm opacity-90">{ch.description}</p>}
        </div>
      </FlipCard>
      {ch.alibi && (
        <Section title="Tu coartada">
          <p className="rounded-xl bg-[var(--mm-surface)] p-4 text-sm">{ch.alibi}</p>
        </Section>
      )}
      {Array.isArray(ch.relationships) && ch.relationships.length > 0 && (
        <Section title="Relaciones">
          <ul className="space-y-2">
            {ch.relationships.map((r: any, i: number) => (
              <li key={i} className="rounded-xl bg-[var(--mm-surface)] p-3 text-sm">
                {typeof r === "string" ? r : `${state.cast.find((c: any) => c.name.toLowerCase().includes(String(r.ref ?? "").toLowerCase()))?.name ?? r.ref ?? ""}: ${r.text ?? ""}`}
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Elenco">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {state.cast.map((c: any) => (
            <div key={c.character_id} className="flex flex-col items-center text-center">
              <div className="relative">
                <MMAvatar name={c.name} config={c.avatar_config} url={c.avatar_url} size={56} dimmed={c.is_victim} />
                {c.player?.online && <span className="absolute bottom-0 right-0 h-3 w-3 animate-pulse rounded-full border-2 border-[var(--mm-bg)] bg-[var(--mm-accent)]" />}
              </div>
              <p className="mt-1 text-xs font-semibold leading-tight">{c.name}</p>
              <p className="text-[10px] opacity-60">{c.is_victim ? "Víctima" : c.player?.display_name ?? "—"}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Lobby({ state, actions, readOnly }: { state: any; actions?: PlayerActions; readOnly?: boolean }) {
  const [busy, setBusy] = useState(false);
  const players = state.cast.filter((c: any) => c.player);
  return (
    <div className="mb-6 rounded-2xl bg-[var(--mm-surface)] p-5 text-center">
      <p className="text-lg font-bold" style={{ fontFamily: "var(--mm-font)" }}>
        {state.session.game.title}
      </p>
      <p className="mt-1 text-sm opacity-70">Esperando a que empiece la partida…</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {players.map((c: any) => (
          <span key={c.character_id} className="flex items-center gap-1.5 rounded-full bg-[var(--mm-bg)] px-2 py-1 text-xs">
            <span className={`h-2 w-2 rounded-full ${c.player.online ? "animate-pulse bg-[var(--mm-accent)]" : "bg-[var(--mm-text)]/30"}`} />
            {c.player.display_name} {c.player.ready && "✓"}
          </span>
        ))}
      </div>
      {!readOnly && (
        <button
          disabled={state.me.ready || busy}
          onClick={async () => {
            setBusy(true);
            await actions?.ready();
            setBusy(false);
          }}
          className="mt-5 w-full rounded-xl bg-[var(--mm-primary)] py-3 font-semibold disabled:opacity-60"
        >
          {state.me.ready ? "¡Listo! Esperando al resto" : "Estoy listo"}
        </button>
      )}
    </div>
  );
}

function ObjectivesTab({ state, actions, readOnly }: { state: any; actions?: PlayerActions; readOnly?: boolean }) {
  const groups = new Map<string, any[]>();
  for (const o of [...state.objectives].sort((a, b) => a.act_position - b.act_position)) {
    const k = o.act ?? "General";
    groups.set(k, [...(groups.get(k) ?? []), o]);
  }
  if (!groups.size) return <p className="py-6 text-center text-sm opacity-60">Tus objetivos aparecerán cuando empiece la partida.</p>;
  return (
    <div className="space-y-5">
      {[...groups].map(([act, list]) => (
        <Section key={act} title={act}>
          <div className="space-y-2">
            {list.map((o) => (
              <button
                key={o.id}
                disabled={readOnly || o.completion_type !== "manual"}
                onClick={() => actions?.toggleObjective(o.id)}
                className={`flex w-full items-start gap-3 rounded-xl p-3 text-left ${o.current ? "border border-[var(--mm-accent)] bg-[var(--mm-surface)]" : "bg-[var(--mm-surface)]/60"}`}
              >
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${o.completed ? "border-[var(--mm-accent)] bg-[var(--mm-accent)] text-[var(--mm-bg)]" : "border-[var(--mm-text)]/40"}`}>
                  {o.completed && "✓"}
                </span>
                <span className="flex-1 text-sm">
                  {o.text}
                  <span className="block text-[10px] opacity-60">
                    {o.points} pts · {o.completion_type === "manual" ? "márcalo tú" : o.completion_type === "admin" ? "lo valida el anfitrión" : "automático"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}

function VoteTab({ state, actions, readOnly }: { state: any; actions?: PlayerActions; readOnly?: boolean }) {
  const [accused, setAccused] = useState<string>("");
  const [motive, setMotive] = useState("");
  const [method, setMethod] = useState("");
  const [busy, setBusy] = useState(false);
  if (state.vote) {
    const name = state.cast.find((c: any) => c.character_id === state.vote.accused_character_id)?.name;
    return (
      <div className="rounded-2xl bg-[var(--mm-surface)] p-5 text-center">
        <p className="text-sm opacity-70">Tu acusación está registrada</p>
        <p className="mt-2 text-2xl font-bold">{name}</p>
        <p className="mt-2 text-sm opacity-80">Espera a la revelación final.</p>
      </div>
    );
  }
  const suspects = state.cast.filter((c: any) => !c.is_victim);
  return (
    <div className="space-y-4">
      <p className="text-sm opacity-80">Elige a quién acusas. Una vez enviada, tu acusación no se puede cambiar.</p>
      <div className="grid grid-cols-2 gap-3">
        {suspects.map((c: any) => (
          <button key={c.character_id} onClick={() => setAccused(c.character_id)} className={`flex flex-col items-center rounded-xl p-3 ${accused === c.character_id ? "bg-[var(--mm-primary)]" : "bg-[var(--mm-surface)]"}`}>
            <MMAvatar name={c.name} config={c.avatar_config} url={c.avatar_url} size={56} />
            <span className="mt-1 text-sm font-semibold">{c.name}</span>
          </button>
        ))}
      </div>
      <textarea value={motive} onChange={(e) => setMotive(e.target.value)} placeholder="Móvil: ¿por qué lo hizo?" className="w-full rounded-xl bg-[var(--mm-surface)] p-3 text-sm" rows={3} />
      <textarea value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Método: ¿cómo lo hizo?" className="w-full rounded-xl bg-[var(--mm-surface)] p-3 text-sm" rows={3} />
      <button
        disabled={readOnly || !accused || busy}
        onClick={async () => {
          if (!confirm("¿Enviar tu acusación? No podrás cambiarla.")) return;
          setBusy(true);
          await actions?.vote({ accusedCharacterId: accused, motive, method });
          setBusy(false);
        }}
        className="w-full rounded-xl bg-[var(--mm-primary)] py-3 font-semibold disabled:opacity-50"
      >
        Enviar acusación
      </button>
    </div>
  );
}

export function Results({ results, onReplay }: { results: any; onReplay?: () => void }) {
  return (
    <div className="mb-6 space-y-3 rounded-2xl bg-[var(--mm-surface)] p-5">
      <div className="flex items-center gap-3">
        {results.killer && <MMAvatar name={results.killer.name} config={results.killer.avatar_config} url={results.killer.avatar_url} size={56} />}
        <div>
          <p className="text-xs uppercase tracking-widest opacity-70">El asesino era</p>
          <p className="text-xl font-bold text-[var(--mm-primary)]">{results.killer?.name}</p>
        </div>
      </div>
      <ol className="space-y-2">
        {results.rows.map((r: any, i: number) => (
          <li key={r.player_id} className="flex items-center gap-2 rounded-lg bg-[var(--mm-bg)]/60 p-2 text-sm">
            <span className="w-5 text-center font-bold">{i + 1}</span>
            {r.character && <MMAvatar name={r.character.name} config={r.character.avatar_config} url={r.character.avatar_url} size={28} />}
            <span className="min-w-0 flex-1 truncate">
              {r.display_name} <span className="opacity-60">→ {r.accused ?? "sin voto"}</span>
            </span>
            <span>{r.correct ? "✅" : "❌"}</span>
            <span className="w-12 text-right font-mono">{r.score} pts</span>
          </li>
        ))}
      </ol>
      {onReplay && (
        <button onClick={onReplay} className="text-sm text-[var(--mm-accent)] underline">
          Volver a ver la revelación
        </button>
      )}
    </div>
  );
}
