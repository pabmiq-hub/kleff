import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { svgDataUri } from "./item-art";

const SVG_NS = "http://www.w3.org/2000/svg";
const TAGS = new Set(["svg", "g", "defs", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "title", "desc", "linearGradient", "radialGradient", "stop", "clipPath", "mask", "pattern", "use"]);
const MAX_SVG_LENGTH = 250_000;

/** Parse XML rather than trusting regexes; drawings remain inert, self-contained images. */
export function sanitizeAvatarSvg(raw: string): string | null {
  if (!raw.trim() || raw.length > MAX_SVG_LENGTH || /<!DOCTYPE|<!ENTITY|<\?/i.test(raw)) return null;
  try {
    const doc = new DOMParser({ onError: () => { throw new Error("SVG inválido"); } }).parseFromString(raw, "image/svg+xml");
    const root = doc.documentElement;
    if (!root || root.tagName !== "svg" || (root.namespaceURI && root.namespaceURI !== SVG_NS)) return null;
    const nodes = doc.getElementsByTagName("*");
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes.item(i);
      if (!node || !TAGS.has(node.tagName) || (node.namespaceURI && node.namespaceURI !== SVG_NS)) return null;
      for (let j = 0; j < node.attributes.length; j++) {
        const attr = node.attributes.item(j);
        if (!attr) continue;
        const name = attr.name.toLowerCase();
        const value = attr.value.trim();
        if (name.startsWith("on") || name === "xml:base") return null;
        if ((name === "href" || name === "xlink:href") && !/^#[\w.-]+$/.test(value)) return null;
        if (/javascript:|expression\s*\(|@import|[\\]/i.test(value)) return null;
        for (const match of value.matchAll(/url\s*\(([^)]*)\)/gi)) {
          if (!/^["']?#[\w.-]+["']?$/.test(match[1].trim())) return null;
        }
      }
    }
    root.setAttribute("xmlns", SVG_NS);
    return new XMLSerializer().serializeToString(root);
  } catch {
    return null;
  }
}

/** Existing image links are preserved; SVG data URLs receive the same validation. */
export function normalizeAvatarUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  if (/^data:image\/svg\+xml;/i.test(url)) {
    try {
      const comma = url.indexOf(",");
      if (comma < 0) return null;
      const payload = url.slice(comma + 1);
      const svg = sanitizeAvatarSvg(/;base64$/i.test(url.slice(0, comma)) ? atob(payload) : decodeURIComponent(payload));
      return svg ? svgDataUri(svg) : null;
    } catch { return null; }
  }
  if (/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(url) && url.length <= 2_000_000) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password ? url : null;
  } catch { return null; }
}

export function importedAvatarUrl(character: { avatar_svg?: string | null; avatar_url?: string | null }): string | null {
  if (character.avatar_svg) {
    const svg = sanitizeAvatarSvg(character.avatar_svg);
    if (svg) return svgDataUri(svg);
  }
  return character.avatar_url ? normalizeAvatarUrl(character.avatar_url) : null;
}