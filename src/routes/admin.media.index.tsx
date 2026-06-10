import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Newspaper, Plus, Pencil, ExternalLink, Loader2, EyeOff } from "lucide-react";
import {
  adminListMediaAppearances,
  type MediaAppearance,
} from "@/lib/media-appearances.functions";

export const Route = createFileRoute("/admin/media/")({
  head: () => ({
    meta: [
      { title: "Medios — Admin KLEFF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminMediaList,
});

const MONTH_LABELS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

function AdminMediaList() {
  const listFn = useServerFn(adminListMediaAppearances);
  const [items, setItems] = useState<MediaAppearance[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await listFn();
        setItems(res);
      } catch (e) {
        setErr((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [listFn]);

  const filtered = items.filter((it) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      it.title.toLowerCase().includes(s) ||
      it.outlet.toLowerCase().includes(s) ||
      it.url.toLowerCase().includes(s)
    );
  });

  if (loading)
    return (
      <div className="flex items-center gap-2 p-6 text-ink/60">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando medios…
      </div>
    );
  if (err)
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700">
        {err}
      </div>
    );

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-semibold flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-coral" /> Medios
          </h1>
          <p className="text-sm text-ink/70 mt-1">
            Apariciones en prensa, radio, TV y redes. Se muestran en la página pública
            «/medios» agrupadas por año.
          </p>
        </div>
        <Link
          to="/admin/media/new"
          className="inline-flex items-center gap-2 bg-coral hover:bg-coral/90 text-ink rounded-md px-3 py-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Nueva publicación
        </Link>
      </header>

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por título, medio o URL…"
        className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm"
      />

      <div className="rounded-lg border border-ink/10 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-wider text-ink/60">
            <tr>
              <th className="px-4 py-3 w-24">Fecha</th>
              <th className="px-4 py-3">Publicación</th>
              <th className="px-4 py-3 w-24 text-center">Estado</th>
              <th className="px-4 py-3 w-32">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-ink/60">
                  {items.length === 0
                    ? "Aún no hay apariciones. Pulsa «Nueva publicación» para añadir la primera."
                    : "Sin resultados para esa búsqueda."}
                </td>
              </tr>
            ) : (
              filtered.map((it) => (
                <tr key={it.id} className="border-t border-ink/10 hover:bg-cream/40">
                  <td className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink/70 tabular-nums">
                    {it.dateLabel || `${MONTH_LABELS[it.month - 1]} ${it.year}`}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to="/admin/media/$id"
                      params={{ id: it.id }}
                      className="font-medium text-ink hover:text-coral line-clamp-1"
                    >
                      {it.title}
                    </Link>
                    <div className="text-xs text-ink/60 mt-0.5 line-clamp-1">{it.outlet}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {it.isPublished ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                        Publicado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium">
                        <EyeOff className="h-3 w-3" /> Borrador
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Link
                        to="/admin/media/$id"
                        params={{ id: it.id }}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-ink/80 hover:text-ink hover:bg-ink/10"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <a
                        href={it.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-ink/80 hover:text-ink hover:bg-ink/10"
                        title="Abrir publicación"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
