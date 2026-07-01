import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered, Quote, Link as LinkIcon, Heading2, Heading3, Image as ImageIcon, ImagePlus, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { uploadMedia } from "@/lib/media.functions";
import { arrayBufferToBase64 } from "@/lib/base64";
import { toast } from "sonner";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Minimal toolbar (no headings, image, lists) for short fields like quotes. */
  minimal?: boolean;
  /** Allow image insertion (uploads to media bucket). */
  allowImages?: boolean;
};

export function RichTextEditor({ value, onChange, placeholder, minimal, allowImages }: Props) {
  const upload = useServerFn(uploadMedia);
  const lastSetRef = useRef(value);

  const editor = useEditor({
    extensions: [
      // Tiptap v3 StarterKit ships its own Link extension. Disable it so our
      // configured Link is the only one active (avoids duplicate-extension
      // "Cannot read properties of undefined (reading 'bind')" crash).
      StarterKit.configure({ link: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full h-auto my-3" } }),
      Placeholder.configure({ placeholder: placeholder ?? "Escribe aquí…" }),
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[120px] px-4 py-3",
      },
      // Clean HTML pasted from Word / Google Docs before it hits the schema
      // so paragraphs, bold, italic and lists all survive.
      transformPastedHTML: (html: string) => cleanPastedHtml(html),
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastSetRef.current = html;
      onChange(html);
    },
  });

  // Keep editor in sync if external value changes (e.g. locale switch).
  useEffect(() => {
    if (editor && value !== lastSetRef.current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
      lastSetRef.current = value;
    }
  }, [value, editor]);

  if (!editor) return null;

  const insertLink = () => {
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("URL del enlace", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const buf = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(buf);
        const { url } = await upload({
          data: { fileName: file.name, contentType: file.type || "image/jpeg", base64 },
        });
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      } catch (e) {
        toast.error((e as Error).message);
      }
    };
    input.click();
  };

  const insertImageWithCaption = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const buf = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(buf);
        const { url } = await upload({
          data: { fileName: file.name, contentType: file.type || "image/jpeg", base64 },
        });
        const caption = window.prompt("Pie de foto (descripción de la imagen)", "") ?? "";
        const safe = caption.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const html = `<figure><img src="${url}" alt="${safe || file.name}" class="rounded-lg max-w-full h-auto" /><figcaption class="text-sm text-center italic text-ink/60 mt-2">${safe}</figcaption></figure><p></p>`;
        editor.chain().focus().insertContent(html).run();
      } catch (e) {
        toast.error((e as Error).message);
      }
    };
    input.click();
  };

  return (
    <div className="border border-cream/15 rounded-lg bg-ink/40 overflow-hidden">
      <Toolbar
        editor={editor}
        minimal={minimal}
        allowImages={allowImages}
        onLink={insertLink}
        onImage={insertImage}
        onImageCaption={insertImageWithCaption}
      />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({
  editor, minimal, allowImages, onLink, onImage, onImageCaption,
}: {
  editor: Editor; minimal?: boolean; allowImages?: boolean;
  onLink: () => void; onImage: () => void; onImageCaption: () => void;
}) {
  const btn = (active: boolean) =>
    `h-8 w-8 p-0 ${active ? "bg-coral/20 text-coral" : "text-cream/70 hover:text-cream"}`;

  // preventDefault on mousedown keeps the editor selection alive so the
  // list / heading toggles apply to the current paragraph instead of losing
  // focus (which is why bullet/ordered list buttons appeared to "do nothing").
  const stop = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="flex items-center gap-0.5 flex-wrap border-b border-cream/10 bg-cream/5 px-2 py-1.5">
      <Button type="button" onMouseDown={stop} variant="ghost" size="sm" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-3.5 w-3.5" /></Button>
      <Button type="button" onMouseDown={stop} variant="ghost" size="sm" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-3.5 w-3.5" /></Button>
      {!minimal && (
        <>
          <Button type="button" onMouseDown={stop} variant="ghost" size="sm" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-3.5 w-3.5" /></Button>
          <Button type="button" onMouseDown={stop} variant="ghost" size="sm" className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-3.5 w-3.5" /></Button>
          <Button type="button" onMouseDown={stop} variant="ghost" size="sm" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-3.5 w-3.5" /></Button>
          <Button type="button" onMouseDown={stop} variant="ghost" size="sm" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-3.5 w-3.5" /></Button>
          <Button type="button" onMouseDown={stop} variant="ghost" size="sm" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-3.5 w-3.5" /></Button>
        </>
      )}
      <Button type="button" onMouseDown={stop} variant="ghost" size="sm" className={btn(editor.isActive("link"))} onClick={onLink}><LinkIcon className="h-3.5 w-3.5" /></Button>
      {allowImages && (
        <>
          <Button type="button" onMouseDown={stop} variant="ghost" size="sm" className={btn(false)} onClick={onImage} title="Insertar imagen"><ImageIcon className="h-3.5 w-3.5" /></Button>
          <Button type="button" onMouseDown={stop} variant="ghost" size="sm" className="h-8 px-2 text-xs text-cream/70 hover:text-cream" onClick={onImageCaption} title="Insertar imagen con pie de foto"><ImagePlus className="h-3.5 w-3.5 mr-1" />+ pie</Button>
        </>
      )}
      <span className="flex-1" />
      <Button type="button" onMouseDown={stop} variant="ghost" size="sm" className={btn(false)} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-3.5 w-3.5" /></Button>
      <Button type="button" onMouseDown={stop} variant="ghost" size="sm" className={btn(false)} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Word / Google Docs / rich HTML paste normalizer
// ---------------------------------------------------------------------------
// Word ships pastes with truckloads of MSO conditional comments, inline
// `mso-*` styles and — for lists — plain `<p class="MsoListParagraph">`
// paragraphs prefixed with a "·" / "1." glyph rather than real <ul>/<ol>.
// Tiptap's schema drops most of that as unknown markup, which is what makes
// paragraph spacing and bullets disappear. Normalize here before Tiptap sees
// it so the visible structure survives.
function cleanPastedHtml(html: string): string {
  if (!html || typeof html !== "string") return html;

  let out = html;

  // 1) Strip Word's XML/HTML conditional comments and <o:p> tags.
  out = out.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, "");
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<\/?o:p[^>]*>/gi, "");
  out = out.replace(/<\/?xml[\s\S]*?>/gi, "");
  out = out.replace(/<\/?w:[^>]+>/gi, "");
  out = out.replace(/<\/?m:[^>]+>/gi, "");

  // 2) Drop <style>, <meta>, <link>, <script> that Word/Docs embed.
  out = out.replace(/<style\b[\s\S]*?<\/style>/gi, "");
  out = out.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<\/?(?:meta|link)\b[^>]*>/gi, "");

  // 3) Convert Word "list paragraphs" into real <ul>/<ol>.
  //    Word marks each list item as <p class="MsoListParagraph...">…</p>
  //    with a leading bullet/number glyph inside <span style="mso-list:Ignore">.
  out = convertWordLists(out);

  // 4) Remove class/style/lang/id attributes — they carry mso-*, color and
  //    font-family declarations that make the paste look like an image of
  //    Word instead of like editable content.
  out = out.replace(/\s(?:class|style|lang|id|align|dir|face|color|start)="[^"]*"/gi, "");
  out = out.replace(/\s(?:class|style|lang|id|align|dir|face|color|start)='[^']*'/gi, "");

  // 5) Google Docs wraps everything in a <b id="docs-internal-guid-…"> that
  //    has font-weight:normal — turns whole paste bold. Unwrap it.
  out = out.replace(/<b\b([^>]*)>/gi, (m) =>
    /font-weight:\s*normal/i.test(m) ? "" : "<strong>",
  );
  out = out.replace(/<\/b>/gi, "</strong>");

  // 6) Normalise whitespace: Word uses &nbsp; for indentation.
  out = out.replace(/&nbsp;/g, " ");

  // 7) Turn <div> paragraphs into <p> so Tiptap keeps the paragraph split.
  out = out.replace(/<div(\s[^>]*)?>/gi, "<p>").replace(/<\/div>/gi, "</p>");

  // 8) Collapse empty paragraphs that Word emits between real ones.
  out = out.replace(/<p>\s*(?:<br\s*\/?>)?\s*<\/p>/gi, "");

  return out;
}

