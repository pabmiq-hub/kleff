import { createFileRoute } from "@tanstack/react-router";
import { useMyRentalsData, Empty, Row, statusLabel } from "@/components/app/rentals-mine";

export const Route = createFileRoute("/app/rentals/active")({
  component: ActivePage,
});

function ActivePage() {
  const { rentals, loading } = useMyRentalsData();
  if (loading) return <p className="text-muted-foreground">Cargando…</p>;
  const active = rentals.filter((r) => r.status === "active" || r.status === "overdue");
  return (
    <div className="space-y-2">
      {active.length === 0 ? (
        <Empty msg="No tienes juegos alquilados ahora mismo." />
      ) : (
        active.map((r) => (
          <Row
            key={r.id}
            title={r.bgg_games?.title ?? "Juego"}
            img={r.bgg_games?.image_url}
            sub={`Devolución: ${new Date(r.due_at).toLocaleDateString()}`}
            badge={statusLabel[r.status]}
          />
        ))
      )}
    </div>
  );
}
