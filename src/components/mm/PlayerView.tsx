import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { MMAvatar, MMShell, fmtClock, useCountdown } from "./shared";
import { ActIntro, FinalReveal, FlipCard, MurderOverlay, SealedDoc } from "./animations";
import { mmT, mmLocale, type MMKey } from "@/lib/mm/i18n";
import { Interactions } from "./Interactions";
import { MapTab } from "./MapTab";
import { CharacterNavigation, PlayerNavigation } from "./PlayerNavigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { isCharacterTab, votingPrompt, type CharacterTabId, type PlayerTab } from "@/lib/mm/player-navigation";

type Tab = PlayerTab;

export interface PlayerActions {
  confirm: () => Promise<void>;
  ready: () => Promise<void>;
  toggleObjective: (id: string) => Promise<void>;
  vote: (v: { accusedCharacterId: string; motive: string; method: string }) => Promise<void>;
  interact?: (data: any) => Promise<void>;
  consult?: (featureId: string) => Promise<{ content: string; image_url: string | null; evidence_title: string | null }>;
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
  const t = (k: MMKey, v?: Record<string, string | number>) => mmT(s.language, k, v);
  const [tab, setTab] = useState<Tab>("personaje");
  const [characterTab, setCharacterTab] = useState<CharacterTabId>("personaje");
  const panelRef = useRef<HTMLDivElement>(null);
  const selectTab = (next: Tab) => {
    const target = next === "personaje" ? characterTab : next;
    setTab(target);
    if (isCharacterTab(target)) setCharacterTab(target);
    panelRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  };
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
      mapa: (state.map?.locations ?? []).map((l: any) => l.id),
      acciones: (state.requests ?? []).filter((r: any) => r.status === "pending" && r.to_players.includes(me.id)).map((r: any) => r.id),
      acusacion: s.voting_open ? ["voting"] : [],
    }),
    [state, s.voting_open],
  );
  const { seen, mark } = useSeen(`${storePrefix}-seen`);
  useEffect(() => {
    mark(badgeIds[tab]);
  }, [tab, badgeIds[tab].join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const fresh = Object.fromEntries(Object.entries(badgeIds).map(([id, ids]) => [id, ids.some((id) => !seen.has(id))])) as Record<Tab, boolean>;
  const votePrompt = votingPrompt(s.voting_open, !!state.vote);
  useEffect(() => {
    if (tab === "acusacion" && !votePrompt) setTab(characterTab);
    if (tab === "mapa" && !state.map) setTab(characterTab);
  }, [tab, votePrompt, state.map, characterTab]);

  const ch = me.character;
  const statusLabel = s.status === "lobby" ? t("status_lobby") : s.status === "paused" ? t("status_paused") : s.status === "finished" ? t("status_finished") : s.act ? `${t("act_of", { n: s.act.position, total: s.acts.length })} · ${s.act.name}` : "";

  return (
    <MMShell theme={s.game.theme}>
      <AnimatePresence>
        {overlay === "act" && s.act && <ActIntro title={s.act.name} subtitle={s.act.narrative_text} onDone={() => setOverlay(null)} />}
        {overlay === "murder" && <MurderOverlay event={s.murder_event} onDone={() => setOverlay(null)} />}
        {overlay === "reveal" && state.results && <FinalReveal results={state.results} onDone={() => setOverlay(null)} />}
      </AnimatePresence>

      <header className="sticky top-0 z-30 border-b border-[var(--mm-accent)]/20 bg-[var(--mm-bg)]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto grid max-w-2xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex">
          <div className="flex min-w-0 items-center gap-3 sm:flex-1">
            {ch && <MMAvatar name={ch.name} config={ch.avatar_config} url={ch.avatar_url} size={44} />}
            <div className="min-w-0">
            <p className="truncate font-bold" style={{ fontFamily: "var(--mm-font)" }}>
              {ch?.name ?? me.display_name}
            </p>
            <p className="truncate text-xs opacity-70">{statusLabel}</p>
            </div>
          </div>
          {(s.status === "running" || s.status === "paused") && (
            <div className={`shrink-0 rounded-lg bg-[var(--mm-surface)] px-3 py-1.5 font-mono text-xl tabular-nums ${remaining !== null && remaining < 60 ? "text-[var(--mm-primary)]" : ""}`}>
              {fmtClock(remaining)}
            </div>
          )}
        </div>
        {(s.status === "running" || s.status === "paused") && s.act && <ActProgress acts={s.acts} current={s.act.position} label={t("final_reveal_step")} />}
        {readOnly && <p className="mx-auto mt-2 max-w-2xl rounded bg-[var(--mm-accent)]/20 px-2 py-1 text-center text-xs">{t("readonly")}</p>}
      </header>

      <main className={`mx-auto max-w-2xl px-4 pt-4 ${votePrompt === "accuse" ? "pb-[calc(10rem+env(safe-area-inset-bottom))]" : votePrompt === "recorded" ? "pb-[calc(8rem+env(safe-area-inset-bottom))]" : "pb-[calc(6rem+env(safe-area-inset-bottom))]"}`}>
        {s.status === "lobby" && <Lobby state={state} actions={actions} readOnly={readOnly} t={t} />}
        {s.status === "paused" && <div className="mb-4 rounded-xl bg-[var(--mm-surface)] p-4 text-center">{t("paused_banner")}</div>}
        {s.status === "finished" && state.results && <Results results={state.results} lang={s.language} onReplay={() => setOverlay("reveal")} />}
        {s.murder_triggered_at && s.status !== "finished" && s.murder_event && (
          <div className="mb-4 rounded-xl border border-[var(--mm-primary)]/50 bg-[var(--mm-primary)]/15 p-3 text-sm">
            <strong>{s.murder_event.title}</strong> {s.murder_event.text}
          </div>
        )}
        {s.status !== "lobby" && s.status !== "finished" && s.act && (
          <div className="mb-4 rounded-xl border border-[var(--mm-accent)]/40 bg-[var(--mm-surface)] p-4">
            <p className="text-[10px] uppercase tracking-widest text-[var(--mm-accent)]">{t("act_of", { n: s.act.position, total: s.acts.length })}</p>
            <p className="text-lg font-bold" style={{ fontFamily: "var(--mm-font)" }}>{s.act.name}</p>
            {s.act.narrative_text && <p className="mt-1 text-sm opacity-80">{s.act.narrative_text}</p>}
          </div>
        )}

        {(state.readings ?? []).map((reading: any, i: number) => (
          <article key={`${reading.act}-${i}`} role="status" className="mb-4 min-w-0 rounded-lg border-2 border-primary bg-card p-4 text-card-foreground">
            <p className="flex items-start gap-2 font-semibold text-primary"><BookOpen className="mt-0.5 h-5 w-5 shrink-0" />{t("reading_cue")}</p>
            <h2 className="mt-2 break-words text-lg font-bold">{reading.title}</h2>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{reading.text}</p>
          </article>
        ))}

        <div ref={panelRef} className="scroll-mt-40">
        <Tabs value={tab} onValueChange={(value) => {
          if (!isCharacterTab(value)) return;
          setCharacterTab(value);
          setTab(value);
        }}>
        {isCharacterTab(tab) && <CharacterNavigation language={s.language} fresh={fresh} />}
        <AnimatePresence mode="wait">
          <TabsContent key={tab} value={tab} asChild>
          <motion.section key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {tab === "personaje" && <CharacterTab state={state} storePrefix={storePrefix} t={t} />}
            {tab === "secretos" && (
              <List empty={t("no_secrets")}>
                {state.secrets.map((x: any) => (
                  <SealedDoc key={x.id} id={`${storePrefix}-${x.id}`} label={x.own ? t("your_secret") : t("secret_of", { name: x.owner })}>
                    <p>{x.content}</p>
                  </SealedDoc>
                ))}
              </List>
            )}
            {tab === "objetivos" && <ObjectivesTab state={state} actions={actions} readOnly={readOnly} t={t} />}
            {tab === "inventario" && <Interactions state={state} run={actions?.interact} readOnly={readOnly} inventory />}
            {tab === "evidencias" && (
              <List empty={t("no_evidence")}>
                {state.evidences.map((e: any, i: number) => (
                  <motion.div key={e.id} initial={{ opacity: 0, rotate: i % 2 ? 2 : -2, y: -10 }} animate={{ opacity: 1, rotate: i % 2 ? 0.6 : -0.6, y: 0 }} className="relative rounded-md bg-[var(--mm-text)] p-4 pt-6 text-[var(--mm-bg)] shadow-lg">
                    <span className="absolute left-1/2 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full bg-[var(--mm-primary)]" />
                    <p className="text-[10px] uppercase tracking-widest opacity-60">
                      {e.scope === "personal" ? t("personal_clue") : t("case_file")}
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
            {tab === "mapa" && state.map && <MapTab map={state.map} consult={actions?.consult} readOnly={readOnly} />}
            {tab === "acciones" && <Interactions state={state} run={actions?.interact} readOnly={readOnly} />}
            {tab === "acusacion" && <VoteTab state={state} actions={actions} readOnly={readOnly} t={t} />}
          </motion.section>
          </TabsContent>
        </AnimatePresence>
        </Tabs>
        </div>
      </main>

      <PlayerNavigation tab={tab} language={s.language} hasMap={!!state.map} votingOpen={s.voting_open} hasVote={!!state.vote} fresh={fresh} onSelect={selectTab} />
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

type TFn = (k: MMKey, v?: Record<string, string | number>) => string;

function ActProgress({ acts, current, label }: { acts: any[]; current: number; label: string }) {
  return (
    <div className="mx-auto mt-2 flex max-w-2xl items-center gap-1">
      {acts.map((a) => (
        <div key={a.id} title={a.name} className={`h-1.5 flex-1 rounded-full ${a.position < current ? "bg-[var(--mm-accent)]" : a.position === current ? "animate-pulse bg-[var(--mm-primary)]" : "bg-[var(--mm-text)]/15"}`} />
      ))}
      <span className="ml-1 text-[10px] opacity-60">{label}</span>
    </div>
  );
}

function CastList({ state, t }: { state: any; t: TFn }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Section title={t("cast")}>
      <p className="mb-2 text-xs opacity-60">{t("cast_hint")}</p>
      <div className="space-y-2">
        {state.cast.map((c: any) => {
          const isOpen = open === c.character_id;
          return (
            <button key={c.character_id} onClick={() => setOpen(isOpen ? null : c.character_id)} className="flex w-full items-start gap-3 rounded-xl bg-[var(--mm-surface)] p-3 text-left">
              <div className="relative">
                <MMAvatar name={c.name} config={c.avatar_config} url={c.avatar_url} size={48} dimmed={c.is_victim} />
                {c.player?.online && <span className="absolute bottom-0 right-0 h-3 w-3 animate-pulse rounded-full border-2 border-[var(--mm-bg)] bg-[var(--mm-accent)]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">{c.name}</p>
                <p className="text-xs opacity-60">{c.is_victim ? t("victim") : c.player ? t("played_by", { name: c.player.display_name }) : t("unassigned")}</p>
                {c.summary && <p className={`mt-1 text-sm opacity-85 ${isOpen ? "" : "line-clamp-2"}`}>{c.summary}</p>}
              </div>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

function CharacterTab({ state, storePrefix, t }: { state: any; storePrefix: string; t: TFn }) {
  const ch = state.me.character;
  const s = state.session;
  if (!ch)
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-[var(--mm-surface)] p-5 text-center">
          <span className="text-4xl">🎭</span>
          <p className="mt-2 text-sm opacity-85">{s.characters_released_at ? t("not_assigned") : t("pending_release")}</p>
          {!s.characters_released_at && s.release_at && (
            <p className="mt-2 text-xs text-[var(--mm-accent)]">{t("release_on", { date: new Date(s.release_at).toLocaleString(mmLocale(s.language), { dateStyle: "full", timeStyle: "short" }) })}</p>
          )}
        </div>
        {(s.game.briefing || s.game.synopsis) && (
          <Section title={t("briefing")}>
            <p className="whitespace-pre-line rounded-xl bg-[var(--mm-surface)] p-4 text-sm">{s.game.briefing || s.game.synopsis}</p>
          </Section>
        )}
        {state.cast.length > 0 && <CastList state={state} t={t} />}
      </div>
    );
  return (
    <div className="space-y-5">
      <FlipCard
        storageKey={`${storePrefix}-flip`}
        front={
          <>
            <span className="text-5xl">🎭</span>
            <span className="mt-3 text-xl font-bold" style={{ fontFamily: "var(--mm-font)" }}>
              {t("your_role")}
            </span>
          </>
        }
      >
        <div className="rounded-2xl bg-[var(--mm-surface)] p-5 text-center">
          <MMAvatar name={ch.name} config={ch.avatar_config} url={ch.avatar_url} size={120} className="mx-auto" />
          <h2 className="mt-3 text-2xl font-extrabold" style={{ fontFamily: "var(--mm-font)" }}>
            {ch.name}
          </h2>
          {ch.is_killer && <p className="mx-auto mt-2 w-fit rounded-full bg-[var(--mm-primary)] px-3 py-1 text-xs font-bold">{t("you_are_killer")}</p>}
          {ch.description && <p className="mt-3 whitespace-pre-line text-sm opacity-90">{ch.description}</p>}
        </div>
      </FlipCard>
      {ch.costume && (
        <Section title={t("costume")}>
          <p className="rounded-xl bg-[var(--mm-surface)] p-4 text-sm">{ch.costume}</p>
        </Section>
      )}
      {ch.alibi && (
        <Section title={t("your_alibi")}>
          <p className="rounded-xl bg-[var(--mm-surface)] p-4 text-sm">{ch.alibi}</p>
        </Section>
      )}
      {Array.isArray(ch.relationships) && ch.relationships.length > 0 && (
        <Section title={t("relationships")}>
          <ul className="space-y-2">
            {ch.relationships.map((r: any, i: number) => (
              <li key={i} className="rounded-xl bg-[var(--mm-surface)] p-3 text-sm">
                {typeof r === "string" ? r : `${state.cast.find((c: any) => c.name.toLowerCase().includes(String(r.ref ?? "").toLowerCase()))?.name ?? r.ref ?? ""}: ${r.text ?? ""}`}
              </li>
            ))}
          </ul>
        </Section>
      )}
      {(s.game.briefing || s.game.synopsis) && s.status === "lobby" && (
        <Section title={t("briefing")}>
          <p className="whitespace-pre-line rounded-xl bg-[var(--mm-surface)] p-4 text-sm">{s.game.briefing || s.game.synopsis}</p>
        </Section>
      )}
      <CastList state={state} t={t} />
    </div>
  );
}

function Lobby({ state, actions, readOnly, t }: { state: any; actions?: PlayerActions; readOnly?: boolean; t: TFn }) {
  const [busy, setBusy] = useState(false);
  const released = !!state.session.characters_released_at;
  const me = state.me;
  const run = async (fn?: () => Promise<void>) => {
    setBusy(true);
    await fn?.();
    setBusy(false);
  };
  const steps: [string, boolean][] = [
    [t("step_confirm"), me.confirmed],
    [t("step_wait_role"), released],
    [t("step_read_role"), released && !!me.character],
    [t("step_ready"), me.ready],
  ];
  return (
    <div className="mb-6 rounded-2xl bg-[var(--mm-surface)] p-5">
      <p className="text-center text-lg font-bold" style={{ fontFamily: "var(--mm-font)" }}>
        {state.session.game.title}
      </p>
      <p className="mt-1 text-center text-sm opacity-70">{t("waiting_start")}</p>
      <p className="mt-4 text-xs uppercase tracking-wider text-[var(--mm-accent)]">{t("steps_title")}</p>
      <ol className="mt-2 space-y-1.5 text-sm">
        {steps.map(([label, done], i) => (
          <li key={i} className={`flex items-start gap-2 ${done ? "opacity-60" : ""}`}>
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${done ? "bg-[var(--mm-accent)] text-[var(--mm-bg)]" : "border border-[var(--mm-text)]/40"}`}>{done ? "✓" : i + 1}</span>
            <span className={done ? "line-through" : ""}>{label}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {(state.attendees ?? []).map((p: any) => (
          <span key={p.id} className="flex items-center gap-1.5 rounded-full bg-[var(--mm-bg)] px-2 py-1 text-xs">
            <span className={`h-2 w-2 rounded-full ${p.online ? "animate-pulse bg-[var(--mm-accent)]" : "bg-[var(--mm-text)]/30"}`} />
            {p.display_name} {p.ready ? "✓✓" : p.confirmed ? "✓" : ""}
          </span>
        ))}
      </div>
      {!readOnly &&
        (!released ? (
          <button disabled={me.confirmed || busy} onClick={() => run(actions?.confirm)} className="mt-5 w-full rounded-xl bg-[var(--mm-primary)] py-3 font-semibold disabled:opacity-60">
            {me.confirmed ? t("confirmed_wait") : t("confirm_attendance")}
          </button>
        ) : (
          <button disabled={me.ready || busy} onClick={() => run(actions?.ready)} className="mt-5 w-full rounded-xl bg-[var(--mm-primary)] py-3 font-semibold disabled:opacity-60">
            {me.ready ? t("ready_wait") : t("ready")}
          </button>
        ))}
    </div>
  );
}

function ObjectivesTab({ state, actions, readOnly, t }: { state: any; actions?: PlayerActions; readOnly?: boolean; t: TFn }) {
  const groups = new Map<string, any[]>();
  for (const o of [...state.objectives].sort((a, b) => a.act_position - b.act_position)) {
    const k = o.act ?? t("general");
    groups.set(k, [...(groups.get(k) ?? []), o]);
  }
  if (!groups.size) return <p className="py-6 text-center text-sm opacity-60">{t("objectives_later")}</p>;
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
                    {t("pts", { n: o.points })} · {o.completion_type === "manual" ? t("mark_yourself") : o.completion_type === "admin" ? t("host_validates") : t("automatic")}
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

function VoteTab({ state, actions, readOnly, t }: { state: any; actions?: PlayerActions; readOnly?: boolean; t: TFn }) {
  const [accused, setAccused] = useState<string>("");
  const [motive, setMotive] = useState("");
  const [method, setMethod] = useState("");
  const [busy, setBusy] = useState(false);
  if (state.vote) {
    const name = state.cast.find((c: any) => c.character_id === state.vote.accused_character_id)?.name;
    return (
      <div className="rounded-2xl bg-[var(--mm-surface)] p-5 text-center">
        <p className="text-sm opacity-70">{t("vote_registered")}</p>
        <p className="mt-2 text-2xl font-bold">{name}</p>
        <p className="mt-2 text-sm opacity-80">{t("wait_reveal")}</p>
      </div>
    );
  }
  const suspects = state.cast.filter((c: any) => !c.is_victim);
  return (
    <div className="space-y-4">
      <p className="text-sm opacity-80">{t("vote_intro")}</p>
      <div className="grid grid-cols-2 gap-3">
        {suspects.map((c: any) => (
          <button key={c.character_id} onClick={() => setAccused(c.character_id)} className={`flex flex-col items-center rounded-xl p-3 ${accused === c.character_id ? "bg-[var(--mm-primary)]" : "bg-[var(--mm-surface)]"}`}>
            <MMAvatar name={c.name} config={c.avatar_config} url={c.avatar_url} size={56} />
            <span className="mt-1 text-sm font-semibold">{c.name}</span>
          </button>
        ))}
      </div>
      <textarea value={motive} onChange={(e) => setMotive(e.target.value)} placeholder={t("motive_ph")} className="w-full rounded-xl bg-[var(--mm-surface)] p-3 text-sm" rows={3} />
      <textarea value={method} onChange={(e) => setMethod(e.target.value)} placeholder={t("method_ph")} className="w-full rounded-xl bg-[var(--mm-surface)] p-3 text-sm" rows={3} />
      <button
        disabled={readOnly || !accused || busy}
        onClick={async () => {
          if (!confirm(t("vote_confirm"))) return;
          setBusy(true);
          await actions?.vote({ accusedCharacterId: accused, motive, method });
          setBusy(false);
        }}
        className="w-full rounded-xl bg-[var(--mm-primary)] py-3 font-semibold disabled:opacity-50"
      >
        {t("send_accusation")}
      </button>
    </div>
  );
}

export function Results({ results, onReplay, lang }: { results: any; onReplay?: () => void; lang?: string }) {
  return (
    <div className="mb-6 space-y-3 rounded-2xl bg-[var(--mm-surface)] p-5">
      <div className="flex items-center gap-3">
        {results.killer && <MMAvatar name={results.killer.name} config={results.killer.avatar_config} url={results.killer.avatar_url} size={56} />}
        <div>
          <p className="text-xs uppercase tracking-widest opacity-70">{mmT(lang, "killer_was")}</p>
          <p className="text-xl font-bold text-[var(--mm-primary)]">{results.killer?.name}</p>
        </div>
      </div>
      <ol className="space-y-2">
        {results.rows.map((r: any, i: number) => (
          <li key={r.player_id} className="flex items-center gap-2 rounded-lg bg-[var(--mm-bg)]/60 p-2 text-sm">
            <span className="w-5 text-center font-bold">{i + 1}</span>
            {r.character && <MMAvatar name={r.character.name} config={r.character.avatar_config} url={r.character.avatar_url} size={28} />}
            <span className="min-w-0 flex-1 truncate">
              {r.display_name} <span className="opacity-60">→ {r.accused ?? mmT(lang, "no_vote")}</span>
            </span>
            <span>{r.correct ? "✅" : "❌"}</span>
            <span className="shrink-0 text-right font-mono">{r.score} pts{r.richest_bonus > 0 && <span className="block text-xs opacity-70">+{r.richest_bonus} · EUR</span>}</span>
          </li>
        ))}
      </ol>
      {onReplay && (
        <button onClick={onReplay} className="text-sm text-[var(--mm-accent)] underline">
          {mmT(lang, "replay_reveal")}
        </button>
      )}
    </div>
  );
}
