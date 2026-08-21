import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Heading2,
  Type,
  Image as ImageIcon,
  Youtube,
  MousePointerClick,
  Minus,
  Quote as QuoteIcon,
  ClipboardList,
  Sparkles,
  Columns3,
  Images,
  LayoutGrid,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { BLOCK_LIBRARY, defaultDataFor, type BlockType, type BlockData } from "@/cms/blockTypes";
import {
  adminCreateBlock,
  adminDeleteBlock,
  adminReorderBlocks,
  adminTranslatePageBlocks,
  adminUpdateBlock,
  type BlockRow,
} from "@/lib/blocks.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/cms/RichTextEditor";
import { ImagePicker } from "@/components/cms/ImagePicker";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Heading2,
  Type,
  Image: ImageIcon,
  Youtube,
  MousePointerClick,
  Minus,
  Quote: QuoteIcon,
  ClipboardList,
  Sparkles,
  Columns3,
  Images,
  LayoutGrid,
  Square,
};

type Props = {
  pageId: string;
  locale: "es" | "ca" | "en";
  initial: BlockRow[];
};

export function BlockEditor({ pageId, locale, initial }: Props) {
  const [blocks, setBlocks] = useState<BlockRow[]>(initial);
  const create = useServerFn(adminCreateBlock);
  const update = useServerFn(adminUpdateBlock);
  const del = useServerFn(adminDeleteBlock);
  const reorder = useServerFn(adminReorderBlocks);
  const translatePage = useServerFn(adminTranslatePageBlocks);
  const translateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(
    () => () => {
      if (translateTimer.current) clearTimeout(translateTimer.current);
    },
    [],
  );

  const scheduleTranslation = () => {
    if (locale !== "es") return;
    if (translateTimer.current) clearTimeout(translateTimer.current);
    translateTimer.current = setTimeout(() => {
      setTranslating(true);
      translatePage({ data: { pageId } })
        .then(() => toast.success("Traducciones actualizadas"))
        .catch((e) => toast.error(`No se han podido traducir los cambios: ${(e as Error).message}`))
        .finally(() => setTranslating(false));
    }, 1200);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = blocks.findIndex((b) => b.id === e.active.id);
    const newIdx = blocks.findIndex((b) => b.id === e.over!.id);
    const next = arrayMove(blocks, oldIdx, newIdx).map((b, i) => ({ ...b, position: i }));
    setBlocks(next);
    try {
      await reorder({ data: { pageId, locale, orderedIds: next.map((b) => b.id) } });
      scheduleTranslation();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const addBlock = async (type: BlockType, position: number) => {
    try {
      const { block } = await create({
        data: {
          pageId,
          locale,
          type,
          position,
          data: defaultDataFor(type) as Record<string, unknown>,
        },
      });
      const next = [...blocks];
      next.splice(position, 0, block as BlockRow);
      setBlocks(next.map((b, i) => ({ ...b, position: i })));
      scheduleTranslation();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const updateBlock = async (id: string, data: unknown) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, data } : b)));
    try {
      await update({ data: { blockId: id, data: data as Record<string, unknown> } });
      scheduleTranslation();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleHidden = async (id: string, hidden: boolean) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, hidden } : b)));
    try {
      await update({ data: { blockId: id, hidden } });
      scheduleTranslation();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const removeBlock = async (id: string) => {
    if (!window.confirm("¿Borrar este bloque?")) return;
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    try {
      await del({ data: { blockId: id } });
      scheduleTranslation();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-2">
      <Inserter onPick={(type) => addBlock(type, 0)} />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((b, idx) => (
            <div key={b.id}>
              <SortableBlock
                block={b}
                onUpdate={(data) => updateBlock(b.id, data)}
                onToggleHidden={() => toggleHidden(b.id, !b.hidden)}
                onDelete={() => removeBlock(b.id)}
              />
              <Inserter onPick={(type) => addBlock(type, idx + 1)} compact />
            </div>
          ))}
        </SortableContext>
      </DndContext>
      {blocks.length === 0 && (
        <div className="text-center py-12 text-cream/50 text-sm">
          Esta página aún no tiene bloques. Empieza añadiendo uno arriba.
        </div>
      )}
      {translating && <p className="text-right text-xs text-ink/50">Traduciendo cambios…</p>}
    </div>
  );
}

