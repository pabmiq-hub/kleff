import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listKleffers, getKlefferProfile } from "@/lib/kleffers.functions";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/app/kleffers")({
  head: () => ({
    meta: [
      { title: "Comunidad — Zona socios" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: KleffersPage,
});

interface KlefferExtended {
  attends_alone?: string | null;
  goals?: string[] | null;
  favorite_games?: Array<{ id: string; name: string; imageUrl?: string | null }> | null;
  game_types?: string[] | null;
  availability?: string[] | null;
  experience_level?: string | null;
  languages?: string[] | null;
  teaches?: string | null;
  scheduled_games?: string | null;
  bio?: string | null;
}

interface Kleffer {
  id: string;
  username: string;
  avatar_url: string | null;
  ludoya_username: string | null;
  ludoya_display_name: string | null;
  ludoya_avatar_url: string | null;
  member_number: number;
  created_at: string;
  extended: KlefferExtended | null;
}

interface LudoyaMember {
  username: string;
  name: string | null;
  avatarUrl: string | null;
  joinedAt: string | null;
  stats: Record<string, number> | null;
  collection: Array<{ id?: string; name?: string; imageUrl?: string | null }>;
}


function KleffersPage() {
  const fn = useServerFn(listKleffers);
  const detailFn = useServerFn(getKlefferProfile);
  const [items, setItems] = useState<Kleffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [onlyLudoya, setOnlyLudoya] = useState(false);
  const [onlyAlone, setOnlyAlone] = useState(false);
  const [availability, setAvailability] = useState("");

  const [selected, setSelected] = useState<Kleffer | null>(null);
  const [ludoya, setLudoya] = useState<LudoyaMember | null>(null);
  const [extended, setExtended] = useState<KlefferExtended | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    void fn({ data: undefined as never })
      .then((r) => setItems(r.kleffers as Kleffer[]))
      .finally(() => setLoading(false));
  }, [fn]);

  const open = (k: Kleffer) => {
    setSelected(k);
    setLudoya(null);
    setExtended(k.extended);
    setDetailLoading(true);
    void detailFn({ data: { id: k.id } })
      .then((r) => {
        setLudoya((r.ludoya as LudoyaMember | null) ?? null);
        setExtended((r.extended as KlefferExtended | null) ?? null);
      })
      .catch(() => setLudoya(null))
      .finally(() => setDetailLoading(false));
  };

  const filtered = items.filter((k) => {
    if (onlyLudoya && !k.ludoya_username) return false;
    if (onlyAlone && k.extended?.attends_alone !== "alone") return false;
    if (availability && !(k.extended?.availability ?? []).includes(availability)) return false;
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      k.username.toLowerCase().includes(s) ||
      (k.ludoya_username?.toLowerCase().includes(s) ?? false) ||
      (k.ludoya_display_name?.toLowerCase().includes(s) ?? false) ||
      (k.extended?.favorite_games ?? []).some((g) => g.name.toLowerCase().includes(s))
    );
  });


  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-bold">Comunidad</h1>
        <p className="text-ink/60 mt-1">
          Directorio de socios activos. {items.length} kleffers en total.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/50" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por usuario, Ludoya o juego favorito…"
            className="pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink/70 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyLudoya}
            onChange={(e) => setOnlyLudoya(e.target.checked)}
            className="accent-coral"
          />
          Solo con Ludoya
        </label>
        <label className="flex items-center gap-2 text-sm text-ink/70 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyAlone}
            onChange={(e) => setOnlyAlone(e.target.checked)}
            className="accent-coral"
          />
          Vienen solos/as
        </label>
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="h-9 rounded-md border border-ink/20 bg-card px-2 text-sm"
        >
          <option value="">Cualquier disponibilidad</option>
          {AVAILABILITY.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>


      {loading ? (
        <p className="text-ink/60">Cargando kleffers…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => open(k)}
              className="bg-card border border-ink/15 rounded-2xl p-4 flex flex-col items-center text-center hover:border-coral transition-colors"
            >
              {k.avatar_url || k.ludoya_avatar_url ? (
                <img
                  src={k.avatar_url ?? k.ludoya_avatar_url ?? ""}
                  alt={`@${k.username}`}
                  className="h-20 w-20 rounded-full object-cover border-2 border-coral"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-coral/30 flex items-center justify-center text-2xl font-bold text-ink">
                  {k.username.charAt(0).toUpperCase()}
                </div>
              )}
              <p className="mt-3 font-semibold truncate w-full">@{k.username}</p>
              {k.ludoya_username ? (
                <span className="mt-2 text-xs text-coral-deep">En Ludoya</span>
              ) : (
                <span className="mt-2 text-xs text-ink/40">Sin Ludoya</span>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-ink/50 py-8">Sin resultados.</p>
          )}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">@{selected.username}</SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-5">
                <div className="flex items-center gap-4">
                  {selected.avatar_url || selected.ludoya_avatar_url ? (
                    <img
                      src={selected.avatar_url ?? selected.ludoya_avatar_url ?? ""}
                      alt=""
                      className="h-20 w-20 rounded-full object-cover border-2 border-coral"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-coral/30 flex items-center justify-center text-2xl font-bold">
                      {selected.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-sm text-ink/70">
                    <p>
                      Socio nº <span className="font-mono font-semibold text-ink">{selected.member_number}</span>
                    </p>
                    <p>Desde {new Date(selected.created_at).toLocaleDateString("es-ES")}</p>
                  </div>
                </div>

                <section className="rounded-2xl border border-ink/15 p-4">
                  <h3 className="font-semibold mb-2">Ludoya</h3>
                  {!selected.ludoya_username ? (
                    <p className="text-sm text-ink/50">Este kleffer todavía no ha vinculado su cuenta.</p>
                  ) : detailLoading ? (
                    <p className="text-sm text-ink/50">Cargando perfil de Ludoya…</p>
                  ) : (
                    <div className="space-y-3">
                      <a
                        href={`https://app.ludoya.com/${selected.ludoya_username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-mono underline"
                      >
                        @{selected.ludoya_username} <ExternalLink className="h-3 w-3" />
                      </a>
                      {ludoya?.name && <p className="text-sm">{ludoya.name}</p>}
                      {ludoya?.stats && Object.keys(ludoya.stats).length > 0 && (
                        <ul className="grid grid-cols-2 gap-2 text-xs text-ink/70">
                          {Object.entries(ludoya.stats).map(([k, v]) => (
                            <li key={k} className="rounded-lg bg-cream-deep/50 px-2 py-1">
                              <span className="capitalize">{k}</span>: <strong>{v}</strong>
                            </li>
                          ))}
                        </ul>
                      )}
                      {ludoya && ludoya.collection.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-ink/50 mb-1">Su colección</p>
                          <div className="grid grid-cols-4 gap-2">
                            {ludoya.collection.map((g, i) => (
                              <div key={g.id ?? i} className="aspect-square rounded-lg overflow-hidden bg-cream-deep">
                                {g.imageUrl ? (
                                  <img src={g.imageUrl} alt={g.name ?? ""} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-lg">🎲</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
