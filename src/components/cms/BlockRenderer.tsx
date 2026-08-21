// Public-facing renderer for CMS blocks.
import type { BlockData, BlockType } from "@/cms/blockTypes";
import { EmbeddedRegistrationForm } from "@/components/cms/EmbeddedRegistrationForm";

type AnyBlock = { id: string; type: BlockType; data: unknown; hidden?: boolean };


export function BlockRenderer({ blocks }: { blocks: AnyBlock[] }) {
  // Hero blocks render full-bleed (outside the centered container).
  const visible = blocks.filter((b) => !b.hidden);
  return (
    <>
      {visible.map((b) => {
        if (b.type === "hero") return <HeroBlock key={b.id} data={b.data as BlockData["hero"]} />;
        return null;
      })}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-8">
        {visible.filter((b) => b.type !== "hero").map((b) => (
          <BlockView key={b.id} block={b} />
        ))}
      </div>
    </>
  );
}

function HeroBlock({ data }: { data: BlockData["hero"] }) {
  const overlay = data.overlay_opacity ?? 0.45;
  const align = data.align === "left" ? "items-start text-left" : "items-center text-center";
  return (
    <section className="relative w-full min-h-[55vh] md:min-h-[70vh] flex overflow-hidden bg-ink">
      {data.image_url && (
        <img loading="lazy" decoding="async" src={data.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-ink" style={{ opacity: overlay }} />
      <div className={`relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 md:py-28 flex flex-col justify-center w-full ${align}`}>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-semibold text-cream">
          {data.title}
        </h1>
        {data.subtitle && (
          <p className="mt-4 text-lg md:text-xl text-cream/85 max-w-2xl">{data.subtitle}</p>
        )}
        {data.cta_label && data.cta_href && (
          <div className="mt-8">
            <a
              href={data.cta_href}
              className={`inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold transition-colors ${data.cta_variant === "secondary" ? "bg-cream/15 hover:bg-cream/25 text-cream" : "bg-coral hover:bg-coral-deep text-cream"}`}
            >
              {data.cta_label}
            </a>
          </div>
        )}
      </div>
    </section>
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
    case "button": {
      const d = block.data as BlockData["button"];
      const align = d.align === "center" ? "text-center" : d.align === "right" ? "text-right" : "text-left";
      const sizes: Record<string, string> = { sm: "px-4 py-2 text-sm", md: "px-6 py-2.5 text-base", lg: "px-8 py-3.5 text-lg" };
      const variants: Record<string, string> = {
        primary: "bg-coral hover:bg-coral-deep text-cream",
        secondary: "bg-ink hover:bg-ink/85 text-cream",
        outline: "border-2 border-ink text-ink hover:bg-ink hover:text-cream",
        ghost: "text-ink hover:bg-ink/10",
      };
      const width = d.full_width ? "w-full" : "";
      return (
        <div className={align}>
          <a
            href={d.href}
            className={`inline-flex items-center justify-center rounded-full font-semibold transition-colors ${sizes[d.size]} ${variants[d.variant]} ${width}`}
          >
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
    case "columns": {
      const d = block.data as BlockData["columns"];
      const cols = d.count === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
      return (
        <div className={`grid gap-6 ${cols}`}>
          {d.items.map((item, i) => (
            <div key={i} className="space-y-3">
              {item.image_url && (
                <img src={item.image_url} alt="" loading="lazy" className="w-full h-auto rounded-xl" />
              )}
              <div
                className="prose prose-lg max-w-none prose-a:text-coral"
                dangerouslySetInnerHTML={{ __html: item.html }}
              />
            </div>
          ))}
        </div>
      );
    }
    case "gallery": {
      const d = block.data as BlockData["gallery"];
      const cols = d.columns === 4 ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" : d.columns === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1 sm:grid-cols-2";
      if (d.images.length === 0) return null;
      return (
        <div className={`grid gap-3 ${cols}`}>
          {d.images.map((img, i) => (
            <figure key={i} className="overflow-hidden rounded-xl">
              <a
                href={d.lightbox ? img.url : "#"}
                onClick={(e) => { if (!d.lightbox) e.preventDefault(); }}
                target={d.lightbox ? "_blank" : undefined}
                rel="noreferrer"
              >
                <img src={img.url} alt={img.alt || ""} loading="lazy" className="w-full aspect-square object-cover hover:scale-105 transition-transform" />
              </a>
              {img.caption && <figcaption className="mt-1 text-xs text-muted-foreground text-center">{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      );
    }
    case "cards": {
      const d = block.data as BlockData["cards"];
      const cols = d.columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
      return (
        <div className={`grid gap-5 ${cols}`}>
          {d.items.map((c, i) => (
            <article key={i} className="rounded-2xl border border-ink/10 bg-card overflow-hidden flex flex-col">
              {c.image_url && (
                <img src={c.image_url} alt="" loading="lazy" className="w-full aspect-video object-cover" />
              )}
              <div className="p-5 flex-1 flex flex-col gap-3">
                <h3 className="font-display text-xl font-semibold text-foreground">{c.title}</h3>
                {c.body && <p className="text-muted-foreground flex-1">{c.body}</p>}
                {c.cta_label && c.cta_href && (
                  <a href={c.cta_href} className="inline-flex items-center justify-center mt-2 px-4 py-2 rounded-full bg-coral hover:bg-coral-deep text-cream font-semibold text-sm self-start">
                    {c.cta_label}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      );
    }
    case "form_embed": {
      const d = block.data as BlockData["form_embed"];
      if (!d.formSlug) return null;
      return <EmbeddedRegistrationForm slug={d.formSlug} />;
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