function SortableBlock({
  block,
  onUpdate,
  onToggleHidden,
  onDelete,
}: {
  block: BlockRow;
  onUpdate: (data: unknown) => void;
  onToggleHidden: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const labelFor = (t: BlockType) => BLOCK_LIBRARY.find((b) => b.type === t)?.label ?? t;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-cream/5 border border-cream/15 rounded-xl ${block.hidden ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-cream/10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-cream/40 hover:text-cream"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs uppercase tracking-wider text-cream/50">
          {labelFor(block.type)}
        </span>
        <span className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleHidden}
          className="h-7 w-7 p-0 text-cream/60 hover:text-cream"
        >
          {block.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-7 w-7 p-0 text-cream/60 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="p-4">
        <BlockForm type={block.type} data={block.data} onChange={onUpdate} />
      </div>
    </div>
  );
}

function Inserter({ onPick, compact }: { onPick: (type: BlockType) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative flex justify-center ${compact ? "py-1" : "py-2"}`}>
      {!open ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className={`text-cream/40 hover:text-coral hover:bg-coral/5 transition-all ${compact ? "h-6 opacity-0 group-hover:opacity-100" : ""}`}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Añadir bloque
        </Button>
      ) : (
        <div className="bg-ink border border-cream/15 rounded-xl shadow-xl p-2 grid grid-cols-2 sm:grid-cols-4 gap-1 z-10">
          {BLOCK_LIBRARY.map((b) => {
            const Icon = ICONS[b.icon] ?? Type;
            return (
              <button
                key={b.type}
                onClick={() => {
                  onPick(b.type);
                  setOpen(false);
                }}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-cream/10 text-cream/80 hover:text-cream text-xs"
              >
                <Icon className="h-4 w-4" />
                {b.label}
              </button>
            );
          })}
          <button
            onClick={() => setOpen(false)}
            className="col-span-2 sm:col-span-4 text-xs text-cream/40 hover:text-cream py-1"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}

function BlockForm({
  type,
  data,
  onChange,
}: {
  type: BlockType;
  data: unknown;
  onChange: (d: unknown) => void;
}) {
  switch (type) {
    case "heading": {
      const d = data as BlockData["heading"];
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Select
              value={String(d.level)}
              onValueChange={(v) => onChange({ ...d, level: Number(v) as 2 | 3 | 4 })}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">H2</SelectItem>
                <SelectItem value="3">H3</SelectItem>
                <SelectItem value="4">H4</SelectItem>
              </SelectContent>
            </Select>
            <Select value={d.align ?? "left"} onValueChange={(v) => onChange({ ...d, align: v })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Izquierda</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="right">Derecha</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            value={d.text}
            onChange={(e) => onChange({ ...d, text: e.target.value })}
            placeholder="Texto del encabezado"
          />
        </div>
      );
    }
    case "paragraph": {
      const d = data as BlockData["paragraph"];
      return <RichTextEditor value={d.html} onChange={(html) => onChange({ html })} allowImages />;
    }
    case "image":
      return <ImageBlockForm data={data as BlockData["image"]} onChange={onChange} />;
    case "embed": {
      const d = data as BlockData["embed"];
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">URL (YouTube, Vimeo…)</Label>
            <Input
              value={d.url}
              onChange={(e) => onChange({ ...d, url: e.target.value })}
              placeholder="https://youtu.be/..."
            />
          </div>
          <Select value={d.aspect ?? "16/9"} onValueChange={(v) => onChange({ ...d, aspect: v })}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16/9">16:9</SelectItem>
              <SelectItem value="4/3">4:3</SelectItem>
              <SelectItem value="1/1">1:1</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }
    case "cta": {
      const d = data as BlockData["cta"];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            value={d.label}
            onChange={(e) => onChange({ ...d, label: e.target.value })}
            placeholder="Texto del botón"
          />
          <Input
            value={d.href}
            onChange={(e) => onChange({ ...d, href: e.target.value })}
            placeholder="URL destino"
          />
          <Select
            value={d.variant ?? "primary"}
            onValueChange={(v) => onChange({ ...d, variant: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primario (coral)</SelectItem>
              <SelectItem value="secondary">Secundario</SelectItem>
            </SelectContent>
          </Select>
          <Select value={d.align ?? "left"} onValueChange={(v) => onChange({ ...d, align: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Izquierda</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="right">Derecha</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }
    case "quote": {
      const d = data as BlockData["quote"];
      return (
        <div className="space-y-2">
          <RichTextEditor
            value={d.html}
            onChange={(html) => onChange({ ...d, html })}
            minimal
            placeholder="Texto de la cita"
          />
          <Input
            value={d.attribution ?? ""}
            onChange={(e) => onChange({ ...d, attribution: e.target.value })}
            placeholder="Autor / fuente (opcional)"
          />
        </div>
      );
    }
    case "divider":
      return <p className="text-xs text-cream/40 italic">Línea separadora</p>;
    case "form_embed": {
      const d = data as BlockData["form_embed"];
      return (
        <div>
          <Label className="text-xs">Slug del formulario</Label>
          <Input
            value={d.formSlug}
            onChange={(e) => onChange({ formSlug: e.target.value })}
            placeholder="ej: inscripcion-torneo"
          />
          <p className="text-xs text-cream/40 mt-1">
            Se activa al publicar el módulo de inscripciones.
          </p>
        </div>
      );
    }
    case "hero":
      return <HeroForm data={data as BlockData["hero"]} onChange={onChange} />;
    case "columns":
      return <ColumnsForm data={data as BlockData["columns"]} onChange={onChange} />;
    case "gallery":
      return <GalleryForm data={data as BlockData["gallery"]} onChange={onChange} />;
    case "cards":
      return <CardsForm data={data as BlockData["cards"]} onChange={onChange} />;
    case "button":
      return <ButtonForm data={data as BlockData["button"]} onChange={onChange} />;
  }
}

function ImageBlockForm({
  data,
  onChange,
}: {
  data: BlockData["image"];
  onChange: (d: unknown) => void;
}) {
  return (
    <div className="space-y-2">
      <ImagePicker url={data.url} onChange={(url) => onChange({ ...data, url })} />
      <Input
        value={data.alt}
        onChange={(e) => onChange({ ...data, alt: e.target.value })}
        placeholder="Texto alternativo (alt)"
      />
      <Input
        value={data.caption ?? ""}
        onChange={(e) => onChange({ ...data, caption: e.target.value })}
        placeholder="Pie de foto (opcional)"
      />
      <Select
        value={data.width ?? "content"}
        onValueChange={(v) => onChange({ ...data, width: v })}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="narrow">Estrecha</SelectItem>
          <SelectItem value="content">Contenido</SelectItem>
          <SelectItem value="full">Ancho completo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function HeroForm({ data, onChange }: { data: BlockData["hero"]; onChange: (d: unknown) => void }) {
  return (
    <div className="space-y-3">
      <ImagePicker
        url={data.image_url}
        onChange={(url) => onChange({ ...data, image_url: url })}
        height="h-48"
        label="Subir imagen de fondo"
      />
      <Input
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="Título principal"
      />
      <Input
        value={data.subtitle ?? ""}
        onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
        placeholder="Subtítulo (opcional)"
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">
            Opacidad overlay ({Math.round((data.overlay_opacity ?? 0.45) * 100)}%)
          </Label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round((data.overlay_opacity ?? 0.45) * 100)}
            onChange={(e) => onChange({ ...data, overlay_opacity: Number(e.target.value) / 100 })}
            className="w-full"
          />
        </div>
        <Select
          value={data.align ?? "center"}
          onValueChange={(v) => onChange({ ...data, align: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="center">Centrado</SelectItem>
            <SelectItem value="left">Izquierda</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={data.cta_label ?? ""}
          onChange={(e) => onChange({ ...data, cta_label: e.target.value })}
          placeholder="Texto botón (opcional)"
        />
        <Input
          value={data.cta_href ?? ""}
          onChange={(e) => onChange({ ...data, cta_href: e.target.value })}
          placeholder="URL destino"
        />
      </div>
      <Select
        value={data.cta_variant ?? "primary"}
        onValueChange={(v) => onChange({ ...data, cta_variant: v })}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="primary">Primario</SelectItem>
          <SelectItem value="secondary">Secundario</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function ColumnsForm({
  data,
  onChange,
}: {
  data: BlockData["columns"];
  onChange: (d: unknown) => void;
}) {
  const setCount = (n: 2 | 3) => {
    const items = [...data.items];
    while (items.length < n) items.push({ html: "<p>Nueva columna</p>" });
    onChange({ ...data, count: n, items: items.slice(0, n) });
  };
  return (
    <div className="space-y-3">
      <Select value={String(data.count)} onValueChange={(v) => setCount(Number(v) as 2 | 3)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2">2 columnas</SelectItem>
          <SelectItem value="3">3 columnas</SelectItem>
        </SelectContent>
      </Select>
      <div className={`grid gap-3 ${data.count === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {data.items.map((item, i) => (
          <div key={i} className="space-y-2 border border-cream/10 rounded-lg p-2">
            <ImagePicker
              url={item.image_url}
              onChange={(url) => {
                const items = [...data.items];
                items[i] = { ...items[i], image_url: url };
                onChange({ ...data, items });
              }}
              height="h-20"
              label="Imagen (opt.)"
            />
            <RichTextEditor
              value={item.html}
              onChange={(html) => {
                const items = [...data.items];
                items[i] = { ...items[i], html };
                onChange({ ...data, items });
              }}
              minimal
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryForm({
  data,
  onChange,
}: {
  data: BlockData["gallery"];
  onChange: (d: unknown) => void;
}) {
  const addImage = (url: string) =>
    onChange({ ...data, images: [...data.images, { url, alt: "", caption: "" }] });
  const updateImage = (
    i: number,
    patch: Partial<{ url: string; alt: string; caption: string }>,
  ) => {
    const images = [...data.images];
    images[i] = { ...images[i], ...patch };
    onChange({ ...data, images });
  };
  const remove = (i: number) =>
    onChange({ ...data, images: data.images.filter((_, idx) => idx !== i) });
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <Label className="text-xs">Columnas</Label>
        <Select
          value={String(data.columns)}
          onValueChange={(v) => onChange({ ...data, columns: Number(v) })}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
          </SelectContent>
        </Select>
        <label className="text-xs flex items-center gap-1 ml-2">
          <input
            type="checkbox"
            checked={data.lightbox ?? true}
            onChange={(e) => onChange({ ...data, lightbox: e.target.checked })}
          />
          Lightbox
        </label>
      </div>
      <div
        className={`grid gap-2 ${data.columns === 4 ? "grid-cols-4" : data.columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}
      >
        {data.images.map((img, i) => (
          <div key={i} className="space-y-1 border border-cream/10 rounded p-1">
            <div className="relative">
              <img loading="lazy" decoding="async"
                src={img.url}
                alt={img.alt}
                className="w-full aspect-square object-cover rounded"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 bg-ink/80 text-cream h-6 w-6 p-0 hover:bg-red-500"
              >
                ×
              </Button>
            </div>
            <Input
              value={img.alt ?? ""}
              onChange={(e) => updateImage(i, { alt: e.target.value })}
              placeholder="alt"
              className="text-xs h-7"
            />
          </div>
        ))}
        <ImagePicker onChange={addImage} height="h-full min-h-24" label="+" />
      </div>
    </div>
  );
}

function CardsForm({
  data,
  onChange,
}: {
  data: BlockData["cards"];
  onChange: (d: unknown) => void;
}) {
  const updateCard = (i: number, patch: Partial<BlockData["cards"]["items"][number]>) => {
    const items = [...data.items];
    items[i] = { ...items[i], ...patch };
    onChange({ ...data, items });
  };
  const addCard = () =>
    onChange({ ...data, items: [...data.items, { title: "Nueva card", body: "" }] });
  const removeCard = (i: number) =>
    onChange({ ...data, items: data.items.filter((_, idx) => idx !== i) });
  return (
    <div className="space-y-3">
      <Select
        value={String(data.columns)}
        onValueChange={(v) => onChange({ ...data, columns: Number(v) })}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2">2 columnas</SelectItem>
          <SelectItem value="3">3 columnas</SelectItem>
        </SelectContent>
      </Select>
      <div className="space-y-2">
        {data.items.map((c, i) => (
          <div key={i} className="border border-cream/10 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-cream/50">Card {i + 1}</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeCard(i)}
                className="h-7 w-7 p-0 text-cream/60 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <ImagePicker
              url={c.image_url}
              onChange={(url) => updateCard(i, { image_url: url })}
              height="h-24"
              label="Imagen (opt.)"
            />
            <Input
              value={c.title}
              onChange={(e) => updateCard(i, { title: e.target.value })}
              placeholder="Título"
            />
            <Input
              value={c.body ?? ""}
              onChange={(e) => updateCard(i, { body: e.target.value })}
              placeholder="Descripción (opcional)"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={c.cta_label ?? ""}
                onChange={(e) => updateCard(i, { cta_label: e.target.value })}
                placeholder="Botón (opcional)"
              />
              <Input
                value={c.cta_href ?? ""}
                onChange={(e) => updateCard(i, { cta_href: e.target.value })}
                placeholder="URL"
              />
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" onClick={addCard} className="w-full">
        <Plus className="h-3.5 w-3.5 mr-1" /> Añadir card
      </Button>
    </div>
  );
}

function ButtonForm({
  data,
  onChange,
}: {
  data: BlockData["button"];
  onChange: (d: unknown) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        value={data.label}
        onChange={(e) => onChange({ ...data, label: e.target.value })}
        placeholder="Texto"
      />
      <Input
        value={data.href}
        onChange={(e) => onChange({ ...data, href: e.target.value })}
        placeholder="URL"
      />
      <Select value={data.variant} onValueChange={(v) => onChange({ ...data, variant: v })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="primary">Primario</SelectItem>
          <SelectItem value="secondary">Secundario</SelectItem>
          <SelectItem value="outline">Outline</SelectItem>
          <SelectItem value="ghost">Ghost</SelectItem>
        </SelectContent>
      </Select>
      <Select value={data.size} onValueChange={(v) => onChange({ ...data, size: v })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sm">Pequeño</SelectItem>
          <SelectItem value="md">Medio</SelectItem>
          <SelectItem value="lg">Grande</SelectItem>
        </SelectContent>
      </Select>
      <Select value={data.align ?? "left"} onValueChange={(v) => onChange({ ...data, align: v })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="left">Izquierda</SelectItem>
          <SelectItem value="center">Centro</SelectItem>
          <SelectItem value="right">Derecha</SelectItem>
        </SelectContent>
      </Select>
      <label className="flex items-center gap-2 text-xs col-span-2">
        <input
          type="checkbox"
          checked={data.full_width ?? false}
          onChange={(e) => onChange({ ...data, full_width: e.target.checked })}
        />
        Ancho completo
      </label>
    </div>
  );
}
