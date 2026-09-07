// Pure helpers for event dates, calendar links and .ics generation.
// Safe to import from both client and server code.

export const MADRID_TZ = "Europe/Madrid";

/** Offset (in minutes) of Europe/Madrid relative to UTC for a given instant. */
export function madridOffsetMinutes(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: MADRID_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  const asUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return Math.round((asUTC - date.getTime()) / 60000);
}

/** Date parts of an instant as seen in Madrid. */
function madridParts(date: Date) {
  const off = madridOffsetMinutes(date);
  const shifted = new Date(date.getTime() + off * 60000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

/** Build a UTC instant from Madrid wall-clock parts. */
function fromMadrid(year: number, month: number, day: number, hour: number, minute = 0): Date {
  const guess = new Date(Date.UTC(year, month, day, hour, minute));
  const off = madridOffsetMinutes(guess);
  return new Date(guess.getTime() - off * 60000);
}

/**
 * The Wednesday before the event, at 19:00 (Madrid time).
 * Used as the cut-off for "last minute" questions.
 */
export function wednesdayCutoff(eventDate: string | Date | null | undefined): Date | null {
  if (!eventDate) return null;
  const d = typeof eventDate === "string" ? new Date(eventDate) : eventDate;
  if (Number.isNaN(d.getTime())) return null;
  const p = madridParts(d);
  // days back to the previous Wednesday (3); if event is Wednesday, go back a week
  let back = (p.weekday - 3 + 7) % 7;
  if (back === 0) back = 7;
  const base = new Date(Date.UTC(p.year, p.month, p.day - back));
  return fromMadrid(
    base.getUTCFullYear(),
    base.getUTCMonth(),
    base.getUTCDate(),
    19,
    0,
  );
}

export function isQuestionVisible(
  q: { hide_after_wednesday?: boolean | null },
  eventDate: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!q.hide_after_wednesday) return true;
  const cutoff = wednesdayCutoff(eventDate);
  if (!cutoff) return true;
  return now.getTime() <= cutoff.getTime();
}

export function formatMadrid(date: string | Date, locale = "es-ES"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    timeZone: MADRID_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function icsStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export interface CalendarEvent {
  title: string;
  start: Date;
  /** Defaults to start + 3h */
  end?: Date;
  description?: string;
  location?: string;
  url?: string;
  uid?: string;
}

function endOf(ev: CalendarEvent): Date {
  return ev.end ?? new Date(ev.start.getTime() + 3 * 60 * 60 * 1000);
}

export function googleCalendarUrl(ev: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${icsStamp(ev.start)}/${icsStamp(endOf(ev))}`,
  });
  if (ev.description) params.set("details", ev.description);
  if (ev.location) params.set("location", ev.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function buildIcs(ev: CalendarEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KLEFF//Inscripciones//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.uid ?? `${icsStamp(ev.start)}-kleff`}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(ev.start)}`,
    `DTEND:${icsStamp(endOf(ev))}`,
    `SUMMARY:${icsEscape(ev.title)}`,
  ];
  if (ev.description) lines.push(`DESCRIPTION:${icsEscape(ev.description)}`);
  if (ev.location) lines.push(`LOCATION:${icsEscape(ev.location)}`);
  if (ev.url) lines.push(`URL:${ev.url}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

/** Replace {{placeholders}} in admin-authored email texts. */
export function renderTemplateText(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => vars[key] ?? "");
}
