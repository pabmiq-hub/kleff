import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getPageWithBlocks,
  updatePage,
  saveBlocks,
  setPageStatus,
  uploadMedia,
} from "@/server/cms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BLOCK_TYPES, type BlockData } from "@/components/cms/BlockRenderer";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  Upload,
} from "lucide-react";

export const Route = createFileRoute("/admin/content/$id")({
  component: PageEditor,
});

type PageMeta = {
  id: string;
  slug: string;
  locale: "es" | "ca" | "en";
  title: string;
  description: string | null;
  og_image_url: string | null;
  status: "draft" | "published";
};

type EditableBlock = {
  // local id (uuid for new ones)
  key: string;
  // db id if existing
  id?: string;
  type: string;
  position: number;
  content: Record<string, unknown>;
};

function uid() {
  return Math.random().toString(36).slice(2);
}

// Default content for new blocks
function defaultContent(type: string): Record<string, unknown> {
  switch (type) {
    case "hero":
      return { title: "Título principal", subtitle: "Subtítulo", ctaText: "", ctaHref: "" };
    case "text":
      return { text: "Escribe aquí…", align: "left" };
    case "image":
      return { src: "", alt: "", caption: "" };
    case "imageText":
      return { image: "", title: "Título", text: "Texto descriptivo", reverse: false };
    case "cta":
      return { title: "¿Listo?", subtitle: "Únete ya", buttonText: "Empezar", buttonHref: "/" };
    case "faq":
      return { title: "Preguntas frecuentes", items: [{ q: "", a: "" }] };
    case "gallery":
      return { images: [{ src: "", alt: "" }] };
    case "spacer":
      return { size: "md" };
    default:
      return {};
  }
}

