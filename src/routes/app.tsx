import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Home, User, IdCard, Dices, LogOut, Shield, Gamepad2, Users, Sparkles, Vote, Award } from "lucide-react";
import { NotificationsBell } from "@/components/app/NotificationsBell";
import { AppLanguageSwitcher } from "@/components/app/AppLanguageSwitcher";
import { useAppLocale } from "@/i18n/app-i18n";
import { commonDict } from "@/i18n/app/common";
import { accountDict } from "@/i18n/app/account";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Zona privada — KLEFF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const { session, loading, isSuperAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { locale } = useAppLocale();
  const c = commonDict[locale];
  const t = accountDict[locale];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-deep">
        <p className="text-muted-foreground">{t.layout.loading}</p>
      </div>
    );
  }

  if (!session) {
    void navigate({ to: "/login", search: { redirect: window.location.pathname } });
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    void navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col md:flex-row">
      <aside className="md:w-64 md:shrink-0 bg-card border-b-2 md:border-b-0 md:border-r-2 border-ink p-4 md:p-6 flex md:flex-col gap-2 md:sticky md:top-0 md:h-screen z-30 md:overflow-y-auto">

        <Link to="/app" className="font-display font-bold text-xl tracking-tight mb-0 md:mb-6">
          KLEFF <span className="text-coral-deep text-sm font-sans font-semibold">socios</span>
        </Link>
        <nav className="flex md:flex-col gap-1 flex-1 ml-auto md:ml-0">
          <NavLink to="/app" icon={<Home className="h-4 w-4" />} label={c.nav.home} exact />
          <NavLink to="/app/profile" icon={<User className="h-4 w-4" />} label={c.nav.profile} />
          <NavLink to="/app/carnet" icon={<IdCard className="h-4 w-4" />} label={c.nav.card} />
          <NavLink to="/app/kleffers" icon={<Users className="h-4 w-4" />} label={c.nav.community} />
          <NavLink to="/app/partidas" icon={<Gamepad2 className="h-4 w-4" />} label={c.nav.games} />
          <NavLink to="/app/rentals" icon={<Dices className="h-4 w-4" />} label={c.nav.rentals} />
          <NavLink to="/app/votaciones" icon={<Vote className="h-4 w-4" />} label={c.nav.polls} />
          <NavLink to="/app/karma" icon={<Sparkles className="h-4 w-4" />} label={c.nav.karma} />
          <NavLink to="/app/insignias" icon={<Award className="h-4 w-4" />} label={c.nav.badges} />
        </nav>
        <div className="md:mt-auto">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start">
            <LogOut className="h-4 w-4 mr-2" /> <span className="hidden md:inline">{c.logout}</span>
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 shrink-0 z-20 bg-cream-deep/95 backdrop-blur border-b border-ink/10">

      </div>
    </div>
  );
}

function NavLink({ to, icon, label, exact }: { to: string; icon: React.ReactNode; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      activeProps={{ className: "bg-primary-soft/40 text-coral-deep" }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-soft/30 transition-colors"
    >
      {icon} <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
