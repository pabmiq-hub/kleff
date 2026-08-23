import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAllRentals, markRentalReturned } from "@/lib/rental.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/rentals/active")({
  component: ActivePage,
});

interface RentalRow {
  id: string;
  user_id: string;
  game_id: string;
  started_at: string;
  due_at: string;
  returned_at: string | null;
  status: string;
  bgg_games: { title: string; image_url: string | null } | null;
  profile?: { full_name: string; username: string; member_number: number } | null;
}

function ActivePage() {
  const listFn = useServerFn(listAllRentals);
  const returnFn = useServerFn(markRentalReturned);
  const [items, setItems] = useState<RentalRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const r = await listFn({ data: { status: "active" } });
    setItems(r.rentals as RentalRow[]);
  };

  useEffect(() => {
    setLoading(true);
    void refresh().finally(() => setLoading(false));
  }, []);

  const markReturned = async (id: string) => {
    try {
      await returnFn({ data: { id } });
      toast.success("Marcado como devuelto");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  if (loading) return <p className="text-ink/60">Cargando…</p>;

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="bg-ink/5 border border-ink/15 rounded-2xl p-8 text-center text-ink/50">
          No hay alquileres activos.
        </div>
      )}
      {items.map((r) => {
        const overdue = new Date(r.due_at) < new Date();
        return (
          <div key={r.id} className={`border rounded-2xl p-4 flex flex-wrap items-start gap-4 ${overdue ? "border-coral bg-coral/10" : "border-ink/15 bg-ink/5"}`}>
            {r.bgg_games?.image_url ? (
              <img width={64} height={64} loading="lazy" decoding="async" src={r.bgg_games.image_url} alt="" className="h-16 w-16 rounded-lg object-cover border border-ink/20" />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-coral/30 flex items-center justify-center font-bold text-ink">🎲</div>
            )}
            <div className="flex-1 min-w-[200px]">
              <p className="font-semibold">{r.bgg_games?.title ?? "Juego"}</p>
              <p className="text-xs text-ink/60">
                {r.profile && (
                  <>
                    <span className="font-mono text-coral">K-{String(r.profile.member_number).padStart(4, "0")}</span> ·{" "}
                    {r.profile.full_name}
                  </>
                )}
              </p>
              <p className="text-xs mt-1">
                <span className="text-ink/60">Inicio: {new Date(r.started_at).toLocaleDateString()} · </span>
                <span className={overdue ? "text-coral font-semibold" : "text-ink/60"}>
                  Devolución: {new Date(r.due_at).toLocaleDateString()} {overdue && "(vencido)"}
                </span>
              </p>
            </div>
            <Button size="sm" className="bg-coral hover:bg-coral-deep text-ink" onClick={() => markReturned(r.id)}>
              Marcar devuelto
            </Button>
          </div>
        );
      })}
    </div>
  );
}
