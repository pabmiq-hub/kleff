import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type P = { id: string; name: string; payment_status?: string | null; paid_at?: string | null; cancelled_at?: string | null; checked_in?: boolean | null };

function sortPaid(list: P[]) {
  return list
    .filter((p) => p.payment_status === "paid" || p.payment_status === "refunded")
    .sort((a, b) => (b.paid_at ? Date.parse(b.paid_at) : 0) - (a.paid_at ? Date.parse(a.paid_at) : 0));
}

function Section({ title, rows }: { title: string; rows: P[] }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title} <span className="text-muted-foreground font-normal">({rows.length})</span></h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nadie</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {rows.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="truncate">{p.name}{p.payment_status === "refunded" && <span className="ml-2 text-xs text-muted-foreground">↩ Devuelto</span>}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {p.paid_at ? new Date(p.paid_at).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" }) : "Sin fecha"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function PaymentsHistoryDialog({ open, onOpenChange, participants }: { open: boolean; onOpenChange: (o: boolean) => void; participants: P[] }) {
  const active = participants.filter((p) => !p.cancelled_at);
  const checkin = sortPaid(active.filter((p) => p.checked_in));
  const bench = sortPaid(active.filter((p) => !p.checked_in));
  const bajas = sortPaid(participants.filter((p) => p.cancelled_at));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pagos</DialogTitle>
          <DialogDescription>Fecha en que se marcó cada pago, de más reciente a más antiguo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <Section title="Check-in" rows={checkin} />
          <Section title="Banco" rows={bench} />
          <Section title="Bajas" rows={bajas} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
