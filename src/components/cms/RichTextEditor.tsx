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
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full h-auto my-3" } }),
      Placeholder.configure({ placeholder: placeholder ?? "Escribe aquí…" }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[120px] px-4 py-3",
      },
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

  return (
    <div className="border border-cream/15 rounded-lg bg-ink/40 overflow-hidden">
      <Toolbar
        editor={editor}
        minimal={minimal}
        allowImages={allowImages}
        onLink={insertLink}
        onImage={insertImage}
      />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({
  editor, minimal, allowImages, onLink, onImage,
}: {
  editor: Editor; minimal?: boolean; allowImages?: boolean;
  onLink: () => void; onImage: () => void;
}) {
  const btn = (active: boolean) =>
    `h-8 w-8 p-0 ${active ? "bg-coral/20 text-coral" : "text-cream/70 hover:text-cream"}`;

  return (
    <div className="flex items-center gap-0.5 flex-wrap border-b border-cream/10 bg-cream/5 px-2 py-1.5">
      <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-3.5 w-3.5" /></Button>
      <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-3.5 w-3.5" /></Button>
      {!minimal && (
        <>
          <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-3.5 w-3.5" /></Button>
          <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-3.5 w-3.5" /></Button>
          <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-3.5 w-3.5" /></Button>
          <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-3.5 w-3.5" /></Button>
          <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-3.5 w-3.5" /></Button>
        </>
      )}
      <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("link"))} onClick={onLink}><LinkIcon className="h-3.5 w-3.5" /></Button>
      {allowImages && (
        <Button type="button" variant="ghost" size="sm" className={btn(false)} onClick={onImage}><ImageIcon className="h-3.5 w-3.5" /></Button>
      )}
      <span className="flex-1" />
      <Button type="button" variant="ghost" size="sm" className={btn(false)} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-3.5 w-3.5" /></Button>
      <Button type="button" variant="ghost" size="sm" className={btn(false)} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-3.5 w-3.5" /></Button>
    </div>
  );
}
