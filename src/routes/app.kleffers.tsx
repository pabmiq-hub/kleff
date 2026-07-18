import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listKleffers } from "@/lib/kleffers.functions";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/app/kleffers")({
  head: () => ({
    meta: [
      { title: "Kleffers — Zona socios" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: KleffersPage,
});

interface Kleffer {
  id: string;
  username: string;
  avatar_url: string | null;
  ludoya_username: string | null;
  member_number: number;
  created_at: string;
}

function KleffersPage() {
  const fn = useServerFn(listKleffers);
  const [items, setItems] = useState<Kleffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    void fn({ data: undefined as never })
      .then((r) => setItems(r.kleffers as Kleffer[]))
      .finally(() => setLoading(false));
  }, [fn]);

  const filtered = items.filter((k) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      k.username.toLowerCase().includes(s) ||
      (k.ludoya_username?.toLowerCase().includes(s) ?? false)
    );
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-bold">Kleffers</h1>
        <p className="text-ink/60 mt-1">
          Directorio de socios activos. {items.length} kleffers en total.
        </p>
      </header>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/50" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por usuario o Ludoya…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-ink/60">Cargando kleffers…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((k) => (
            <div
              key={k.id}
              className="bg-card border border-ink/15 rounded-2xl p-4 flex flex-col items-center text-center hover:border-coral transition-colors"
            >
              {k.avatar_url ? (
                <img
                  src={k.avatar_url}
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
                <a
                  href={`https://app.ludoya.com/users/${k.ludoya_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-coral-deep hover:underline"
                >
                  Ludoya <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="mt-2 text-xs text-ink/40">Sin Ludoya</span>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-ink/50 py-8">Sin resultados.</p>
          )}
        </div>
      )}
    </div>
  );
}
