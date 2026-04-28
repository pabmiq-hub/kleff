// Block renderer for the visual CMS.
// Each block has a `type` and a free-form `content` JSON.
// Unknown types render nothing (forward-compatible).

import type { ReactNode } from "react";

export type BlockData = {
  id: string;
  type: string;
  position: number;
  content: Record<string, unknown>;
};

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function arr<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

// ------------ Individual block components ------------

function HeroBlock({ content }: { content: Record<string, unknown> }) {
  const title = str(content.title, "");
  const subtitle = str(content.subtitle);
  const image = str(content.image);
  const ctaText = str(content.ctaText);
  const ctaHref = str(content.ctaHref);
  return (
    <section className="relative overflow-hidden bg-cream-deep py-20 px-6">
      {image && (
        <div className="absolute inset-0 -z-10 opacity-30">
          <img src={image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="font-display text-5xl md:text-7xl font-bold text-ink mb-6">{title}</h1>
        {subtitle && <p className="text-xl text-ink/70 mb-8">{subtitle}</p>}
        {ctaText && ctaHref && (
          <a
            href={ctaHref}
            className="inline-block bg-coral text-white px-8 py-4 rounded-full font-semibold hover:bg-coral-deep transition"
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
}

function TextBlock({ content }: { content: Record<string, unknown> }) {
  const text = str(content.text);
  const align = str(content.align, "left");
  return (
    <section className="py-12 px-6">
      <div
        className={`max-w-3xl mx-auto prose prose-lg text-ink ${
          align === "center" ? "text-center" : align === "right" ? "text-right" : ""
        }`}
        // Render as plain text with line breaks (safe). For rich HTML we'd sanitize.
      >
        {text.split("\n\n").map((para, i) => (
          <p key={i} className="mb-4 whitespace-pre-line">{para}</p>
        ))}
      </div>
    </section>
  );
}

function ImageBlock({ content }: { content: Record<string, unknown> }) {
  const src = str(content.src);
  const alt = str(content.alt);
  const caption = str(content.caption);
  if (!src) return null;
  return (
    <section className="py-8 px-6">
      <figure className="max-w-4xl mx-auto">
        <img src={src} alt={alt} className="w-full rounded-3xl" />
        {caption && <figcaption className="text-sm text-ink/60 text-center mt-2">{caption}</figcaption>}
      </figure>
    </section>
  );
}

function ImageTextBlock({ content }: { content: Record<string, unknown> }) {
  const image = str(content.image);
  const title = str(content.title);
  const text = str(content.text);
  const reverse = content.reverse === true;
  return (
    <section className="py-16 px-6">
      <div
        className={`max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center ${
          reverse ? "md:[&>*:first-child]:order-2" : ""
        }`}
      >
        {image && (
          <div>
            <img src={image} alt={title} className="w-full rounded-3xl" />
          </div>
        )}
        <div>
          {title && <h2 className="font-display text-4xl font-bold text-ink mb-4">{title}</h2>}
          {text && <p className="text-lg text-ink/80 whitespace-pre-line">{text}</p>}
        </div>
      </div>
    </section>
  );
}

function CTABlock({ content }: { content: Record<string, unknown> }) {
  const title = str(content.title);
  const subtitle = str(content.subtitle);
  const buttonText = str(content.buttonText);
  const buttonHref = str(content.buttonHref);
  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto bg-coral text-white rounded-3xl p-12 text-center">
        {title && <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{title}</h2>}
        {subtitle && <p className="text-lg mb-6 text-white/90">{subtitle}</p>}
        {buttonText && buttonHref && (
          <a
            href={buttonHref}
            className="inline-block bg-white text-coral px-8 py-3 rounded-full font-semibold hover:bg-cream transition"
          >
            {buttonText}
          </a>
        )}
      </div>
    </section>
  );
}

function FAQBlock({ content }: { content: Record<string, unknown> }) {
  const title = str(content.title, "Preguntas frecuentes");
  const items = arr<{ q?: string; a?: string }>(content.items);
  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-4xl font-bold text-ink mb-8 text-center">{title}</h2>
        <div className="space-y-4">
          {items.map((it, i) => (
            <details key={i} className="bg-card rounded-2xl p-5 border border-border">
              <summary className="font-semibold text-ink cursor-pointer">{str(it.q)}</summary>
              <p className="mt-3 text-ink/80 whitespace-pre-line">{str(it.a)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function GalleryBlock({ content }: { content: Record<string, unknown> }) {
  const images = arr<{ src?: string; alt?: string }>(content.images);
  return (
    <section className="py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, i) => (
          <img key={i} src={str(img.src)} alt={str(img.alt)} className="w-full aspect-square object-cover rounded-2xl" />
        ))}
      </div>
    </section>
  );
}

function SpacerBlock({ content }: { content: Record<string, unknown> }) {
  const size = str(content.size, "md");
  const h = size === "sm" ? "h-8" : size === "lg" ? "h-32" : size === "xl" ? "h-48" : "h-16";
  return <div className={h} />;
}

// ------------ Registry ------------

const REGISTRY: Record<string, (props: { content: Record<string, unknown> }) => ReactNode> = {
  hero: HeroBlock,
  text: TextBlock,
  image: ImageBlock,
  imageText: ImageTextBlock,
  cta: CTABlock,
  faq: FAQBlock,
  gallery: GalleryBlock,
  spacer: SpacerBlock,
};

export const BLOCK_TYPES: Array<{ type: keyof typeof REGISTRY | string; label: string }> = [
  { type: "hero", label: "Hero" },
  { type: "text", label: "Texto" },
  { type: "image", label: "Imagen" },
  { type: "imageText", label: "Imagen + Texto" },
  { type: "cta", label: "CTA" },
  { type: "faq", label: "FAQ" },
  { type: "gallery", label: "Galería" },
  { type: "spacer", label: "Espaciador" },
];

export function BlockRenderer({ block }: { block: BlockData }) {
  const Comp = REGISTRY[block.type];
  if (!Comp) return null;
  return <Comp content={block.content} />;
}

export function BlocksList({ blocks }: { blocks: BlockData[] }) {
  return (
    <>
      {blocks.map((b) => (
        <BlockRenderer key={b.id} block={b} />
      ))}
    </>
  );
}
