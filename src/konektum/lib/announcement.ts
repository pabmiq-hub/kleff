// Pure helpers for the Konektum "Enviar comunicado" email.
// Shared by the admin preview (browser) and the sender (server) so both render
// exactly the same email, and the organizer's rich text is reduced to a small
// safe allowlist before it reaches any inbox.

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "a",
  "ul", "ol", "li", "blockquote", "h1", "h2", "h3", "hr",
]);
const VOID_TAGS = new Set(["br", "hr"]);
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|noscript|template)\b[\s\S]*?<\/\1\s*>/gi;

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

function safeHref(raw: string): string | null {
  const href = raw
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .trim();
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  return null;
}

/** Keeps only formatting tags (bold, italic, links, lists…) and drops every attribute except safe link targets. */
export function sanitizeAnnouncementHtml(input: string): string {
  const source = String(input ?? "").replace(/<!--[\s\S]*?-->/g, "").replace(DROP_WITH_CONTENT, "");
  const out: string[] = [];
  const open: string[] = [];
  const tokenRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|<|>/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(source))) {
    out.push(source.slice(last, match.index));
    last = tokenRe.lastIndex;
    const token = match[0];
    if (token === "<") { out.push("&lt;"); continue; }
    if (token === ">") { out.push("&gt;"); continue; }
    const tag = match[1].toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) continue;
    const closing = token.startsWith("</");
    if (VOID_TAGS.has(tag)) {
      if (!closing) out.push(`<${tag}>`);
      continue;
    }
    if (closing) {
      const idx = open.lastIndexOf(tag);
      if (idx === -1) continue;
      while (open.length > idx) out.push(`</${open.pop()}>`);
      continue;
    }
    if (tag === "a") {
      const hrefMatch = /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(match[2] || "");
      const href = hrefMatch ? safeHref(hrefMatch[2] ?? hrefMatch[3] ?? hrefMatch[4] ?? "") : null;
      if (!href) { open.push("span"); out.push("<span>"); continue; }
      out.push(`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="color:#e11d48;text-decoration:underline;">`);
      open.push("a");
      continue;
    }
    out.push(`<${tag}>`);
    open.push(tag);
  }
  out.push(source.slice(last));
  while (open.length) out.push(`</${open.pop()}>`);
  return out.join("");
}

/** True when the rich text has some visible text (not just empty paragraphs). */
export function hasAnnouncementText(html: string): boolean {
  return sanitizeAnnouncementHtml(html).replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;
}

export interface AnnouncementEmailOptions {
  subject: string;
  bodyHtml: string;
  participantName?: string | null;
  cancelUrl?: string | null;
  isEn?: boolean;
  brandName?: string;
  logoUrl?: string | null;
  logoHeight?: number;
  primaryColor?: string;
}

export function renderAnnouncementEmail(opts: AnnouncementEmailOptions): { subject: string; html: string } {
  const isEn = !!opts.isEn;
  const color = /^#[0-9a-f]{3,8}$/i.test(opts.primaryColor || "") ? opts.primaryColor! : "#e11d48";
  const brand = opts.brandName || "KLEFF";
  const logoHeight = Math.min(120, Math.max(24, Number(opts.logoHeight) || 48));
  const subject = opts.subject.trim();
  const name = (opts.participantName || "").trim();
  const greeting = name
    ? (isEn ? `Hi ${escapeHtml(name)}! 👋` : `¡Hola ${escapeHtml(name)}! 👋`)
    : (isEn ? "Hi! 👋" : "¡Hola! 👋");
  const body = sanitizeAnnouncementHtml(opts.bodyHtml).replace(/style="color:#e11d48;/g, `style="color:${color};`);

  const cancelHtml = opts.cancelUrl
    ? `<div style="margin:24px 0 8px;padding:14px 16px;border:1px solid ${color}40;background:${color}0d;border-radius:10px;font-size:14px;color:#444;line-height:1.5;">
         ${isEn
           ? "Your spot is reserved for you and others are waiting for one. If you can no longer come, please let us know so we can give it to someone else."
           : "Tu plaza está reservada para ti y hay personas esperando una. Si al final no puedes venir, avísanos para que podamos dársela a otra persona."}
         <div style="margin-top:10px;">
           ${isEn ? "Can't make it?" : "¿No puedes venir?"}
           <a href="${escapeHtml(opts.cancelUrl)}" style="color:${color};font-weight:600;text-decoration:underline;">${isEn ? "Cancel my spot" : "Darme de baja del evento"}</a>
           ${isEn ? "or write to" : "o escríbenos a"} <a href="mailto:hola@kleff.es" style="color:${color};">hola@kleff.es</a>.
         </div>
       </div>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background-color:#f5f5f5;">
  <div style="background:${color};padding:30px;border-radius:10px 10px 0 0;text-align:center;">
    ${opts.logoUrl ? `<img src="${escapeHtml(opts.logoUrl)}" alt="${escapeHtml(brand)}" style="max-height:${logoHeight}px;max-width:260px;margin-bottom:12px;" />` : ""}
    <h1 style="color:#ffffff;margin:0;font-size:22px;">${escapeHtml(subject)}</h1>
  </div>
  <div style="background:#ffffff;padding:30px;border-radius:0 0 10px 10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
    <p style="font-size:18px;margin:0 0 16px;">${greeting}</p>
    <div style="color:#444;font-size:16px;line-height:1.6;">${body}</div>
    ${cancelHtml}
  </div>
  <div style="text-align:center;margin-top:20px;color:#888;font-size:12px;">
    <p style="margin:0;">${escapeHtml(brand)} · <a href="mailto:hola@kleff.es" style="color:#888;">hola@kleff.es</a></p>
  </div>
</body>
</html>`;
  return { subject, html };
}
