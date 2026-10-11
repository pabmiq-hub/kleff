import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Upload, Users, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MMAdminGate } from "@/components/mm/AdminGate";
import { mmImportGame, mmListGames } from "@/lib/mm/admin.functions";
import { DEMO_GAME } from "@/lib/mm/demo-game";

export const Route = createFileRoute("/actividades_/juegos/")({
  head: () => ({
    meta: [
      { title: "Juegos Murder Mystery — Administración KLEFF" },
      { name: "description", content: "Catálogo de juegos de misterio de KLEFF: importa, prepara y lanza partidas." },
      { property: "og:title", content: "Juegos Murder Mystery — KLEFF" },
      { property: "og:description", content: "Crea y gestiona partidas de misterio para jugar desde el móvil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <MMAdminGate>
      <Catalog />
    </MMAdminGate>
  ),
});

function Catalog() {
  const list = useServerFn(mmListGames);
  const importFn = useServerFn(mmImportGame);
  const navigate = useNavigate();
  const [games, setGames] = useState<any[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => list().then(setGames).catch((e) => toast.error(e.message));
  useEffect(() => {
    void load();
  }, []);

  const doImport = async (json: unknown) => {
    setErrors([]);
    const r = await importFn({ data: { json } });
    if (!r.ok) {
      setErrors(r.errors);
      toast.error("El JSON tiene errores");
      return;
    }
    toast.success("Juego importado");
    void navigate({ to: "/actividades/juegos/$gameId", params: { gameId: r.gameId } });
  };

  const onFile = async (f: File) => {
    try {
      await doImport(JSON.parse(await f.text()));
    } catch {
      setErrors(["El archivo no es un JSON válido"]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto font-display text-3xl font-bold">Juegos</h1>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <Button variant="outline" onClick={() => doImport({ ...DEMO_GAME, game: { ...DEMO_GAME.game, slug: `${DEMO_GAME.game.slug}-${Date.now().toString(36)}` } })}>
          <Sparkles className="mr-2 h-4 w-4" /> Cargar juego de demostración
        </Button>
        <Button onClick={() => fileRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" /> Importar juego (JSON)
        </Button>
      </div>
      {errors.length > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="mb-2 font-semibold">No se ha importado nada. Corrige estos problemas:</p>
          <ul className="list-disc space-y-1 pl-5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {games === null ? (
        <p className="text-ink/60">Cargando…</p>
      ) : games.length === 0 ? (
        <p className="rounded-xl bg-cream-deep p-8 text-center text-ink/70">Todavía no hay juegos. Importa un JSON o carga el juego de demostración.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <Link key={g.id} to="/actividades/juegos/$gameId" params={{ gameId: g.id }} className="overflow-hidden rounded-2xl border border-ink/10 bg-card transition-shadow hover:shadow-lg">
              <div className="flex aspect-video items-end p-4" style={{ background: g.cover_url ? `center/cover url(${g.cover_url})` : (g.theme?.background ?? "#140d0b"), color: g.theme?.text ?? "#f5e9d7" }}>
                <p className="text-xl font-bold" style={{ fontFamily: g.theme?.font_display ? `'${g.theme.font_display}', serif` : undefined }}>
                  {g.title}
                </p>
              </div>
              <div className="flex items-center gap-4 p-4 text-sm text-ink/70">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> {g.min_players}–{g.max_players}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {g.duration_minutes} min
                </span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${g.status === "published" ? "bg-primary/15 text-primary" : "bg-ink/10"}`}>{g.status === "published" ? "Publicado" : "Borrador"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
