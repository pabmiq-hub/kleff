import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMyRentalRequests, listMyRentals, cancelRentalRequest } from "@/server/rental.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/app/rentals/mine")({
  component: MyRentalsPage,
});

interface ReqRow {
  id: string;
  status: string;
  requested_days: number;
  created_at: string;
  decision_note: string | null;
  rental_games: { title: string; image_url: string | null } | null;
}

interface RentalRow {
  id: string;
  status: string;
  started_at: string;
  due_at: string;
  returned_at: string | null;
  rental_games: { title: string; image_url: string | null } | null;
}

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
  active: "En curso",
  returned: "Devuelto",
  overdue: "Vencido",
  lost: "Perdido",
};

function MyRentalsPage() {
  const reqFn = useServerFn(listMyRentalRequests);
  const rentFn = useServerFn(listMyRentals);
  const cancelFn = useServerFn(cancelRentalRequest);
  const [requests, setRequests] = useState<ReqRow[]>([]);
  const [rentals, setRentals] = useState<RentalRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [a, b] = await Promise.all([reqFn({ data: undefined as never }), rentFn({ data: undefined as never })]);
    setRequests(a.requests as ReqRow[]);
    setRentals(b.rentals as RentalRow[]);
  };

  useEffect(() => {
    setLoading(true);
    void refresh().finally(() => setLoading(false));
  }, []);

  const cancel = async (id: string) => {
    try {
      await cancelFn({ data: { id } });
      toast.success("Solicitud cancelada");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  if (loading) return <p className="text-muted-foreground">Cargando…</p>;

  const activeRentals = rentals.filter((r) => r.status === "active" || r.status === "overdue");
  const pastRentals = rentals.filter((r) => r.status === "returned");
  const pendingReq = requests.filter((r) => r.status === "pending");
  const decidedReq = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Mis alquileres</h1>
      </header>

      <Section title="Activos">
        {activeRentals.length === 0 ? (
          <Empty msg="No tienes juegos alquilados ahora mismo." />
        ) : (
          activeRentals.map((r) => (
            <Row key={r.id} title={r.rental_games?.title ?? "Juego"} img={r.rental_games?.image_url} sub={`Devolución: ${new Date(r.due_at).toLocaleDateString()}`} badge={statusLabel[r.status]} />
          ))
        )}
      </Section>

      <Section title="Solicitudes pendientes">
        {pendingReq.length === 0 ? (
          <Empty msg="Sin solicitudes pendientes." />
        ) : (
          pendingReq.map((r) => (
            <Row
              key={r.id}
              title={r.rental_games?.title ?? "Juego"}
              img={r.rental_games?.image_url}
              sub={`${r.requested_days} días · enviada ${new Date(r.created_at).toLocaleDateString()}`}
              badge="Pendiente"
              action={
                <Button size="sm" variant="ghost" onClick={() => cancel(r.id)}>
                  Cancelar
                </Button>
              }
            />
          ))
        )}
      </Section>

      <Section title="Histórico">
        {pastRentals.length === 0 && decidedReq.length === 0 ? (
          <Empty msg="Aún no tienes histórico." />
        ) : (
          <>
            {pastRentals.map((r) => (
              <Row key={r.id} title={r.rental_games?.title ?? "Juego"} img={r.rental_games?.image_url} sub={`Devuelto el ${r.returned_at ? new Date(r.returned_at).toLocaleDateString() : "—"}`} badge="Devuelto" />
            ))}
            {decidedReq.map((r) => (
              <Row key={r.id} title={r.rental_games?.title ?? "Juego"} img={r.rental_games?.image_url} sub={r.decision_note ?? `Solicitud ${statusLabel[r.status]?.toLowerCase()}`} badge={statusLabel[r.status]} />
            ))}
          </>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display font-bold text-xl mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="bg-card border-2 border-ink/10 rounded-2xl p-4 text-sm text-muted-foreground">{msg}</div>;
}

function Row({
  title,
  img,
  sub,
  badge,
  action,
}: {
  title: string;
  img?: string | null;
  sub: string;
  badge: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-card border-2 border-ink rounded-2xl p-3 flex items-center gap-3 shadow-tactile-sm">
      {img ? (
        <img src={img} alt="" className="h-12 w-12 rounded-lg object-cover border border-ink/20" />
      ) : (
        <div className="h-12 w-12 rounded-lg bg-primary-soft flex items-center justify-center">🎲</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <span className="text-xs bg-ink text-cream px-2 py-1 rounded-full font-semibold">{badge}</span>
      {action}
    </div>
  );
}