function convertWordLists(html: string): string {
  // Regex parses <p ...class="...Mso(List|ListParagraph)...">…</p> blocks.
  const listPara = /<p\b([^>]*class="[^"]*Mso(?:List|ListParagraph)[^"]*"[^>]*)>([\s\S]*?)<\/p>/gi;
  if (!listPara.test(html)) return html;
  listPara.lastIndex = 0;

  type Item = { ordered: boolean; content: string };
  const groups: { start: number; end: number; items: Item[] }[] = [];
  let current: { start: number; end: number; items: Item[] } | null = null;

  const matches: { index: number; length: number; ordered: boolean; content: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = listPara.exec(html))) {
    const attrs = m[1] ?? "";
    const inner = m[2] ?? "";
    // Ordered if the leading marker is a digit (e.g. "1.", "a)").
    const marker = /<span[^>]*mso-list:\s*Ignore[^>]*>([\s\S]*?)<\/span>/i.exec(inner);
    const markerText = marker
      ? marker[1].replace(/<[^>]+>/g, "").replace(/&nbsp;|\s/g, "")
      : "";
    const ordered = /^\d/.test(markerText) || /list-type:\s*decimal/i.test(attrs);
    const content = inner.replace(/<span[^>]*mso-list:\s*Ignore[^>]*>[\s\S]*?<\/span>/gi, "").trim();
    matches.push({ index: m.index, length: m[0].length, ordered, content });
  }

  // Merge consecutive matches (allowing only whitespace between) into groups.
  for (const match of matches) {
    if (current && html.slice(current.end, match.index).replace(/\s+/g, "") === "" && current.items[0].ordered === match.ordered) {
      current.items.push({ ordered: match.ordered, content: match.content });
      current.end = match.index + match.length;
    } else {
      if (current) groups.push(current);
      current = { start: match.index, end: match.index + match.length, items: [{ ordered: match.ordered, content: match.content }] };
    }
  }
  if (current) groups.push(current);

  // Rebuild HTML, replacing each group with a proper <ul> or <ol>.
  let out = "";
  let cursor = 0;
  for (const g of groups) {
    out += html.slice(cursor, g.start);
    const tag = g.items[0].ordered ? "ol" : "ul";
    out += `<${tag}>` + g.items.map((it) => `<li>${it.content}</li>`).join("") + `</${tag}>`;
    cursor = g.end;
  }
  out += html.slice(cursor);
  return out;
}
