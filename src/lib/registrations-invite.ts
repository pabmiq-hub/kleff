/** Pure rules for inviting past registrants to an event. */

export type InviteSourceRow = {
  email: string | null;
  name: string | null;
  created_at: string;
  cancelled: boolean;
};

export type InviteAudience = {
  recipients: Array<{ email: string; name: string | null }>;
  found: number;
  skippedRegistered: number;
  skippedCancelled: number;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string | null | undefined): string | null {
  const e = (email ?? "").trim().toLowerCase();
  return EMAIL_RE.test(e) ? e : null;
}

/**
 * One invitation per email (most recent name wins). Cancelled registrations are
 * skipped unless includeCancelled; people already registered or suppressed are omitted.
 */
export function buildInviteAudience(
  rows: InviteSourceRow[],
  opts: { includeCancelled: boolean; alreadyRegistered: Iterable<string>; suppressed?: Iterable<string> },
): InviteAudience {
  const registered = new Set([...opts.alreadyRegistered].map((e) => normalizeEmail(e)).filter(Boolean) as string[]);
  const suppressed = new Set([...(opts.suppressed ?? [])].map((e) => normalizeEmail(e)).filter(Boolean) as string[]);
  const sorted = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const byEmail = new Map<string, { email: string; name: string | null }>();
  const skippedReg = new Set<string>();
  const cancelledOnly = new Set<string>();
  let found = 0;
  for (const r of sorted) {
    const email = normalizeEmail(r.email);
    if (!email) continue;
    found += 1;
    if (registered.has(email)) { skippedReg.add(email); continue; }
    if (suppressed.has(email)) continue;
    if (r.cancelled && !opts.includeCancelled) { if (!byEmail.has(email)) cancelledOnly.add(email); continue; }
    if (!byEmail.has(email)) { byEmail.set(email, { email, name: r.name?.trim() || null }); cancelledOnly.delete(email); }
  }
  return {
    recipients: [...byEmail.values()],
    found,
    skippedRegistered: skippedReg.size,
    skippedCancelled: cancelledOnly.size,
  };
}

export function isSafeHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderInviteEmail(input: {
  name: string | null;
  bodyHtml: string;
  title: string;
  dateLabel?: string | null;
  location?: string | null;
  url: string;
  buttonLabel: string;
}): string {
  const hi = input.name ? `¡Hola, ${esc(input.name)}!` : "¡Hola!";
  const meta = [input.dateLabel ? `📅 ${esc(input.dateLabel)}` : "", input.location ? `📍 ${esc(input.location)}` : ""]
    .filter(Boolean)
    .join("<br/>");
  return `<!doctype html><html><body style="margin:0;background:#f6f1e7;font-family:Arial,Helvetica,sans-serif;color:#1f1f1f">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden">
<tr><td style="background:#1f1f1f;color:#ffffff;padding:18px 24px;font-size:20px;font-weight:bold;letter-spacing:1px">KLEFF</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 12px">${hi}</p>
${input.bodyHtml}
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #eadfcc;border-radius:12px;background:#fbf7f0"><tr><td style="padding:16px 18px">
<div style="font-size:17px;font-weight:bold;margin-bottom:6px">${esc(input.title)}</div>
${meta ? `<div style="font-size:14px;color:#555;margin-bottom:14px">${meta}</div>` : ""}
<a href="${esc(input.url)}" style="display:inline-block;background:#ff6b4a;color:#1f1f1f;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px">${esc(input.buttonLabel)}</a>
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#888">Recibes este correo porque te inscribiste en algún evento de KLEFF. Si no quieres más invitaciones, responde a este correo o escribe a hola@kleff.es.</p>
</td></tr></table></td></tr></table></body></html>`;
}
