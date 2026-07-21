import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMyRentalsData, Empty, type RentalRow } from "@/components/app/rentals-mine";

export const Route = createFileRoute("/app/rentals/history")({
  component: HistoryPage,
});

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
}

type Group = {
  key: string;
  title: string;
  img: string | null;
  periods: RentalRow[];
};

function HistoryPage() {
  const { rentals, loading } = useMyRentalsData();

  const groups = useMemo<Group[]>(() => {
    const past = rentals.filter((r) => r.status === "returned" || r.status === "lost");
    const map = new Map<string, Group>();
    for (const r of past) {
      const title = r.bgg_games?.title ?? "Juego";
      const key = title;
      const g = map.get(key);
      if (g) {
        g.periods.push(r);
      } else {
        map.set(key, { key, title, img: r.bgg_games?.image_url ?? null, periods: [r] });
      }
    }
    // Sort each group's periods most-recent first, and groups by most recent rental
    const arr = Array.from(map.values());
    for (const g of arr) {
      g.periods.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    }
    arr.sort(
      (a, b) =>
        new Date(b.periods[0].started_at).getTime() - new Date(a.periods[0].started_at).getTime(),
    );
    return arr;
  }, [rentals]);

  if (loading) return <p className="text-muted-foreground">Cargando…</p>;
  if (groups.length === 0) return <Empty msg="Aún no tienes histórico." />;

  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <GroupCard key={g.key} group={g} />
      ))}
    </div>
  );
}

function GroupCard({ group }: { group: Group }) {
  const [open, setOpen] = useState(false);
  const multiple = group.periods.length > 1;
  const latest = group.periods[0];
  const period = (r: RentalRow) => `${fmt(r.started_at)} → ${fmt(r.returned_at ?? r.due_at)}`;

  return (
    <div className="bg-card border-2 border-ink rounded-2xl shadow-tactile-sm overflow-hidden">
      <div className="p-3 flex items-center gap-3">
        {group.img ? (
          <img src={group.img} alt="" className="h-12 w-12 rounded-lg object-cover border border-ink/20" />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-primary-soft flex items-center justify-center">🎲</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{group.title}</p>
          <p className="text-xs text-muted-foreground">
            {multiple
              ? `${group.periods.length} alquileres · último: ${period(latest)}`
              : period(latest)}
          </p>
        </div>
        {multiple ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs bg-ink text-cream px-3 py-1.5 rounded-full font-semibold hover:opacity-90"
            aria-expanded={open}
          >
            {open ? "Ocultar fechas" : "Ver fechas"}
          </button>
        ) : (
          <span className="text-xs bg-ink text-cream px-2 py-1 rounded-full font-semibold">Devuelto</span>
        )}
      </div>
      {multiple && open && (
        <ul className="border-t border-ink/10 bg-primary-soft/30 divide-y divide-ink/10">
          {group.periods.map((r) => (
            <li key={r.id} className="px-4 py-2 text-sm flex items-center justify-between">
              <span>{period(r)}</span>
              <span className="text-xs text-muted-foreground">
                {r.status === "lost" ? "Perdido" : "Devuelto"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
