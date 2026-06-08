// Server-only HTML sanitizer used by CMS / blog server functions.
// Uses isomorphic-dompurify which works in the worker runtime.
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s", "a", "h1", "h2", "h3", "h4",
  "ul", "ol", "li", "blockquote", "code", "pre", "hr",
  "img", "figure", "figcaption",
  "iframe", "span", "div",
];

const ALLOWED_ATTR = [
  "href", "target", "rel", "src", "alt", "title", "width", "height",
  "allow", "allowfullscreen", "frameborder", "loading", "decoding",
  "class", "style",
];

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
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_ATTR: ["onerror", "onload", "onclick"],
    ALLOW_DATA_ATTR: false,
  });
  return restrictIframes(clean);
}

function restrictIframes(html: string): string {
  return html.replace(/<iframe([^>]*)>/gi, (_match, attrs) => {
    const srcMatch = /src=["']([^"']+)["']/i.exec(attrs);
    if (!srcMatch) return "";
    try {
      const u = new URL(srcMatch[1]);
      if (!IFRAME_HOSTS.includes(u.host)) return "";
      return `<iframe${attrs}>`;
    } catch {
      return "";
    }
  });
}
