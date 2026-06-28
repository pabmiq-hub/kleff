import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { MediaAppearanceForm } from "@/components/admin/MediaAppearanceForm";
import {
  adminGetMediaAppearance,
  type MediaAppearance,
} from "@/lib/media-appearances.functions";

export const Route = createFileRoute("/admin/media/$id")({
  head: () => ({
    meta: [
      { title: "Editar publicación — Admin KLEFF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EditMediaPage,
});

function EditMediaPage() {
  const { id } = Route.useParams();
  const getFn = useServerFn(adminGetMediaAppearance);
  const [item, setItem] = useState<MediaAppearance | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getFn({ data: { id } });
        if (cancelled) return;
        setItem(res);
      } catch (e) {
        if (cancelled) return;
        setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/media"
          className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" /> Volver a Medios
        </Link>
        <h1 className="mt-2 text-2xl font-display font-semibold">Editar publicación</h1>
      </div>
      {err && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700">
          {err}
        </div>
      )}
      {item === undefined ? (
        <div className="flex items-center gap-2 p-6 text-ink/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      ) : item === null ? (
        <p className="text-ink/60">No se ha encontrado la publicación.</p>
      ) : (
        <MediaAppearanceForm initial={item} />
      )}
    </div>
  );
}
