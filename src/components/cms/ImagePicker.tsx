import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { uploadMedia } from "@/lib/media.functions";
import { arrayBufferToBase64 } from "@/lib/base64";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

type Props = {
  url?: string;
  onChange: (url: string) => void;
  className?: string;
  height?: string; // tailwind class
  label?: string;
};

export function ImagePicker({ url, onChange, className = "", height = "h-32", label = "Subir imagen" }: Props) {
  const upload = useServerFn(uploadMedia);
  const [uploading, setUploading] = useState(false);

  const pickFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) {
        toast.error("La imagen supera los 8 MB");
        return;
      }
      setUploading(true);
      try {
        const buf = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(buf);
        const { url: newUrl } = await upload({ data: { fileName: file.name, contentType: file.type || "image/jpeg", base64 } });
        onChange(newUrl);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  if (url) {
    return (
      <div className={`relative group ${className}`}>
        <img src={url} alt="" className={`rounded-lg w-full object-cover ${height}`} />
        <div className="absolute top-1.5 right-1.5 flex gap-1">
          <Button size="sm" variant="ghost" onClick={pickFile} disabled={uploading} className="bg-ink/80 text-cream hover:bg-ink h-7 px-2 text-xs">
            Cambiar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onChange("")} className="bg-ink/80 text-cream hover:bg-red-500 h-7 w-7 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button onClick={pickFile} disabled={uploading} variant="outline" className={`w-full border-dashed ${height} ${className}`}>
      <ImageIcon className="h-4 w-4 mr-2" /> {uploading ? "Subiendo…" : label}
    </Button>
  );
}
