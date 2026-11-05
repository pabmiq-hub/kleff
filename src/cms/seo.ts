// Per-page "share & search" overrides edited in /admin/content (section `<page>.seo`).
// Applied on top of each route's hard-coded head() so SSR emits them for crawlers.

type Meta = Record<string, unknown>;
type Head = { meta?: Meta[]; links?: unknown[]; scripts?: unknown[] };

export type SeoOverrides = { title?: string; description?: string; image?: string };

export function readSeo(loaderData: unknown): SeoOverrides {
  const pc = (loaderData as { pageContent?: { sections?: Record<string, unknown>; locale?: string } })?.pageContent;
  if (!pc?.sections || (pc.locale && pc.locale !== "es")) return {};
  const key = Object.keys(pc.sections).find((k) => k.endsWith(".seo"));
  const raw = (key ? pc.sections[key] : null) as Record<string, unknown> | null;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const image = str(raw?.image);
  return {
    title: str(raw?.title),
    description: str(raw?.description),
    image: image && /^https:\/\//.test(image) ? image : undefined,
  };
}

export function applySeo(head: Head, seo: SeoOverrides): Head {
  let meta = [...(head.meta ?? [])];
  const set = (match: (m: Meta) => boolean, entry: Meta) => {
    meta = meta.filter((m) => !match(m));
    meta.push(entry);
  };
  const byName = (n: string) => (m: Meta) => m.name === n;
  const byProp = (p: string) => (m: Meta) => m.property === p;
  if (seo.title) {
    set((m) => "title" in m, { title: seo.title });
    set(byProp("og:title"), { property: "og:title", content: seo.title });
    set(byName("twitter:title"), { name: "twitter:title", content: seo.title });
  }
  if (seo.description) {
    set(byName("description"), { name: "description", content: seo.description });
    set(byProp("og:description"), { property: "og:description", content: seo.description });
    set(byName("twitter:description"), { name: "twitter:description", content: seo.description });
  }
  if (seo.image) {
    set(byProp("og:image"), { property: "og:image", content: seo.image });
    set(byName("twitter:image"), { name: "twitter:image", content: seo.image });
    set(byName("twitter:card"), { name: "twitter:card", content: "summary_large_image" });
  }
  if (!meta.some(byProp("og:type"))) meta.push({ property: "og:type", content: "website" });
  if (!meta.some(byName("twitter:card"))) meta.push({ name: "twitter:card", content: "summary" });
  return { ...head, meta };
}

export function withSeo<H extends Head>(loaderData: unknown, head: H): H {
  return applySeo(head, readSeo(loaderData)) as H;
}
