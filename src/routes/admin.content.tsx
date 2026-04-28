import { createFileRoute } from "@tanstack/react-router";
import { FileText, Newspaper, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/admin/content")({
  component: ContentPage,
});

function ContentPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-bold">Contenido</h1>
        <p className="text-cream/60 mt-1">Gestión de la web pública. En construcción.</p>
      </header>

      <div className="grid sm:grid-cols-3 gap-4">
        <PlaceholderCard icon={<FileText className="h-5 w-5" />} title="Páginas" desc="Editor de bloques (Hero, Texto, Galería, FAQ…) para las páginas de la web." />
        <PlaceholderCard icon={<Newspaper className="h-5 w-5" />} title="Blog" desc="Crear y editar entradas. Importador desde WordPress.com." />
        <PlaceholderCard icon={<ImageIcon className="h-5 w-5" />} title="Media" desc="Biblioteca de imágenes y archivos." />
      </div>

      <div className="bg-coral/10 border border-coral/30 rounded-2xl p-5 text-sm text-cream/80">
        El CMS se construirá en la siguiente fase, según el plan de bloques aprobado.
      </div>
    </div>
  );
}

function PlaceholderCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-cream/5 border border-cream/15 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-coral font-semibold">
        {icon} {title}
      </div>
      <p className="text-sm text-cream/60 mt-2">{desc}</p>
      <p className="text-xs text-cream/40 mt-3">Próximamente</p>
    </div>
  );
}
