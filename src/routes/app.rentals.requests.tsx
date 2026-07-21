import { createFileRoute } from "@tanstack/react-router";
import { useMyRentalsData, Empty, Row, CancelButton } from "@/components/app/rentals-mine";

export const Route = createFileRoute("/app/rentals/requests")({
  component: RequestsPage,
});

function RequestsPage() {
  const { requests, loading, cancel } = useMyRentalsData();
  if (loading) return <p className="text-muted-foreground">Cargando…</p>;
  const pending = requests.filter((r) => r.status === "pending");
  return (
    <div className="space-y-2">
      {pending.length === 0 ? (
        <Empty msg="Sin solicitudes pendientes." />
      ) : (
        pending.map((r) => (
          <Row
            key={r.id}
            title={r.bgg_games?.title ?? "Juego"}
            img={r.bgg_games?.image_url}
            sub={`${r.requested_days} días · enviada ${new Date(r.created_at).toLocaleDateString()}`}
            badge="Pendiente"
            action={<CancelButton onCancel={() => cancel(r.id)} />}
          />
        ))
      )}
    </div>
  );
}