function PageEditor() {
  const { id } = Route.useParams();
  const get = useServerFn(getPageWithBlocks);
  const updateMeta = useServerFn(updatePage);
  const save = useServerFn(saveBlocks);
  const setStatus = useServerFn(setPageStatus);
  const router = useRouter();

  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [blocks, setBlocks] = useState<EditableBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await get({ data: { id } });
        setMeta(r.page as PageMeta);
        setBlocks(
          (r.blocks as BlockData[]).map((b) => ({
            key: uid(),
            id: b.id,
            type: b.type,
            position: b.position,
            content: b.content,
          }))
        );
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, get]);

  const addBlock = (type: string) => {
    setBlocks((prev) => [
      ...prev,
      { key: uid(), type, position: prev.length, content: defaultContent(type) },
    ]);
  };

  const moveBlock = (idx: number, delta: number) => {
    setBlocks((prev) => {
      const next = [...prev];
      const newIdx = idx + delta;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const removeBlock = (idx: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateBlockContent = (idx: number, content: Record<string, unknown>) => {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, content } : b)));
  };

  const handleSaveMeta = async () => {
    if (!meta) return;
    try {
      await updateMeta({
        data: {
          id: meta.id,
          slug: meta.slug,
          title: meta.title,
          description: meta.description,
          og_image_url: meta.og_image_url,
        },
      });
      toast.success("Datos guardados");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleSaveBlocks = async () => {
    if (!meta) return;
    setSaving(true);
    try {
      await save({
        data: {
          pageId: meta.id,
          blocks: blocks.map((b, i) => ({ type: b.type, position: i, content: b.content })),
        },
      });
      toast.success("Bloques guardados");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!meta) return;
    const next = meta.status === "published" ? "draft" : "published";
    try {
      await setStatus({ data: { id: meta.id, status: next } });
      setMeta({ ...meta, status: next });
      toast.success(next === "published" ? "Publicada" : "Despublicada");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (loading) return <p className="text-cream/60">Cargando…</p>;
  if (!meta) return <p className="text-cream/60">Página no encontrada.</p>;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/admin/content" className="p-2 hover:bg-cream/10 rounded text-cream/60">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold">{meta.title}</h1>
            <p className="text-sm text-cream/60">/p/{meta.slug} · {meta.locale.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {meta.status === "published" && (
            <a
              href={`/p/${meta.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-cream/10 hover:bg-cream/20 rounded text-cream text-sm"
            >
              <ExternalLink className="h-4 w-4" /> Ver
            </a>
          )}
          <Button onClick={handleTogglePublish} variant="outline" className="border-cream/20 text-cream hover:bg-cream/10">
            {meta.status === "published" ? <><EyeOff className="h-4 w-4 mr-2" /> Despublicar</> : <><Eye className="h-4 w-4 mr-2" /> Publicar</>}
          </Button>
          <Button onClick={handleSaveBlocks} disabled={saving} className="bg-coral hover:bg-coral-deep text-cream">
            <Save className="h-4 w-4 mr-2" /> {saving ? "Guardando…" : "Guardar bloques"}
          </Button>
        </div>
      </header>

      {/* Meta editor */}
      <details className="bg-cream/5 border border-cream/15 rounded-2xl p-5">
        <summary className="cursor-pointer font-semibold text-cream">Datos de la página (SEO)</summary>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-cream/70">Título</Label>
            <Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} className="bg-cream/5 border-cream/20 text-cream" />
          </div>
          <div>
            <Label className="text-cream/70">Slug</Label>
            <Input
              value={meta.slug}
              onChange={(e) => setMeta({ ...meta, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              className="bg-cream/5 border-cream/20 text-cream"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-cream/70">Descripción SEO</Label>
            <Textarea
              value={meta.description ?? ""}
              onChange={(e) => setMeta({ ...meta, description: e.target.value || null })}
              className="bg-cream/5 border-cream/20 text-cream"
              rows={2}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-cream/70">URL imagen Open Graph (compartir)</Label>
            <Input
              value={meta.og_image_url ?? ""}
              onChange={(e) => setMeta({ ...meta, og_image_url: e.target.value || null })}
              className="bg-cream/5 border-cream/20 text-cream"
            />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={handleSaveMeta} className="bg-coral hover:bg-coral-deep text-cream">
              Guardar datos
            </Button>
          </div>
        </div>
      </details>

      {/* Blocks */}
      <div className="space-y-3">
        {blocks.length === 0 && (
          <div className="text-center py-12 bg-cream/5 border border-dashed border-cream/15 rounded-2xl text-cream/60">
            Empieza añadiendo bloques abajo.
          </div>
        )}
        {blocks.map((b, i) => (
          <BlockEditor
            key={b.key}
            block={b}
            index={i}
            total={blocks.length}
            onMove={(d) => moveBlock(i, d)}
            onRemove={() => removeBlock(i)}
            onChange={(c) => updateBlockContent(i, c)}
          />
        ))}
      </div>

      {/* Add block */}
      <div className="bg-cream/5 border border-cream/15 rounded-2xl p-5">
        <p className="text-sm font-semibold text-cream mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Añadir bloque
        </p>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => addBlock(t.type)}
              className="px-3 py-1.5 bg-coral/20 hover:bg-coral/30 rounded text-coral text-sm font-medium"
            >
              + {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- Block editor ----------------

function BlockEditor({
  block,
  index,
  total,
  onMove,
  onRemove,
  onChange,
}: {
  block: EditableBlock;
  index: number;
  total: number;
  onMove: (delta: number) => void;
  onRemove: () => void;
  onChange: (content: Record<string, unknown>) => void;
}) {
  const label = BLOCK_TYPES.find((t) => t.type === block.type)?.label ?? block.type;
  return (
    <div className="bg-cream/5 border border-cream/15 rounded-2xl">
      <div className="flex items-center justify-between p-3 border-b border-cream/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-coral uppercase tracking-wider">{label}</span>
          <span className="text-xs text-cream/40">#{index + 1}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onMove(-1)} disabled={index === 0} className="p-1.5 hover:bg-cream/10 rounded text-cream/60 disabled:opacity-30">
            <ArrowUp className="h-4 w-4" />
          </button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className="p-1.5 hover:bg-cream/10 rounded text-cream/60 disabled:opacity-30">
            <ArrowDown className="h-4 w-4" />
          </button>
          <button onClick={onRemove} className="p-1.5 hover:bg-red-500/20 rounded text-cream/60 hover:text-red-300">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <BlockFields type={block.type} content={block.content} onChange={onChange} />
      </div>
    </div>
  );
}

// ---------------- Per-type field editors ----------------

function BlockFields({
  type,
  content,
  onChange,
}: {
  type: string;
  content: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...content, [key]: value });

  switch (type) {
    case "hero":
      return (
        <>
          <Field label="Título" value={String(content.title ?? "")} onChange={(v) => set("title", v)} />
          <Field label="Subtítulo" value={String(content.subtitle ?? "")} onChange={(v) => set("subtitle", v)} />
          <ImageField label="Imagen de fondo" value={String(content.image ?? "")} onChange={(v) => set("image", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Texto botón" value={String(content.ctaText ?? "")} onChange={(v) => set("ctaText", v)} />
            <Field label="URL botón" value={String(content.ctaHref ?? "")} onChange={(v) => set("ctaHref", v)} />
          </div>
        </>
      );
    case "text":
      return (
        <>
          <TextField label="Texto" value={String(content.text ?? "")} onChange={(v) => set("text", v)} rows={5} />
          <SelectField
            label="Alineación"
            value={String(content.align ?? "left")}
            onChange={(v) => set("align", v)}
            options={[["left", "Izquierda"], ["center", "Centro"], ["right", "Derecha"]]}
          />
        </>
      );
    case "image":
      return (
        <>
          <ImageField label="Imagen" value={String(content.src ?? "")} onChange={(v) => set("src", v)} />
          <Field label="Alt (accesibilidad)" value={String(content.alt ?? "")} onChange={(v) => set("alt", v)} />
          <Field label="Pie de foto" value={String(content.caption ?? "")} onChange={(v) => set("caption", v)} />
        </>
      );
    case "imageText":
      return (
        <>
          <ImageField label="Imagen" value={String(content.image ?? "")} onChange={(v) => set("image", v)} />
          <Field label="Título" value={String(content.title ?? "")} onChange={(v) => set("title", v)} />
          <TextField label="Texto" value={String(content.text ?? "")} onChange={(v) => set("text", v)} rows={4} />
          <label className="flex items-center gap-2 text-sm text-cream/80">
            <input type="checkbox" checked={content.reverse === true} onChange={(e) => set("reverse", e.target.checked)} />
            Imagen a la derecha
          </label>
        </>
      );
    case "cta":
      return (
        <>
          <Field label="Título" value={String(content.title ?? "")} onChange={(v) => set("title", v)} />
          <Field label="Subtítulo" value={String(content.subtitle ?? "")} onChange={(v) => set("subtitle", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Texto botón" value={String(content.buttonText ?? "")} onChange={(v) => set("buttonText", v)} />
            <Field label="URL botón" value={String(content.buttonHref ?? "")} onChange={(v) => set("buttonHref", v)} />
          </div>
        </>
      );
    case "faq": {
      const items = Array.isArray(content.items) ? (content.items as Array<{ q?: string; a?: string }>) : [];
      return (
        <>
          <Field label="Título" value={String(content.title ?? "")} onChange={(v) => set("title", v)} />
          <div className="space-y-3">
            {items.map((it, i) => (
              <div key={i} className="bg-ink/30 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-cream/50">Pregunta {i + 1}</span>
                  <button
                    onClick={() => set("items", items.filter((_, j) => j !== i))}
                    className="text-cream/50 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Field
                  label="Pregunta"
                  value={String(it.q ?? "")}
                  onChange={(v) => set("items", items.map((x, j) => (j === i ? { ...x, q: v } : x)))}
                />
                <TextField
                  label="Respuesta"
                  value={String(it.a ?? "")}
                  onChange={(v) => set("items", items.map((x, j) => (j === i ? { ...x, a: v } : x)))}
                  rows={2}
                />
              </div>
            ))}
            <button
              onClick={() => set("items", [...items, { q: "", a: "" }])}
              className="text-sm text-coral hover:text-coral-deep"
            >
              + Añadir pregunta
            </button>
          </div>
        </>
      );
    }
    case "gallery": {
      const images = Array.isArray(content.images) ? (content.images as Array<{ src?: string; alt?: string }>) : [];
      return (
        <div className="space-y-3">
          {images.map((im, i) => (
            <div key={i} className="bg-ink/30 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-cream/50">Imagen {i + 1}</span>
                <button
                  onClick={() => set("images", images.filter((_, j) => j !== i))}
                  className="text-cream/50 hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <ImageField
                label="URL"
                value={String(im.src ?? "")}
                onChange={(v) => set("images", images.map((x, j) => (j === i ? { ...x, src: v } : x)))}
              />
              <Field
                label="Alt"
                value={String(im.alt ?? "")}
                onChange={(v) => set("images", images.map((x, j) => (j === i ? { ...x, alt: v } : x)))}
              />
            </div>
          ))}
          <button
            onClick={() => set("images", [...images, { src: "", alt: "" }])}
            className="text-sm text-coral hover:text-coral-deep"
          >
            + Añadir imagen
          </button>
        </div>
      );
    }
    case "spacer":
      return (
        <SelectField
          label="Tamaño"
          value={String(content.size ?? "md")}
          onChange={(v) => set("size", v)}
          options={[["sm", "Pequeño"], ["md", "Mediano"], ["lg", "Grande"], ["xl", "Extra grande"]]}
        />
      );
    default:
      return <p className="text-cream/50 text-sm">Tipo de bloque desconocido.</p>;
  }
}

// ---------------- Field primitives ----------------

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-cream/70 text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="bg-cream/5 border-cream/20 text-cream" />
    </div>
  );
}

function TextField({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <Label className="text-cream/70 text-xs">{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="bg-cream/5 border-cream/20 text-cream" />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div>
      <Label className="text-cream/70 text-xs">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 bg-cream/5 border border-cream/20 text-cream rounded-md px-3 py-2 text-sm"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v} className="bg-ink">
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const upload = useServerFn(uploadMedia);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Máximo 10 MB");
      return;
    }
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buf).reduce((acc, b) => acc + String.fromCharCode(b), "")
      );
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const r = await upload({ data: { filename: safeName, contentType: file.type, base64 } });
      onChange(r.url);
      toast.success("Imagen subida");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label className="text-cream/70 text-xs">{label}</Label>
      <div className="flex gap-2 mt-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL o sube un archivo"
          className="bg-cream/5 border-cream/20 text-cream flex-1"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 bg-coral/20 hover:bg-coral/30 text-coral rounded-md text-sm flex items-center gap-1 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" /> {uploading ? "…" : "Subir"}
        </button>
      </div>
      {value && (
        <img src={value} alt="" className="mt-2 max-h-24 rounded border border-cream/10" />
      )}
    </div>
  );
}
