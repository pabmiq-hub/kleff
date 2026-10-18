import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";
import { supabase } from "@/integrations/supabase/client";
import { itemCategory, ITEM_CATEGORY_LABEL, normalizeAvatarConfig } from "@/lib/mm/item-art";

const CATEGORY_EMOJI = { money: "💰", key: "🗝️", document: "📜", potion: "🧪", weapon: "🗡️", tool: "🔦", jewel: "💍", object: "📦" } as const;

/** Item illustration with a category badge so players can tell objects apart at a glance. */
export function MMItemArt({ item, size = 64 }: { item: { name: string; description?: string | null; type?: string | null; image_url?: string | null }; size?: number }) {
  const cat = itemCategory(item);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} width={size} height={size} loading="lazy" className="h-full w-full rounded-xl bg-muted object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-xl bg-muted" style={{ fontSize: size * 0.45 }} aria-hidden>{CATEGORY_EMOJI[cat]}</div>
      )}
      <span title={ITEM_CATEGORY_LABEL[cat]} className="absolute -bottom-1 -right-1 rounded-full border border-border bg-background px-1 text-xs leading-5">{CATEGORY_EMOJI[cat]}</span>
    </div>
  );
}

/* --------------------------------- avatar -------------------------------- */

export function MMAvatar({
  name,
  config,
  url,
  size = 40,
  dimmed,
  className = "",
}: {
  name: string;
  config?: Record<string, unknown> | null;
  url?: string | null;
  size?: number;
  dimmed?: boolean;
  className?: string;
}) {
  const src = useMemo(() => {
    if (url) return url;
    try {
      return createAvatar(avataaars, { seed: name, backgroundColor: ["transparent"], ...normalizeAvatarConfig(config) } as any).toDataUri();
    } catch {
      return createAvatar(avataaars, { seed: name }).toDataUri();
    }
  }, [name, url, JSON.stringify(config ?? {})]);
  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={`rounded-full bg-[var(--mm-surface)] object-cover shrink-0 transition-[filter,opacity] duration-700 ${dimmed ? "grayscale opacity-40" : ""} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/* --------------------------------- theme --------------------------------- */

export function themeVars(theme: Record<string, string> | null | undefined): CSSProperties {
  const t = theme ?? {};
  return {
    ["--mm-bg" as string]: t.background ?? "#140d0b",
    ["--mm-surface" as string]: t.surface ?? "#24170f",
    ["--mm-text" as string]: t.text ?? "#f5e9d7",
    ["--mm-primary" as string]: t.primary ?? "#b91c1c",
    ["--mm-accent" as string]: t.accent ?? "#d4a24c",
    ["--mm-font" as string]: t.font_display ? `'${t.font_display}', Georgia, serif` : "Georgia, serif",
  };
}

export function MMShell({ theme, children }: { theme?: Record<string, string> | null; children: ReactNode }) {
  const font = theme?.font_display;
  return (
    <div style={themeVars(theme)} className="min-h-screen bg-[var(--mm-bg)] text-[var(--mm-text)]">
      {font && <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@600;800&display=swap`} />}
      {children}
    </div>
  );
}

/* ------------------------------ server clock ----------------------------- */

/** Countdown based on server time (never the device clock alone). */
export function useCountdown(endsAt: string | null | undefined, serverNow: string | undefined, pausedSeconds?: number | null) {
  const offset = useRef(0);
  useEffect(() => {
    if (serverNow) offset.current = new Date(serverNow).getTime() - Date.now();
  }, [serverNow]);
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  if (pausedSeconds != null && !endsAt) return pausedSeconds;
  if (!endsAt) return null;
  return Math.max(0, Math.round((new Date(endsAt).getTime() - (Date.now() + offset.current)) / 1000));
}

export const fmtClock = (s: number | null) => (s == null ? "--:--" : `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);

/* -------------------------------- realtime ------------------------------- */

export function useBroadcast(topic: string | null, onEvent: (event: string) => void) {
  const cb = useRef(onEvent);
  cb.current = onEvent;
  useEffect(() => {
    if (!topic) return;
    const ch = supabase
      .channel(topic)
      .on("broadcast", { event: "*" }, (msg) => cb.current(msg.event))
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [topic]);
}

/** Placeholder hook so sound can be added later without touching call sites. */
export function useGameSound() {
  return { play: (_name: string) => undefined };
}

export const EVENT_LABELS: Record<string, string> = {
  session_started: "Partida iniciada",
  act_changed: "Cambio de acto",
  murder_triggered: "Evento del asesinato lanzado",
  voting_opened: "Votación abierta",
  voting_closed: "Votación cerrada",
  session_finished: "Partida finalizada",
  paused: "Partida en pausa",
  resumed: "Partida reanudada",
  time_changed: "Tiempo ajustado",
  mode_changed: "Modo de control cambiado",
  player_login: "entró en la partida",
  player_registered: "se registró",
  player_ready: "está listo",
  player_added: "Jugador añadido",
  objective_toggled: "actualizó un objetivo",
  vote_submitted: "envió su acusación",
  invitations_sent: "Invitaciones enviadas",
  code_regenerated: "Código regenerado",
  characters_released: "Personajes repartidos y enviados por email",
  release_scheduled: "Reparto de personajes programado",
  language_changed: "Idioma de la partida cambiado",
  player_confirmed: "confirmó su asistencia",
  character_reassigned: "recibió un personaje (sustitución)",
};

export function describeEvent(e: { type: string; payload: any }, playerName?: string) {
  const p = e.payload ?? {};
  const who = playerName ? `${playerName} ` : "";
  switch (e.type) {
    case "act_changed":
      return `Comienza ${p.act}`;
    case "objective_toggled":
      return `${who}${p.completed ? "completó" : "desmarcó"} el objetivo${p.text ? ` «${p.text}»` : ""}${p.by === "admin" ? " (admin)" : ""}`;
    case "time_changed":
      return `Tiempo del acto ${p.minutes > 0 ? "+" : ""}${p.minutes} min`;
    case "invitations_sent":
      return `${p.count} invitación(es) enviadas`;
    case "mode_changed":
      return `Modo de control: ${p.mode}`;
    default:
      return `${who}${EVENT_LABELS[e.type] ?? e.type}`;
  }
}

export const sessionTopicName = (id: string) => `mm-session-${id}`;
