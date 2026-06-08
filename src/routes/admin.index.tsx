import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminKpis } from "@/lib/rental.functions";
import { Users, Mail, Inbox, Dices } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

interface Kpis {
  members: number;
  pendingInvitations: number;
  pendingRequests: number;
  activeRentals: number;
}

function AdminHome() {
  const fn = useServerFn(getAdminKpis);
  const [kpis, setKpis] = useState<Kpis | null>(null);

  useEffect(() => {
    void fn({ data: undefined as never }).then(setKpis).catch(() => setKpis({ members: 0, pendingInvitations: 0, pendingRequests: 0, activeRentals: 0 }));
  }, [fn]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl font-bold">Resumen</h1>
        <p className="text-ink/60 mt-1">Vista general del club.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard to="/admin/members" icon={<Users className="h-5 w-5" />} label="Socios" value={kpis?.members} />
        <KpiCard to="/admin/invitations" icon={<Mail className="h-5 w-5" />} label="Invitaciones pendientes" value={kpis?.pendingInvitations} />
        <KpiCard to="/admin/rentals" icon={<Inbox className="h-5 w-5" />} label="Solicitudes pendientes" value={kpis?.pendingRequests} highlight={(kpis?.pendingRequests ?? 0) > 0} />
        <KpiCard to="/admin/rentals" icon={<Dices className="h-5 w-5" />} label="Alquileres activos" value={kpis?.activeRentals} />
      </div>
    </div>
  );
}

function KpiCard({
  to,
  icon,
  label,
  value,
  highlight,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  value?: number;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`block rounded-2xl border p-5 transition-colors ${
        highlight
          ? "border-coral bg-coral/15 hover:bg-coral/20"
          : "border-ink/15 bg-ink/5 hover:bg-ink/10"
      }`}
    >
      <div className="flex items-center gap-2 text-ink/70 text-xs font-semibold uppercase tracking-wide">
        {icon} {label}
      </div>
      <p className="font-display text-4xl font-bold mt-2">{value ?? "—"}</p>
    </Link>
  );
}
