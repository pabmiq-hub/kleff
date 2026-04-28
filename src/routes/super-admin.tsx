import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield } from "lucide-react";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/super-admin")({
  head: () => ({
    meta: [
      { title: "Super Admin — KLEFF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: searchSchema,
  component: SuperAdminLoginPage,
});

function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const { session, isSuperAdmin, loading, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in
  if (!loading && session) {
    if (isSuperAdmin) {
      void navigate({ to: redirect || "/admin" });
      return null;
    }
    // Logged in as a non-admin user — show notice
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink px-4">
        <div className="w-full max-w-md bg-card rounded-2xl border-2 border-ink shadow-tactile p-8 text-center">
          <Shield className="h-10 w-10 mx-auto text-coral-deep mb-3" />
          <h1 className="font-display text-2xl font-bold mb-2">Acceso restringido</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Tu cuenta no tiene permisos de super administrador.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => { void signOut(); }}>
              Cerrar sesión
            </Button>
            <Button onClick={() => navigate({ to: "/app" })}>Ir a mi zona</Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error || !data.user) {
      setSubmitting(false);
      toast.error("Credenciales incorrectas");
      return;
    }
    // Verify super_admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const hasAdmin = (roles ?? []).some((r) => r.role === "super_admin");
    if (!hasAdmin) {
      await supabase.auth.signOut();
      setSubmitting(false);
      toast.error("Esta cuenta no tiene permisos de super administrador");
      return;
    }
    setSubmitting(false);
    toast.success("Bienvenido al panel de administración");
    void navigate({ to: redirect || "/admin" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <span className="font-display font-bold text-3xl tracking-tight text-cream">KLEFF</span>
          <p className="text-sm text-cream/60 mt-1 flex items-center justify-center gap-1">
            <Shield className="h-3.5 w-3.5" /> Acceso super administrador
          </p>
        </Link>

        <div className="bg-card rounded-2xl border-2 border-coral shadow-tactile p-8">
          <h1 className="font-display text-2xl font-bold mb-1">Panel super admin</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Acceso reservado al equipo de KLEFF.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Verificando…" : "Acceder al panel"}
            </Button>
          </form>
        </div>

        <div className="text-center mt-6 space-y-1">
          <Link to="/login" className="block text-sm text-cream/70 hover:text-cream">
            ¿Eres socio? Acceder como usuario
          </Link>
          <Link to="/" className="block text-sm text-cream/50 hover:text-cream/80">
            ← Volver a la web
          </Link>
        </div>
      </div>
    </div>
  );
}
