// Pure rule: post-event thank-you emails go out at 12:00 (Europe/Madrid)
// on the day after the event.

export const GOOGLE_REVIEW_URL = "https://g.page/r/CXntdwa3Ms3XEBE/review";
const TZ = "Europe/Madrid";

function madridParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour"), mi: get("minute"), s: get("second") };
}

/** UTC instant of 12:00 Madrid time on the day after `eventDate`. */
export function thanksSendAt(eventDate: Date): Date {
  const p = madridParts(eventDate);
  // Guess noon as UTC, then correct by Madrid's offset at that instant.
  const guess = new Date(Date.UTC(p.y, p.m - 1, p.d + 1, 12, 0, 0));
  const g = madridParts(guess);
  const offsetMs = Date.UTC(g.y, g.m - 1, g.d, g.h, g.mi, g.s) - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
}
