import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAllRentalRequests, decideRentalRequest } from "@/lib/rental.functions";
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
  pickup_date: string | null;
  return_date: string | null;
  waitlist_position: number | null;
  bgg_games: { title: string; image_url: string | null; total_copies: number | null } | null;
  profile?: { full_name: string; username: string; member_number: number } | null;
}

function RequestsPage() {
  const listFn = useServerFn(listAllRentalRequests);
  const decideFn = useServerFn(decideRentalRequest);
  const [pending, setPending] = useState<ReqRow[]>([]);
  const [waitlist, setWaitlist] = useState<ReqRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [p, w] = await Promise.all([
      listFn({ data: { status: "pending" } }),
      listFn({ data: { status: "waitlisted" } }),
    ]);
    setPending(p.requests as ReqRow[]);
    setWaitlist(w.requests as ReqRow[]);
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

  const pendingByNight = useMemo(() => groupByDate(pending), [pending]);
  const waitlistByNight = useMemo(() => groupByDate(waitlist), [waitlist]);

  if (loading) return <p className="text-cream/60">Cargando…</p>;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-xl font-bold mb-3">Pendientes por noche de juego</h2>
        {pendingByNight.length === 0 ? (
          <Empty msg="No hay solicitudes pendientes." />
        ) : (
          pendingByNight.map(([date, rows]) => (
            <div key={date} className="mb-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cream/70 mb-2">
                {date === "—" ? "Sin fecha" : new Date(date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <div className="space-y-2">
                {rows.map((r) => (
                  <Row key={r.id} r={r} approvedSoFar={countApproved(rows, r.game_id)} onDecide={decide} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold mb-3">Lista de espera</h2>
        {waitlistByNight.length === 0 ? (
          <Empty msg="Sin lista de espera." />
        ) : (
          waitlistByNight.map(([date, rows]) => (
            <div key={date} className="mb-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cream/70 mb-2">
                {date === "—" ? "Sin fecha" : new Date(date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <div className="space-y-2">
                {rows.map((r) => (
                  <Row key={r.id} r={r} approvedSoFar={0} onDecide={decide} waitlist />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function groupByDate(rows: ReqRow[]): Array<[string, ReqRow[]]> {
  const map = new Map<string, ReqRow[]>();
  for (const r of rows) {
    const k = r.pickup_date ?? "—";
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function countApproved(rows: ReqRow[], gameId: string): number {
  return rows.filter((x) => x.game_id === gameId).length;
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="bg-cream/5 border border-cream/15 rounded-2xl p-8 text-center text-cream/50">{msg}</div>
  );
}

function Row({
  r,
  approvedSoFar,
  onDecide,
  waitlist,
}: {
  r: ReqRow;
  approvedSoFar: number;
  onDecide: (id: string, d: "approved" | "rejected") => void;
  waitlist?: boolean;
}) {
  const total = r.bgg_games?.total_copies ?? 1;
  const conflict = !waitlist && approvedSoFar > total;
  return (
    <div className="bg-cream/5 border border-cream/15 rounded-2xl p-4 flex flex-wrap items-start gap-4">
      {r.bgg_games?.image_url ? (
        <img src={r.bgg_games.image_url} alt="" className="h-16 w-16 rounded-lg object-cover border border-cream/20" />
      ) : (
        <div className="h-16 w-16 rounded-lg bg-coral/30 flex items-center justify-center font-bold text-cream">🎲</div>
      )}
      <div className="flex-1 min-w-[200px]">
        <p className="font-semibold flex items-center gap-2">
          {r.bgg_games?.title ?? "Juego"}
          <span className="text-[10px] font-mono bg-cream/10 px-1.5 py-0.5 rounded">
            {approvedSoFar}/{total} solicitada{total === 1 ? "" : "s"}
          </span>
          {waitlist && r.waitlist_position && (
            <span className="text-[10px] font-bold bg-coral text-cream px-1.5 py-0.5 rounded">
              espera #{r.waitlist_position}
            </span>
          )}
          {conflict && (
            <span className="text-[10px] font-bold bg-red-500 text-cream px-1.5 py-0.5 rounded">
              Sin copia
            </span>
          )}
        </p>
        <p className="text-xs text-cream/60">
          {r.profile && (
            <>
              <span className="font-mono text-coral">K-{String(r.profile.member_number).padStart(4, "0")}</span> ·{" "}
              {r.profile.full_name} (@{r.profile.username})
            </>
          )}
        </p>
        <p className="text-xs text-cream/60 mt-1">
          {r.pickup_date ? `Recoge ${r.pickup_date} → devuelve ${r.return_date ?? "?"}` : `${r.requested_days} días`} ·
          solicitada {new Date(r.created_at).toLocaleDateString()}
        </p>
        {r.message && <p className="text-sm text-cream/70 mt-2 italic">"{r.message}"</p>}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" className="text-cream/70 hover:text-cream hover:bg-cream/10" onClick={() => onDecide(r.id, "rejected")}>
          Rechazar
        </Button>
        <Button size="sm" className="bg-coral hover:bg-coral-deep text-cream" onClick={() => onDecide(r.id, "approved")}>
          {waitlist ? "Asignar copia" : "Aprobar"}
        </Button>
      </div>
    </div>
  );
}
