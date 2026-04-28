import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useEditor } from "./EditorProvider";
import type { StyleProps } from "./types";

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

/** Detect HTML markers (very small heuristic — supports tags emitted by our toolbar). */
function isHtmlString(s: string): boolean {
  return /<\/?(b|strong|i|em|u|a|br|span)\b[^>]*>/i.test(s);
}

/** Escape plain text for safe HTML insertion. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type CommonProps = {
  id: string;
  className?: string;
  style?: CSSProperties;
};

/* ---------------- Text ---------------- */
type EditableTextProps = CommonProps & {
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  children: ReactNode; // default content (used when no override)
};

export function EditableText({
  id,
  as: Tag = "p",
  className,
  style,
  children,
}: EditableTextProps) {
  const { editMode, overrides, selected, setSelected, setText } = useEditor();
  const ref = useRef<HTMLElement | null>(null);
  const [editing, setEditing] = useState(false);

  const ov = overrides[id];
  if (ov?.hidden && !editMode) return null;
  if (ov?.hidden && editMode) {
    // show ghost so admin can re-enable from sidebar
  }

  const text = ov?.text;
  const isHtml = typeof text === "string" && isHtmlString(text);
  const mergedStyle = { ...style, ...styleToCss(ov?.style) };
  const isSelected = editMode && selected?.id === id;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!editMode) return;
      e.preventDefault();
      e.stopPropagation();
      const el = ref.current;
      if (!el) return;
      setSelected({ id, kind: "text", rect: el.getBoundingClientRect() });
    },
    [editMode, id, setSelected]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!editMode) return;
      e.preventDefault();
      e.stopPropagation();
      setEditing(true);
      // focus on next tick so caret appears
      requestAnimationFrame(() => {
        const el = ref.current;
        if (el) {
          el.focus();
          // place caret at end
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      });
    },
    [editMode]
  );

  const handleBlur = useCallback(() => {
    if (!editing) return;
    const el = ref.current;
    if (!el) return;
    const html = el.innerHTML.trim();
    setEditing(false);
    // Only persist if changed
    const current = text ?? (typeof children === "string" ? children : el.textContent ?? "");
    if (html !== current) {
      void setText(id, html);
    }
  }, [editing, id, setText, text, children]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!editing) return;
      // Save on Enter (without Shift), exit editing
      if (e.key === "Escape") {
        e.preventDefault();
        (e.currentTarget as HTMLElement).blur();
      }
      // Allow B/I/U keyboard shortcuts via execCommand (browser default)
    },
    [editing]
  );

  const editorClasses = editMode
    ? `relative cursor-text outline-offset-2 transition-all ${
        isSelected
          ? "outline outline-2 outline-coral"
          : "hover:outline hover:outline-1 hover:outline-coral/60"
      } ${editing ? "outline outline-2 outline-coral bg-cream/60 rounded" : ""}`
    : "";

  // pointer-events / z-index nudge so decorative animated overlays don't block clicks
  const editModeStyle: CSSProperties = editMode
    ? { pointerEvents: "auto", position: "relative", zIndex: 5 }
    : {};

  const finalStyle = { ...mergedStyle, ...editModeStyle };

  // Choose how to render the content
  const content =
    text !== undefined
      ? isHtml
        ? undefined // will render via dangerouslySetInnerHTML
        : text
      : children;

  return (
    <Tag
      ref={ref as never}
      data-edit-id={id}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      contentEditable={editing}
      suppressContentEditableWarning
      className={`${className ?? ""} ${editorClasses} ${
        ov?.hidden ? "opacity-30" : ""
      }`.trim()}
      style={finalStyle}
      {...(text !== undefined && isHtml
        ? { dangerouslySetInnerHTML: { __html: text } }
        : {})}
    >
      {text === undefined || !isHtml ? content : null}
    </Tag>
  );
}

/* ---------------- Image ---------------- */
type EditableImageProps = CommonProps & {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  loading?: "lazy" | "eager";
};

export function EditableImage({
  id,
  src,
  alt,
  className,
  style,
  width,
  height,
  loading,
}: EditableImageProps) {
  const { editMode, overrides, selected, setSelected } = useEditor();
  const ref = useRef<HTMLImageElement | null>(null);

  const ov = overrides[id];
  if (ov?.hidden && !editMode) return null;

  const finalSrc = ov?.src ?? src;
  const finalAlt = ov?.alt ?? alt;
  const mergedStyle = { ...style, ...styleToCss(ov?.style) };
  const isSelected = editMode && selected?.id === id;

  const handleClick = (e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    setSelected({ id, kind: "image", rect: el.getBoundingClientRect() });
  };

  const editorClasses = editMode
    ? `cursor-pointer outline-offset-2 ${
        isSelected
          ? "outline outline-2 outline-coral"
          : "hover:outline hover:outline-1 hover:outline-coral/60"
      }`
    : "";

  const editModeStyle: CSSProperties = editMode
    ? { pointerEvents: "auto", position: "relative", zIndex: 5 }
    : {};

  return (
    <img
      ref={ref}
      data-edit-id={id}
      src={finalSrc}
      alt={finalAlt}
      width={width}
      height={height}
      loading={loading}
      onClick={handleClick}
      className={`${className ?? ""} ${editorClasses} ${
        ov?.hidden ? "opacity-30" : ""
      }`.trim()}
      style={{ ...mergedStyle, ...editModeStyle }}
    />
  );
}

