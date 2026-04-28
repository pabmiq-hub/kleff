import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/auth/AuthProvider";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

function AppHome() {
  const { user, isSuperAdmin } = useAuth();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Hola 👋</h1>
        <p className="text-muted-foreground mt-1">
          {user?.email} {isSuperAdmin && <span className="ml-2 inline-flex items-center rounded-full bg-coral text-cream px-2 py-0.5 text-xs font-bold">Super Admin</span>}
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm">
          <h2 className="font-display font-bold text-lg mb-1">Carnet de Kleffer</h2>
          <p className="text-sm text-muted-foreground">Próximamente — tu carnet digital de socio.</p>
        </div>
        <div className="bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm">
          <h2 className="font-display font-bold text-lg mb-1">Alquiler de juegos</h2>
          <p className="text-sm text-muted-foreground">Próximamente — alquila juegos del catálogo de KLEFF.</p>
        </div>
      </div>
    </div>
  );
}
