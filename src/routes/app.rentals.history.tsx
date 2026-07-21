import { createFileRoute } from "@tanstack/react-router";
import { useMyRentalsData, Empty, Row, statusLabel } from "@/components/app/rentals-mine";

export const Route = createFileRoute("/app/rentals/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { rentals, requests, loading } = useMyRentalsData();
  if (loading) return <p className="text-muted-foreground">Cargando…</p>;
  const past = rentals.filter((r) => r.status === "returned");
  const decided = requests.filter((r) => r.status !== "pending");
  if (past.length === 0 && decided.length === 0) return <Empty msg="Aún no tienes histórico." />;
  return (
    <div className="space-y-2">
      {past.map((r) => (
        <Row
          key={r.id}
          title={r.bgg_games?.title ?? "Juego"}
          img={r.bgg_games?.image_url}
          sub={`Devuelto el ${r.returned_at ? new Date(r.returned_at).toLocaleDateString() : "—"}`}
          badge="Devuelto"
        />
      ))}
      {decided.map((r) => (
        <Row
          key={r.id}
          title={r.bgg_games?.title ?? "Juego"}
          img={r.bgg_games?.image_url}
          sub={r.decision_note ?? `Solicitud ${statusLabel[r.status]?.toLowerCase()}`}
          badge={statusLabel[r.status]}
        />
      ))}
    </div>
  );
}
