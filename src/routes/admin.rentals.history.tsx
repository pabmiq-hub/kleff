import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAllRentals } from "@/server/rental.functions";

export const Route = createFileRoute("/admin/rentals/history")({
  component: HistoryPage,
});

interface RentalRow {
  id: string;
  started_at: string;
  due_at: string;
  returned_at: string | null;
  status: string;
  bgg_games: { title: string; image_url: string | null } | null;
  profile?: { full_name: string; member_number: number } | null;
}

function HistoryPage() {
  const listFn = useServerFn(listAllRentals);
  const [items, setItems] = useState<RentalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listFn({ data: { status: "returned" } })
      .then((r) => setItems(r.rentals as RentalRow[]))
      .finally(() => setLoading(false));
  }, [listFn]);

  if (loading) return <p className="text-cream/60">Cargando…</p>;

  return (
    <div className="bg-cream/5 border border-cream/15 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-cream/10 text-cream/70 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3">Juego</th>
            <th className="text-left px-4 py-3">Socio</th>
            <th className="text-left px-4 py-3">Inicio</th>
            <th className="text-left px-4 py-3">Devolución</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-cream/50">Sin histórico todavía.</td>
            </tr>
          )}
          {items.map((r) => (
            <tr key={r.id} className="border-t border-cream/10">
              <td className="px-4 py-3">{r.bgg_games?.title ?? "—"}</td>
              <td className="px-4 py-3">
                {r.profile && (
                  <>
                    <span className="font-mono text-coral text-xs">K-{String(r.profile.member_number).padStart(4, "0")}</span>{" "}
                    {r.profile.full_name}
                  </>
                )}
              </td>
              <td className="px-4 py-3 text-cream/70">{new Date(r.started_at).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-cream/70">{r.returned_at ? new Date(r.returned_at).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