/* ---------------- Section (visibility wrapper) ---------------- */
type EditableSectionProps = CommonProps & {
  children: ReactNode;
  label?: string;
};

export function EditableSection({
  id,
  className,
  style,
  children,
  label,
}: EditableSectionProps) {
  const { editMode, overrides, selected, setSelected } = useEditor();
  const ov = overrides[id];
  const ref = useRef<HTMLElement | null>(null);

  if (ov?.hidden && !editMode) return null;

  const mergedStyle = { ...style, ...styleToCss(ov?.style) };
  const isSelected = editMode && selected?.id === id;

  const handleClick = (e: React.MouseEvent) => {
    if (!editMode) return;
    // Only catch clicks that bubbled from nothing inside (i.e. the section padding)
    if ((e.target as HTMLElement).closest("[data-edit-id]") !== ref.current) return;
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    setSelected({ id, kind: "text", rect: el.getBoundingClientRect() });
  };

  return (
    <section
      ref={ref as never}
      data-edit-id={id}
      data-edit-label={label}
      onClick={handleClick}
      className={`${className ?? ""} ${
        editMode
          ? `relative ${
              isSelected
                ? "outline outline-2 outline-dashed outline-coral"
                : "hover:outline hover:outline-1 hover:outline-dashed hover:outline-coral/40"
            }`
          : ""
      } ${editMode && ov?.hidden ? "opacity-30 outline outline-2 outline-dashed outline-cream/30" : ""}`.trim()}
      style={mergedStyle}
    >
      {editMode && label && (
        <span className="absolute -top-3 left-3 z-20 px-2 py-0.5 bg-coral text-cream text-[10px] font-bold uppercase tracking-wider rounded shadow pointer-events-none">
          {label}
        </span>
      )}
      {children}
    </section>
  );
}

/* ---------------- Floating inline-format toolbar ---------------- */
/** Renders a small toolbar near the current text selection while a contentEditable is focused. */
export function InlineFormatToolbar() {
  const { editMode } = useEditor();
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!editMode) {
      setPos(null);
      return;
    }
    const update = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setPos(null);
        return;
      }
      // Only show if selection is inside an EditableText currently being edited
      const anchor = sel.anchorNode;
      const el =
        anchor && anchor.nodeType === 1
          ? (anchor as HTMLElement)
          : anchor?.parentElement ?? null;
      const editable = el?.closest('[contenteditable="true"][data-edit-id]');
      if (!editable) {
        setPos(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPos(null);
        return;
      }
      setPos({ top: rect.top - 44 + window.scrollY, left: rect.left + rect.width / 2 + window.scrollX });
    };
    document.addEventListener("selectionchange", update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      document.removeEventListener("selectionchange", update);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [editMode]);

  if (!editMode || !pos) return null;

  const exec = (cmd: string, value?: string) => {
    // execCommand is deprecated but still the simplest cross-browser way to do
    // selection-bound rich-text editing. Acceptable for an internal editor.
    document.execCommand(cmd, false, value);
  };

  const onLink = () => {
    const url = window.prompt("URL del enlace (https://…)");
    if (!url) return;
    exec("createLink", url);
  };

  return (
    <div
      className="fixed z-[80] -translate-x-1/2 flex items-center gap-1 bg-[#1a1a1a] text-white rounded-lg shadow-2xl border border-black/40 px-1.5 py-1"
      style={{ top: pos.top, left: pos.left, position: "absolute" }}
      onMouseDown={(e) => e.preventDefault()} // keep selection
    >
      <FmtBtn onClick={() => exec("bold")} title="Negrita (Ctrl+B)">
        <b>B</b>
      </FmtBtn>
      <FmtBtn onClick={() => exec("italic")} title="Cursiva (Ctrl+I)">
        <i>I</i>
      </FmtBtn>
      <FmtBtn onClick={() => exec("underline")} title="Subrayado (Ctrl+U)">
        <u>U</u>
      </FmtBtn>
      <span className="w-px h-5 bg-white/20 mx-0.5" />
      <FmtBtn onClick={onLink} title="Insertar enlace">
        🔗
      </FmtBtn>
      <FmtBtn onClick={() => exec("removeFormat")} title="Quitar formato">
        ⨯
      </FmtBtn>
    </div>
  );
}

function FmtBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="min-w-[28px] h-7 px-2 rounded hover:bg-white/15 text-sm font-medium inline-flex items-center justify-center"
    >
      {children}
    </button>
  );
}
