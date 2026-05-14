// Helpers para calcular fechas de "noche de juego".
// weekday: 0=domingo … 6=sábado (igual que Date.getDay()).

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Próxima noche de juego >= `from` (incluido si coincide). */
export function nextGameNight(from: Date, weekday: number): Date {
  const base = startOfDay(from);
  const diff = (weekday - base.getDay() + 7) % 7;
  const r = new Date(base);
  r.setDate(r.getDate() + diff);
  return r;
}

/** Noche de juego inmediatamente posterior a `date` (siempre +7 si `date` ya es noche). */
export function gameNightAfter(date: Date, weekday: number): Date {
  const base = startOfDay(date);
  const diff = (weekday - base.getDay() + 7) % 7 || 7;
  const r = new Date(base);
  r.setDate(r.getDate() + diff);
  return r;
}

/** Lista las próximas N noches de juego a partir de hoy. */
export function upcomingGameNights(weekday: number, count = 4, from = new Date()): Date[] {
  const first = nextGameNight(from, weekday);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(first);
    d.setDate(d.getDate() + i * 7);
    return d;
  });
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEEKDAY_LABELS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export function weekdayLabel(weekday: number): string {
  return WEEKDAY_LABELS_ES[weekday] ?? "—";
}
