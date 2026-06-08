import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  listRedirects,
  adminDeleteRedirect,
  type RedirectRow,
} from "@/lib/urls.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/content/redirects")({
  loader: () => listRedirects(),
  component: RedirectsAdmin,
});

function RedirectsAdmin() {
  const initial = Route.useLoaderData();
  const [rows, setRows] = useState<RedirectRow[]>(initial.redirects);
  const list = useServerFn(listRedirects);
  const del = useServerFn(adminDeleteRedirect);

  const reload = async () => {
    const r = await list();
    setRows(r.redirects);
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta redirección? La URL antigua dejará de redirigir.")) return;
    try {
      await del({ data: { id } });
      toast.success("Redirección eliminada");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <Link
          to="/admin/content/urls"
          className="text-cream/60 hover:text-cream text-sm inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> URLs
        </Link>
        <h1 className="font-display text-4xl font-bold mt-2">Redirecciones 301</h1>
        <p className="text-cream/60 mt-1 max-w-2xl">
          Cada vez que cambias el slug de una página se crea aquí una redirección permanente
          para conservar el SEO de la URL antigua.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="bg-cream/5 border border-cream/10 rounded-2xl p-8 text-center text-cream/60">
          Aún no hay redirecciones. Cambia un slug desde{" "}
          <Link to="/admin/content/urls" className="text-coral hover:underline">
            URLs por idioma
          </Link>{" "}
          y aparecerá aquí.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="bg-cream/5 border border-cream/10 rounded-xl p-4 flex items-center gap-3 flex-wrap"
            >
              <span className="text-[10px] uppercase tracking-wider bg-coral/15 text-coral px-2 py-0.5 rounded font-mono">
                301
              </span>
              {r.locale && (
                <span className="text-[10px] uppercase tracking-wider bg-cream/10 text-cream/60 px-2 py-0.5 rounded">
                  {r.locale}
                </span>
              )}
              <code className="text-sm font-mono text-cream/80">{r.from_path}</code>
              <ArrowRight className="h-4 w-4 text-cream/40" />
              <code className="text-sm font-mono text-coral">{r.to_path}</code>
              <span className="text-xs text-cream/40 ml-auto">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
              <button
                onClick={() => handleDelete(r.id)}
                className="p-1.5 text-cream/50 hover:text-red-300 hover:bg-red-500/10 rounded"
                title="Eliminar redirección"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="pt-4">
        <Link to="/admin/content/urls">
          <Button variant="ghost" className="text-cream/70">
            ← Volver a URLs
          </Button>
        </Link>
      </div>
    </div>
  );
}
