/**
 * CMS-aware editable primitives.
 *
 * These write structured data to `content_sections` JSON (via
 * SectionProvider) AND integrate with the global EditorProvider so the
 * full property side-panel (typography, colors, spacing, visibility)
 * works on them — exactly like the legacy <EditableText>.
 *
 * Interaction model (matches EditableText):
 *   - single click  → select element (opens side panel)
 *   - double click  → enter inline editing (text) / open file picker (image)
 */
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import { getOptimizedImageUrl, getResponsiveImageSrcSet } from "@/lib/image-delivery";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, ArrowUp, ArrowDown, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/editor/EditorProvider";
import type { StyleProps } from "@/editor/types";
import { uploadMedia } from "@/lib/media.functions";
import { optimizeToUploadPayload } from "@/lib/image-optimize";
import { useSection, useSectionValue } from "./SectionContext";

/* ----------------------------- helpers ----------------------------- */

function styleToCss(s: StyleProps | undefined): CSSProperties {
  if (!s) return {};
  const css: CSSProperties = {};
  if (s.color) css.color = s.color;
  if (s.backgroundColor) css.backgroundColor = s.backgroundColor;
  if (s.fontSize) css.fontSize = s.fontSize;
  if (s.fontWeight) css.fontWeight = s.fontWeight;
  if (s.textAlign) css.textAlign = s.textAlign;
  if (s.paddingTop) css.paddingTop = s.paddingTop;
  if (s.paddingBottom) css.paddingBottom = s.paddingBottom;
  if (s.paddingLeft) css.paddingLeft = s.paddingLeft;
  if (s.paddingRight) css.paddingRight = s.paddingRight;
  if (s.marginTop) css.marginTop = s.marginTop;
  if (s.marginBottom) css.marginBottom = s.marginBottom;
  return css;
}

/** Build the stable element id used to key overrides for a CMS field. */
function cmsId(sectionKey: string, field: string) {
  return `cms:${sectionKey}:${field}`;
}

/* ----------------------------- Text ----------------------------- */

type CmsTextProps = {
  /** Field path inside the section JSON, e.g. "title" or "items.0.name". */
  field: string;
  /** Fallback value when DB has no content. Should match what would render normally. */
  fallback?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  className?: string;
  style?: CSSProperties;
  multiline?: boolean;
  /** Placeholder shown when the value is empty (in edit mode). */
  placeholder?: string;
};

export function CmsText({
  field,
  fallback = "",
  as: Tag = "p",
  className,
  style,
  multiline,
  placeholder,
}: CmsTextProps) {
  const { editMode, overrides, selected, setSelected } = useEditor();
  const { sectionKey, setField } = useSection();
  const value = useSectionValue<string>(field, fallback);
  const ref = useRef<HTMLElement | null>(null);
  const [editing, setEditing] = useState(false);

  const id = cmsId(sectionKey, field);
  const ov = overrides[id];
  const isSelected = editMode && selected?.id === id;
  const mergedStyle: CSSProperties = { ...style, ...styleToCss(ov?.style) };

  if (ov?.hidden && !editMode) return null;

  const onClick = (e: React.MouseEvent) => {
    if (!editMode || editing) return;
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    setSelected({ id, kind: "text", rect: el.getBoundingClientRect() });
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    setEditing(true);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  };

  const commit = () => {
    const el = ref.current;
    if (!el) return;
    const text = (el.textContent ?? "").trim();
    setEditing(false);
    if (text !== value) setField(field, text);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }
  };

  const editorClasses = editMode
    ? `relative cursor-text outline-offset-2 transition-all ${
        isSelected
          ? "outline outline-2 outline-coral"
          : "hover:outline hover:outline-1 hover:outline-coral/60"
      } ${editing ? "outline outline-2 outline-coral bg-cream/40 rounded" : ""} ${
        ov?.hidden ? "opacity-30" : ""
      }`
    : "";

  const empty = !value;
  const placeholderText = empty && editMode ? placeholder ?? "(vacío — clic para editar)" : "";

  const finalStyle: CSSProperties = editMode
    ? { ...mergedStyle, position: "relative", zIndex: 5, pointerEvents: "auto" }
    : mergedStyle;

  return (
    <Tag
      ref={ref as never}
      data-edit-id={id}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onBlur={editing ? commit : undefined}
      onKeyDown={editing ? onKeyDown : undefined}
      contentEditable={editing}
      suppressContentEditableWarning
      className={`${className ?? ""} ${editorClasses} ${
        empty && editMode ? "italic text-foreground/40" : ""
      }`.trim()}
      style={finalStyle}
    >
      {empty ? placeholderText : value}
    </Tag>
  );
}

/* ----------------------------- Image ----------------------------- */

type CmsImageProps = {
  field: string;
  fallback?: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  width?: number | string;
  height?: number | string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  sizes?: string;
  /** Wrap the image in a button overlay so users see the upload action. */
  emptyLabel?: string;
};

