import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acceso socios — KLEFF" },
      { name: "description", content: "Acceso a la zona privada de socios de KLEFF." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const { session, loading, isSuperAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Persisted session (cookie) — react once roles are resolved.
  if (!loading && session && !submitting) {
    const dest = redirect || (isSuperAdmin ? "/admin" : "/app");
    void navigate({ to: dest });
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
      toast.error("Email o contraseña incorrectos");
      return;
    }
    // Resolve role synchronously so we don't depend on the context effect
    // (which runs after this navigate and would race to /app).
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "super_admin");
    toast.success("Bienvenido");
    void navigate({ to: redirect || (isAdmin ? "/admin" : "/app") });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-deep px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <span className="font-display font-bold text-3xl tracking-tight text-foreground">KLEFF</span>
          <p className="text-sm text-muted-foreground mt-1">Zona privada de socios</p>
        </Link>

        <div className="bg-card rounded-2xl border-2 border-ink shadow-tactile p-8">
          <h1 className="font-display text-2xl font-bold mb-1">Acceder</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Introduce tu correo y contraseña.
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
              {submitting ? "Accediendo…" : "Acceder"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-6 text-center">
            ¿Sin cuenta? Pide una invitación al equipo de KLEFF.
          </p>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Volver a la web
          </Link>
        </div>
      </div>
    </div>
  );
}
