import { type CSSProperties, type ReactNode, useCallback, useRef } from "react";
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
  const { editMode, overrides, selected, setSelected } = useEditor();
  const ref = useRef<HTMLElement | null>(null);

  const ov = overrides[id];
  if (ov?.hidden) return null;

  const text = ov?.text;
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

  const editorClasses = editMode
    ? `cursor-pointer outline-offset-2 ${
        isSelected
          ? "outline outline-2 outline-coral"
          : "hover:outline hover:outline-1 hover:outline-coral/60"
      }`
    : "";

  return (
    <Tag
      ref={ref as never}
      data-edit-id={id}
      onClick={handleClick}
      className={`${className ?? ""} ${editorClasses}`.trim()}
      style={mergedStyle}
    >
      {text ?? children}
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
  if (ov?.hidden) return null;

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
      className={`${className ?? ""} ${editorClasses}`.trim()}
      style={mergedStyle}
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
  const { editMode, overrides } = useEditor();
  const ov = overrides[id];

  if (ov?.hidden && !editMode) return null;

  const mergedStyle = { ...style, ...styleToCss(ov?.style) };

  return (
    <section
      data-edit-id={id}
      data-edit-label={label}
      className={`${className ?? ""} ${
        editMode && ov?.hidden ? "opacity-30 outline outline-2 outline-dashed outline-cream/30" : ""
      }`.trim()}
      style={mergedStyle}
    >
      {children}
    </section>
  );
}