export function CmsImage({
  field,
  fallback = "",
  alt = "",
  className,
  style,
  width,
  height,
  loading,
  fetchPriority,
  sizes,
  emptyLabel = "Subir imagen",
}: CmsImageProps) {
  const { editMode, overrides, selected, setSelected } = useEditor();
  const { sectionKey, setField } = useSection();
  const value = useSectionValue<string>(field, fallback);
  const upload = useServerFn(uploadMedia);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const id = cmsId(sectionKey, field);
  const ov = overrides[id];
  const isSelected = editMode && selected?.id === id;
  const mergedStyle: CSSProperties = { ...style, ...styleToCss(ov?.style) };

  if (ov?.hidden && !editMode) return null;

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > 25 * 1024 * 1024) {
        toast.error("La imagen debe pesar menos de 25 MB");
        return;
      }
      setUploading(true);
      try {
        const r = await upload({ data: await optimizeToUploadPayload(file) });
        setField(field, r.url);
        toast.success("Imagen subida");
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [field, setField, upload]
  );

  const onClick = (e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    const el = wrapperRef.current;
    if (!el) return;
    setSelected({ id, kind: "image", rect: el.getBoundingClientRect() });
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    inputRef.current?.click();
  };

  const showEmpty = !value;

  return (
    <div
      ref={wrapperRef}
      data-edit-id={id}
      className={`relative ${editMode ? `group cursor-pointer ${
        isSelected
          ? "outline outline-2 outline-coral outline-offset-2"
          : "hover:outline hover:outline-1 hover:outline-coral/60 outline-offset-2"
      } ${ov?.hidden ? "opacity-30" : ""}` : ""}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={editMode ? { ...mergedStyle, position: "relative", zIndex: 5 } : mergedStyle}
    >
      {value ? (
        <img
          src={getOptimizedImageUrl(value, { width: 1440, quality: 80, resize: "contain" })}
          srcSet={getResponsiveImageSrcSet(value, [480, 768, 1024, 1440], {
            quality: 80,
            resize: "contain",
          })}
          sizes={sizes ?? "100vw"}
          alt={alt}
          width={width}
          height={height}
          loading={loading ?? "lazy"}
          fetchPriority={fetchPriority}
          decoding={fetchPriority === "high" ? "sync" : "async"}
          className={className}
        />
      ) : showEmpty && editMode ? (
        <div
          className={`flex items-center justify-center bg-cream-deep/50 border-2 border-dashed border-ink/30 text-foreground/50 ${className ?? ""}`}
        >
          <ImagePlus className="h-8 w-8 mr-2" />
          <span className="text-sm font-bold">{emptyLabel}</span>
        </div>
      ) : null}

      {editMode && (
        <>
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-[inherit] pointer-events-none">
            <span className="inline-flex items-center gap-2 bg-coral text-white px-4 py-2 rounded-lg text-sm font-bold shadow-xl">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Subiendo…
                </>
              ) : (
                <>
                  <ImagePlus className="h-4 w-4" /> Doble clic para {value ? "cambiar" : "subir"}
                </>
              )}
            </span>
          </div>
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
        </>
      )}
    </div>
  );
}

/* ----------------------------- List ----------------------------- */

type CmsListProps<T> = {
  /** Field name of the list inside the section (e.g. "items"). */
  field: string;
  /** Render one item. The `field` prefix passed in lets nested fields write to the right path. */
  renderItem: (props: {
    item: T;
    index: number;
    /** Prefix to use for nested CmsText / CmsImage fields, e.g. "items.0". */
    prefix: string;
  }) => ReactNode;
  /** Wrap the list with a custom container (defaults to Fragment so layout is up to caller). */
  children?: never;
  /** Label shown on the "add" button, e.g. "Añadir miembro". */
  addLabel?: string;
};

export function CmsList<T = unknown>({ field, renderItem, addLabel = "Añadir" }: CmsListProps<T>) {
  const { editMode } = useEditor();
  const { data, addItem, removeItem, moveItem } = useSection();
  const items = (Array.isArray(data[field]) ? (data[field] as T[]) : []) as T[];

  return (
    <>
      {items.map((item, index) => (
        <div key={index} className={editMode ? "relative" : "contents"}>
          {renderItem({ item, index, prefix: `${field}.${index}` })}
          {editMode && (
            <div className="absolute -top-3 -right-3 z-30 flex items-center gap-1 bg-[#1a1a1a] text-white rounded-lg shadow-xl border border-black/30 p-1">
              <ItemBtn
                title="Mover arriba"
                disabled={index === 0}
                onClick={() => moveItem(field, index, index - 1)}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </ItemBtn>
              <ItemBtn
                title="Mover abajo"
                disabled={index === items.length - 1}
                onClick={() => moveItem(field, index, index + 1)}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </ItemBtn>
              <ItemBtn
                title="Eliminar"
                onClick={() => {
                  if (confirm(`¿Eliminar item #${index + 1}?`)) removeItem(field, index);
                }}
                danger
              >
                <Trash2 className="h-3.5 w-3.5" />
              </ItemBtn>
            </div>
          )}
        </div>
      ))}
      {editMode && (
        <button
          type="button"
          onClick={() => addItem(field)}
          className="col-span-full inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-coral/60 rounded-2xl text-sm font-bold text-coral-deep hover:bg-coral/10 transition-colors"
        >
          <Plus className="h-4 w-4" /> {addLabel}
        </button>
      )}
    </>
  );
}

function ItemBtn({
  children,
  onClick,
  title,
  disabled,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`p-1.5 rounded transition-colors ${
        disabled
          ? "text-white/20 cursor-not-allowed"
          : danger
            ? "text-white/80 hover:text-red-300 hover:bg-red-500/20"
            : "text-white/80 hover:text-white hover:bg-white/15"
      }`}
    >
      {children}
    </button>
  );
}
