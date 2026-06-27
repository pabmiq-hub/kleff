// Server-only HTML sanitizer used by CMS / blog server functions.
// Keep this dependency-free: admin saves run in the backend runtime where
// DOM-based sanitizers can fail because they pull in browser/Node shims.

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "a", "h1", "h2", "h3", "h4",
  "ul", "ol", "li", "blockquote", "code", "pre", "hr",
  "img", "figure", "figcaption",
  "iframe", "span", "div",
]);

const VOID_TAGS = new Set(["br", "hr", "img"]);

const GLOBAL_ATTRS = new Set(["class", "title", "aria-label"]);

const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height", "loading", "decoding"]),
  iframe: new Set(["src", "title", "width", "height", "allow", "allowfullscreen", "frameborder", "loading"]),
};

// Trusted iframe origins for embeds.
const IFRAME_HOSTS = [
  "www.youtube.com",
  "youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "vimeo.com",
  "www.instagram.com",
  "instagram.com",
  "open.spotify.com",
  "docs.google.com",
  "forms.gle",
];

export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") return "";
  return sanitizeTags(stripDangerousBlocks(stripUnsafeIframes(input)));
}

function stripDangerousBlocks(html: string): string {
  return html
    .replace(/\u0000/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?(?:script|style|object|embed|link|meta|base|template)\b[^>]*>/gi, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "");
}

function stripUnsafeIframes(html: string): string {
  return html.replace(/<iframe\b([^>]*)>[\s\S]*?<\/iframe>/gi, (match, attrs: string) => {
    const src = getAttribute(attrs, "src");
    return src && isAllowedIframeSrc(src) ? match : "";
  });
}

function sanitizeTags(html: string): string {
  return html.replace(/<\/?([a-zA-Z0-9:-]+)([^<>]*)>/g, (match, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    const isClosing = /^<\s*\//.test(match);
    if (isClosing) return VOID_TAGS.has(tag) ? "" : `</${tag}>`;

    const cleanAttrs = sanitizeAttributes(tag, attrs);
    if (tag === "iframe" && !cleanAttrs.some((attr) => attr.startsWith("src="))) return "";
    if (tag === "img" && !cleanAttrs.some((attr) => attr.startsWith("src="))) return "";

    return `<${tag}${cleanAttrs.length ? ` ${cleanAttrs.join(" ")}` : ""}${VOID_TAGS.has(tag) ? "" : ""}>`;
  });
}

function sanitizeAttributes(tag: string, attrs: string): string[] {
  const out: string[] = [];
  const allowedForTag = TAG_ATTRS[tag] ?? new Set<string>();
  const attrRegex = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(attrs))) {
    const name = match[1].toLowerCase();
    const rawValue = match[2] ?? match[3] ?? match[4] ?? "";
    if (name.startsWith("on") || name.startsWith("data-")) continue;
    if (!GLOBAL_ATTRS.has(name) && !allowedForTag.has(name)) continue;
    if ((name === "href" || name === "src") && !isSafeUrl(rawValue, tag === "iframe")) continue;
    if (name === "target" && !["_blank", "_self", "_parent", "_top"].includes(rawValue)) continue;
    if (name === "rel" && tag !== "a") continue;
    if (["width", "height"].includes(name) && !/^\d{1,5}$/.test(rawValue)) continue;
    if (["loading", "decoding"].includes(name) && !/^[a-z]+$/i.test(rawValue)) continue;
    if (name === "allowfullscreen") {
      out.push("allowfullscreen");
      continue;
    }
    const value = name === "rel" && tag === "a" ? ensureSafeRel(rawValue) : rawValue;
    out.push(`${name}="${escapeAttr(value)}"`);
  }

  if (tag === "a" && out.some((attr) => attr === 'target="_blank"') && !out.some((attr) => attr.startsWith("rel="))) {
    out.push('rel="noopener noreferrer"');
  }

  return out;
}

function getAttribute(attrs: string, name: string): string | null {
  const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>` + "`" + `]+))`, "i");
  const match = re.exec(attrs);
  return match ? (match[1] ?? match[2] ?? match[3] ?? null) : null;
}

function isSafeUrl(value: string, iframe = false): boolean {
  const compact = value.replace(/[\u0000-\u001f\u007f\s]+/g, "").toLowerCase();
  if (!compact || compact.startsWith("javascript:") || compact.startsWith("data:") || compact.startsWith("vbscript:")) return false;
  if (iframe) return isAllowedIframeSrc(value);
  if (compact.startsWith("/") || compact.startsWith("#")) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function isAllowedIframeSrc(value: string): boolean {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && IFRAME_HOSTS.includes(url.host);
  } catch {
    return false;
  }
}

function ensureSafeRel(value: string): string {
  const parts = new Set(value.split(/\s+/).filter(Boolean));
  parts.add("noopener");
  parts.add("noreferrer");
  return Array.from(parts).join(" ");
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
