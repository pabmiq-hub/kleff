import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listKleffMatches } from "@/lib/ludoya.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, Users, ExternalLink, Trophy, Dice5, Layers } from "lucide-react";
import { useAppLocale } from "@/i18n/app-i18n";
import { cn } from "@/lib/utils";

type UiMatch = {
  id: string;
  type: string;
  title?: string | null;
  scheduledAt?: string | null;
  location?: string | null;
  participantCount?: number | null;
  maxPlayers?: number | null;
  url?: string | null;
};

const LOCALE_TAG: Record<string, string> = { es: "es-ES", ca: "ca-ES", en: "en-GB" };

const TEXT = {
  es: { title: "Calendario de actividades", loading: "Cargando…", none: "No hay actividades programadas este mes.", eventsOn: "Actividades del", today: "Hoy", open: "Ver en Ludoya" },
  ca: { title: "Calendari d'activitats", loading: "Carregant…", none: "No hi ha activitats programades aquest mes.", eventsOn: "Activitats del", today: "Avui", open: "Veure a Ludoya" },
  en: { title: "Activity calendar", loading: "Loading…", none: "No activities scheduled this month.", eventsOn: "Activities on", today: "Today", open: "View on Ludoya" },
} as const;

function classify(type: string): "partida" | "torneo" | "evento" {
  if (type === "PLANNED_PLAY") return "partida";
  if (type === "TOURNAMENT") return "torneo";
  return "evento";
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function EventsCalendarCard() {
  const { locale } = useAppLocale();
  const t = TEXT[locale as keyof typeof TEXT] ?? TEXT.es;
  const tag = LOCALE_TAG[locale] ?? "es-ES";
  const listFn = useServerFn(listKleffMatches);

  const [items, setItems] = useState<UiMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const r = await listFn({ data: undefined as never });
        setItems((r.matches ?? []) as UiMatch[]);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const byDay = useMemo(() => {
    const m = new Map<string, UiMatch[]>();
    for (const it of items) {
      if (!it.scheduledAt) continue;
      const d = new Date(it.scheduledAt);
      if (Number.isNaN(d.getTime())) continue;
      const k = dayKey(d);
      const arr = m.get(k) ?? [];
      arr.push(it);
      m.set(k, arr);
    }
    for (const arr of m.values())
      arr.sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
    return m;
  }, [items]);

  const monthHasNext = useMemo(() => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    return [...byDay.keys()].some((k) => new Date(k + "T00:00:00").getTime() >= next.getTime());
  }, [byDay, cursor]);

  const weekdays = useMemo(() => {
    const base = new Date(2024, 0, 1); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      return {
        long: new Intl.DateTimeFormat(tag, { weekday: "short" }).format(d),
        en: new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(d),
      };
    });
  }, [tag]);

  // Grid: 6 weeks starting Monday
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const monthLabel = new Intl.DateTimeFormat(tag, { month: "long", year: "numeric" }).format(cursor);
  const selectedEvents = selected ? byDay.get(selected) ?? [] : [];

  return (
    <section className="bg-card border-2 border-ink rounded-2xl shadow-tactile-sm overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-4 py-3 bg-coral-deep text-primary-foreground">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="h-5 w-5 shrink-0" />
          <h2 className="font-display text-lg font-bold capitalize truncate">{monthLabel}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Mes siguiente"
            disabled={!monthHasNext}
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="p-2 sm:p-3">
        <div className="grid grid-cols-7 rounded-lg overflow-hidden border border-ink/20">
          {weekdays.map((w) => (
            <div
              key={w.en}
              className="bg-ink text-background text-[10px] sm:text-xs font-bold uppercase text-center py-2 leading-tight"
            >
              <span className="block">{w.long}</span>
              <span className="hidden sm:block italic font-medium opacity-70">{w.en}</span>
            </div>
          ))}
          {cells.map((d) => {
            const inMonth = d.getMonth() === cursor.getMonth();
            const k = dayKey(d);
            const events = byDay.get(k) ?? [];
            const has = events.length > 0;
            const isToday = k === dayKey(today);
            return (
              <button
                key={k}
                type="button"
                disabled={!has}
                onClick={() => setSelected(k)}
                className={cn(
                  "relative aspect-square border border-ink/10 text-sm flex flex-col items-center justify-center gap-0.5 transition-colors",
                  inMonth ? "bg-background" : "bg-muted/60 text-muted-foreground",
                  has && "cursor-pointer hover:brightness-95",
                  isToday && "ring-2 ring-inset ring-ink/40",
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full h-7 w-7 sm:h-8 sm:w-8 font-semibold",
                    has && "bg-coral-deep text-primary-foreground shadow-tactile-sm",
                  )}
                >
                  {d.getDate()}
                </span>
                {has && (
                  <span className="text-[9px] sm:text-[10px] font-medium text-coral-deep">
                    {events.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {loading ? t.loading : byDay.size === 0 ? t.none : null}
        </p>
      </div>

      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {t.eventsOn}{" "}
              {selected
                ? new Intl.DateTimeFormat(tag, { weekday: "long", day: "numeric", month: "long" }).format(
                    new Date(selected + "T00:00:00"),
                  )
                : ""}
            </DialogTitle>
          </DialogHeader>
          <ul className="space-y-3">
            {selectedEvents.map((e) => {
              const kind = classify(e.type);
              const Icon = kind === "torneo" ? Trophy : kind === "partida" ? Dice5 : Layers;
              return (
                <li key={e.id} className="border-2 border-ink rounded-xl p-3 shadow-tactile-sm">
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 mt-1 text-coral-deep shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight">{e.title ?? "—"}</p>
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        {e.scheduledAt && (
                          <p>
                            {new Intl.DateTimeFormat(tag, { hour: "2-digit", minute: "2-digit" }).format(
                              new Date(e.scheduledAt),
                            )}
                          </p>
                        )}
                        {e.location && (
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {e.location}
                          </p>
                        )}
                        {(e.participantCount != null || e.maxPlayers != null) && (
                          <p className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {e.participantCount ?? 0}
                            {e.maxPlayers ? `/${e.maxPlayers}` : ""}
                          </p>
                        )}
                      </div>
                      {e.url && (
                        <Button asChild variant="outline" size="sm" className="mt-2">
                          <a href={e.url} target="_blank" rel="noopener noreferrer">
                            {t.open} <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  );
}
