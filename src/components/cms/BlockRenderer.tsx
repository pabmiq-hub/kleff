// Public-facing renderer for CMS blocks.
import type { BlockData, BlockType } from "@/cms/blockTypes";

type AnyBlock = { id: string; type: BlockType; data: unknown; hidden?: boolean };

export function BlockRenderer({ blocks }: { blocks: AnyBlock[] }) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-8">
      {blocks.filter((b) => !b.hidden).map((b) => (
        <BlockView key={b.id} block={b} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: AnyBlock }) {
  switch (block.type) {
    case "heading": {
      const d = block.data as BlockData["heading"];
      const Tag = (`h${d.level}`) as "h2" | "h3" | "h4";
      const sizes: Record<number, string> = { 2: "text-3xl md:text-4xl", 3: "text-2xl md:text-3xl", 4: "text-xl md:text-2xl" };
      const align = d.align === "center" ? "text-center" : d.align === "right" ? "text-right" : "text-left";
      return <Tag className={`font-display font-semibold ${sizes[d.level]} ${align}`}>{d.text}</Tag>;
    }
    case "paragraph": {
      const d = block.data as BlockData["paragraph"];
      return (
        <div
          className="prose prose-lg max-w-none prose-headings:font-display prose-a:text-coral hover:prose-a:text-coral-deep prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: d.html }}
        />
      );
    }
    case "image": {
      const d = block.data as BlockData["image"];
      const widths: Record<string, string> = {
        full: "max-w-full -mx-4 sm:-mx-6 lg:mx-0 lg:max-w-none lg:w-screen lg:relative lg:left-1/2 lg:right-1/2 lg:-translate-x-1/2",
        content: "max-w-full",
        narrow: "max-w-xl mx-auto",
      };
      const cls = widths[d.width ?? "content"];
      if (!d.url) return null;
      return (
        <figure className={cls}>
          <img src={d.url} alt={d.alt || ""} loading="lazy" decoding="async" className="w-full h-auto rounded-xl" />
          {d.caption && (
            <figcaption className="mt-2 text-sm text-muted-foreground text-center italic">{d.caption}</figcaption>
          )}
        </figure>
      );
    }
    case "embed": {
      const d = block.data as BlockData["embed"];
      const src = toEmbedUrl(d.url);
      if (!src) return null;
      const aspect = d.aspect === "4/3" ? "aspect-[4/3]" : d.aspect === "1/1" ? "aspect-square" : "aspect-video";
      return (
        <div className={`relative ${aspect} w-full rounded-xl overflow-hidden bg-black`}>
          <iframe src={src} loading="lazy" allowFullScreen className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
        </div>
      );
    }
    case "cta": {
      const d = block.data as BlockData["cta"];
      const align = d.align === "center" ? "text-center" : d.align === "right" ? "text-right" : "text-left";
      const style = d.variant === "secondary"
        ? "bg-cream/10 hover:bg-cream/15 text-foreground"
        : "bg-coral hover:bg-coral-deep text-cream";
      return (
        <div className={align}>
          <a href={d.href} className={`inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold transition-colors ${style}`}>
            {d.label}
          </a>
        </div>
      );
    }
    case "quote": {
      const d = block.data as BlockData["quote"];
      return (
        <blockquote className="border-l-4 border-coral pl-6 py-2 italic text-xl font-display">
          <div dangerouslySetInnerHTML={{ __html: d.html }} />
          {d.attribution && <footer className="mt-2 text-sm not-italic text-muted-foreground">— {d.attribution}</footer>}
        </blockquote>
      );
    }
    case "divider":
      return <hr className="border-cream/20" />;
    case "form_embed": {
      const d = block.data as BlockData["form_embed"];
      if (!d.formSlug) return null;
      return (
        <div className="rounded-xl border border-dashed border-cream/30 p-6 text-center text-sm text-muted-foreground">
          Formulario «{d.formSlug}» — disponible cuando se publique el módulo de inscripciones.
        </div>
      );
    }
    default:
      return null;
  }
}

function toEmbedUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    // YouTube
    if (u.host.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.host.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return raw;
    }
    // Vimeo
    if (u.host.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    // Default: trust if iframe-friendly
    return raw;
  } catch {
    return null;
  }
}
