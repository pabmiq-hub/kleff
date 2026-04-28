import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/auth/AuthProvider";

export const Route = createFileRoute("/app/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isSuperAdmin, loading } = useAuth();
  const navigate = useNavigate();
  if (loading) return <p>Cargando…</p>;
  if (!isSuperAdmin) {
    void navigate({ to: "/app" });
    return null;
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b-2 border-ink/15 pb-4">
        <h1 className="font-display text-3xl font-bold">Panel admin</h1>
        <nav className="flex gap-2 ml-auto">
          <Link to="/app/admin" activeOptions={{ exact: true }} activeProps={{ className: "underline decoration-coral decoration-2 underline-offset-4" }} className="text-sm font-semibold">Resumen</Link>
          <Link to="/app/admin/invitations" activeProps={{ className: "underline decoration-coral decoration-2 underline-offset-4" }} className="text-sm font-semibold">Invitaciones</Link>
          <Link to="/app/admin/users" activeProps={{ className: "underline decoration-coral decoration-2 underline-offset-4" }} className="text-sm font-semibold">Usuarios</Link>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
