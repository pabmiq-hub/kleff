import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { getMyAdminAccess, type AdminAccess } from "@/lib/permissions.functions";
import { adminLandingPath } from "@/lib/admin-landing";

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
  const fetchAccess = useServerFn(getMyAdminAccess);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    if (loading || !session || isSuperAdmin) return;
    let alive = true;
    setAccessChecked(false);
    void fetchAccess()
      .then((a) => { if (alive) setAccess(a as AdminAccess); })
      .catch(() => { if (alive) setAccess(null); })
      .finally(() => { if (alive) setAccessChecked(true); });
    return () => { alive = false; };
  }, [loading, session, isSuperAdmin, fetchAccess]);

  // Already logged in
  if (!loading && session) {
    if (isSuperAdmin) {
      void navigate({ to: redirect || "/admin" });
      return null;
    }
    if (!accessChecked) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-ink px-4">
          <p className="text-cream/70">Comprobando permisos…</p>
        </div>
      );
    }
    const landing = adminLandingPath(access);
    if (landing) {
      const target = redirect && redirect.startsWith("/admin/") && redirect !== "/admin/" ? redirect : landing;
      void navigate({ to: target });
      return null;
    }
    // Logged in without admin permissions — show notice
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink px-4">
        <div className="w-full max-w-md bg-card rounded-2xl border-2 border-ink shadow-tactile p-8 text-center">
          <Shield className="h-10 w-10 mx-auto text-coral-deep mb-3" />
          <h1 className="font-display text-2xl font-bold mb-2">Acceso restringido</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Tu cuenta no tiene permisos de administración activos.
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
    let a: AdminAccess | null = null;
    try {
      a = (await fetchAccess()) as AdminAccess;
    } catch {
      a = null;
    }
    const landing = adminLandingPath(a);
    if (!landing) {
      await supabase.auth.signOut();
      setSubmitting(false);
      toast.error("Esta cuenta no tiene permisos de administración");
      return;
    }
    setSubmitting(false);
    toast.success("Bienvenido al panel de administración");
    void navigate({ to: a?.isSuperAdmin ? (redirect || "/admin") : landing });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <span className="font-display font-bold text-3xl tracking-tight text-cream">KLEFF</span>
          <p className="text-sm text-cream/60 mt-1 flex items-center justify-center gap-1">
            <Shield className="h-3.5 w-3.5" /> Acceso a administración
          </p>
        </Link>

        <div className="bg-card rounded-2xl border-2 border-coral shadow-tactile p-8">
          <h1 className="font-display text-2xl font-bold mb-1">Panel de administración</h1>
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
