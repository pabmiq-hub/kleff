import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAllRentalRequests, decideRentalRequest } from "@/server/rental.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/rentals/")({
  component: RequestsPage,
});

interface ReqRow {
  id: string;
  user_id: string;
  game_id: string;
  requested_days: number;
  message: string | null;
  status: string;
  created_at: string;
  rental_games: { title: string; image_url: string | null } | null;
  profile?: { full_name: string; username: string; member_number: number } | null;
}

function RequestsPage() {
  const listFn = useServerFn(listAllRentalRequests);
  const decideFn = useServerFn(decideRentalRequest);
  const [items, setItems] = useState<ReqRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const r = await listFn({ data: { status: "pending" } });
    setItems(r.requests as ReqRow[]);
  };

  useEffect(() => {
    setLoading(true);
    void refresh().finally(() => setLoading(false));
  }, []);

  const decide = async (id: string, decision: "approved" | "rejected") => {
    try {
      await decideFn({ data: { id, decision } });
      toast.success(decision === "approved" ? "Aprobada" : "Rechazada");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  if (loading) return <p className="text-cream/60">Cargando…</p>;

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="bg-cream/5 border border-cream/15 rounded-2xl p-8 text-center text-cream/50">
          No hay solicitudes pendientes.
        </div>
      )}
      {items.map((r) => (
        <div key={r.id} className="bg-cream/5 border border-cream/15 rounded-2xl p-4 flex flex-wrap items-start gap-4">
          {r.rental_games?.image_url ? (
            <img src={r.rental_games.image_url} alt="" className="h-16 w-16 rounded-lg object-cover border border-cream/20" />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-coral/30 flex items-center justify-center font-bold text-cream">🎲</div>
          )}
          <div className="flex-1 min-w-[200px]">
            <p className="font-semibold">{r.rental_games?.title ?? "Juego"}</p>
            <p className="text-xs text-cream/60">
              {r.profile && (
                <>
                  <span className="font-mono text-coral">K-{String(r.profile.member_number).padStart(4, "0")}</span> ·{" "}
                  {r.profile.full_name} (@{r.profile.username})
                </>
              )}
            </p>
            <p className="text-xs text-cream/60 mt-1">
              {r.requested_days} días · solicitada {new Date(r.created_at).toLocaleDateString()}
            </p>
            {r.message && <p className="text-sm text-cream/70 mt-2 italic">"{r.message}"</p>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="text-cream/70 hover:text-cream hover:bg-cream/10" onClick={() => decide(r.id, "rejected")}>
              Rechazar
            </Button>
            <Button size="sm" className="bg-coral hover:bg-coral-deep text-cream" onClick={() => decide(r.id, "approved")}>
              Aprobar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
