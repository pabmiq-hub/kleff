import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMyRentalRequests, listMyRentals, cancelRentalRequest } from "@/lib/rental.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface ReqRow {
  id: string;
  status: string;
  requested_days: number;
  created_at: string;
  decision_note: string | null;
  bgg_games: { title: string; image_url: string | null } | null;
}

export interface RentalRow {
  id: string;
  status: string;
  started_at: string;
  due_at: string;
  returned_at: string | null;
  bgg_games: { title: string; image_url: string | null } | null;
}

export const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
  active: "En curso",
  returned: "Devuelto",
  overdue: "Vencido",
  lost: "Perdido",
};

export function useMyRentalsData() {
  const reqFn = useServerFn(listMyRentalRequests);
  const rentFn = useServerFn(listMyRentals);
  const cancelFn = useServerFn(cancelRentalRequest);
  const [requests, setRequests] = useState<ReqRow[]>([]);
  const [rentals, setRentals] = useState<RentalRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [a, b] = await Promise.all([
      reqFn({ data: undefined as never }),
      rentFn({ data: undefined as never }),
    ]);
    setRequests(a.requests as ReqRow[]);
    setRentals(b.rentals as RentalRow[]);
  };

  useEffect(() => {
    setLoading(true);
    void refresh().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return { requests, rentals, loading, cancel };
}

export function Empty({ msg }: { msg: string }) {
  return <div className="bg-card border-2 border-ink/10 rounded-2xl p-4 text-sm text-muted-foreground">{msg}</div>;
}

export function Row({
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

export function CancelButton({ onCancel }: { onCancel: () => void }) {
  return (
    <Button size="sm" variant="ghost" onClick={onCancel}>
      Cancelar
    </Button>
  );
}
