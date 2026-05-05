/**
 * CMS-aware editable primitives.
 *
 * These are different from `src/editor/Editable.tsx` (which writes to
 * `content_overrides` per-element). These write to the structured
 * `content_sections` JSON via SectionProvider/useSection.
 *
 * Use for any field declared in the schema (src/cms/schemas.ts).
 */
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, ArrowUp, ArrowDown, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/editor/EditorProvider";
import { uploadMedia } from "@/server/media.functions";
import { arrayBufferToBase64 } from "@/lib/base64";
import { useSection, useSectionValue } from "./SectionContext";

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
  const { editMode } = useEditor();
  const { setField } = useSection();
  const value = useSectionValue<string>(field, fallback);
  const ref = useRef<HTMLElement | null>(null);
  const [editing, setEditing] = useState(false);

  const onClick = (e: React.MouseEvent) => {
    if (!editMode) return;
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
        editing
          ? "outline outline-2 outline-coral bg-cream/40 rounded"
          : "hover:outline hover:outline-1 hover:outline-coral/60"
      }`
    : "";

  const empty = !value;
  const placeholderText = empty && editMode ? placeholder ?? "(vacío — clic para editar)" : "";

  return (
    <Tag
      ref={ref as never}
      onClick={onClick}
      onBlur={editing ? commit : undefined}
      onKeyDown={editing ? onKeyDown : undefined}
      contentEditable={editing}
      suppressContentEditableWarning
      className={`${className ?? ""} ${editorClasses} ${
        empty && editMode ? "italic text-foreground/40" : ""
      }`.trim()}
      style={editMode ? { ...style, position: "relative", zIndex: 5 } : style}
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
  emptyLabel = "Subir imagen",
}: CmsImageProps) {
  const { editMode } = useEditor();
  const { setField } = useSection();
  const value = useSectionValue<string>(field, fallback);
  const upload = useServerFn(uploadMedia);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > 25 * 1024 * 1024) {
        toast.error("La imagen debe pesar menos de 25 MB");
        return;
      }
      setUploading(true);
      try {
        const buf = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(buf);
        const r = await upload({
          data: {
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            base64,
          },
        });
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

  const onClick = () => {
    if (!editMode) return;
    inputRef.current?.click();
  };

  // Render
  const showEmpty = !value;

  return (
    <div
      className={`relative ${editMode ? "group cursor-pointer" : ""}`}
      onClick={editMode ? onClick : undefined}
      style={editMode ? { ...style } : style}
    >
      {value ? (
        <img
          src={value}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
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
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-[inherit]">
            <span className="inline-flex items-center gap-2 bg-coral text-white px-4 py-2 rounded-lg text-sm font-bold shadow-xl">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Subiendo…
                </>
              ) : (
                <>
                  <ImagePlus className="h-4 w-4" /> {value ? "Cambiar imagen" : emptyLabel}
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
