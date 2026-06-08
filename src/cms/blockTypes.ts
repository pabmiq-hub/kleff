// Shared block type definitions used by both editor and renderer.
export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "embed"
  | "cta"
  | "divider"
  | "quote"
  | "form_embed";

export type Locale = "es" | "ca" | "en";

export type BlockData = {
  heading: { level: 2 | 3 | 4; text: string; align?: "left" | "center" | "right" };
  paragraph: { html: string };
  image: { url: string; alt: string; caption?: string; width?: "full" | "content" | "narrow" };
  embed: { url: string; aspect?: "16/9" | "4/3" | "1/1" };
  cta: { label: string; href: string; variant?: "primary" | "secondary"; align?: "left" | "center" | "right" };
  divider: Record<string, never>;
  quote: { html: string; attribution?: string };
  form_embed: { formSlug: string };
};

export type Block<T extends BlockType = BlockType> = {
  id: string;
  type: T;
  position: number;
  hidden: boolean;
  data: BlockData[T];
};

export const BLOCK_LIBRARY: { type: BlockType; label: string; icon: string }[] = [
  { type: "heading", label: "Encabezado", icon: "Heading2" },
  { type: "paragraph", label: "Texto enriquecido", icon: "Type" },
  { type: "image", label: "Imagen", icon: "Image" },
  { type: "embed", label: "Vídeo / Embed", icon: "Youtube" },
  { type: "cta", label: "Botón / CTA", icon: "MousePointerClick" },
  { type: "quote", label: "Cita", icon: "Quote" },
  { type: "divider", label: "Separador", icon: "Minus" },
  { type: "form_embed", label: "Formulario", icon: "ClipboardList" },
];

export function defaultDataFor(type: BlockType): BlockData[BlockType] {
  switch (type) {
    case "heading": return { level: 2, text: "Nuevo encabezado", align: "left" };
    case "paragraph": return { html: "<p>Escribe aquí…</p>" };
    case "image": return { url: "", alt: "", caption: "", width: "content" };
    case "embed": return { url: "", aspect: "16/9" };
    case "cta": return { label: "Botón", href: "/", variant: "primary", align: "left" };
    case "divider": return {};
    case "quote": return { html: "<p>Cita inspiradora</p>", attribution: "" };
    case "form_embed": return { formSlug: "" };
  }
}
