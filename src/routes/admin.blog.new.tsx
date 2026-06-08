import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { adminCreateBlogPost } from "@/lib/blog.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/blog/new")({
  head: () => ({ meta: [{ title: "Nuevo post — Admin KLEFF" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: NewBlogPost,
});

function NewBlogPost() {
  const router = useRouter();
  const createFn = useServerFn(adminCreateBlogPost);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const create = async () => {
    setCreating(true);
    try {
      const { id } = await createFn({ data: { slug: slug.trim(), title_es: title.trim() } });
      toast.success("Post creado");
      router.navigate({ to: "/admin/blog/$id", params: { id } });
    } catch (e) { toast.error((e as Error).message); }
    finally { setCreating(false); }
  };

  return (
    <div className="max-w-xl space-y-6">
      <Link to="/admin/blog" className="inline-flex items-center gap-2 text-sm text-cream/70 hover:text-cream"><ArrowLeft className="h-4 w-4" /> Volver</Link>
      <h1 className="text-2xl font-display font-semibold">Nuevo post de blog</h1>
      <div className="space-y-3 rounded-lg border border-cream/10 bg-cream/[0.03] p-5">
        <div>
          <Label className="text-cream text-xs uppercase tracking-wider">Slug (URL)</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} className="bg-ink/60 border-cream/15 text-cream mt-1" placeholder="mi-primer-post" />
          <p className="text-xs text-cream/50 mt-1">URL: /{slug || "tu-slug"}</p>
        </div>
        <div>
          <Label className="text-cream text-xs uppercase tracking-wider">Título (ES)</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-ink/60 border-cream/15 text-cream mt-1" placeholder="Título del post" />
        </div>
        <Button onClick={create} disabled={!slug || !title || creating} className="bg-coral hover:bg-coral/90">
          {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Crear y editar
        </Button>
      </div>
    </div>
  );
}
