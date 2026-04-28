import { createFileRoute, Link } from "@tanstack/react-router";
import { PAGE_SCHEMAS } from "@/cms/schemas";
import { FileText, Pencil } from "lucide-react";

export const Route = createFileRoute("/admin/content/")({
  component: ContentIndex,
});

function ContentIndex() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-bold">Contenido de la web</h1>
        <p className="text-cream/60 mt-1">
          Edita las páginas reales del sitio. El diseño se mantiene; tú cambias los textos e imágenes.
        </p>
      </header>

      <div className="grid gap-4">
        {PAGE_SCHEMAS.map((page) => (
          <Link
            key={page.key}
            to="/admin/content/$pageKey"
            params={{ pageKey: page.key }}
            className="block bg-cream/5 border border-cream/15 rounded-2xl p-5 hover:border-coral/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-xl bg-coral/15 text-coral flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-cream">{page.label}</h2>
                  <p className="text-xs text-cream/50 font-mono mt-0.5">{page.path}</p>
                  {page.description && (
                    <p className="text-sm text-cream/60 mt-2">{page.description}</p>
                  )}
                  <p className="text-xs text-cream/40 mt-3">
                    {page.sections.length} {page.sections.length === 1 ? "zona editable" : "zonas editables"}
                  </p>
                </div>
              </div>
              <Pencil className="h-4 w-4 text-cream/40 mt-1" />
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-cream/5 border border-dashed border-cream/15 rounded-2xl p-5 text-sm text-cream/60">
        El blog se gestionará en una sección dedicada (en preparación).
      </div>
    </div>
  );
}
