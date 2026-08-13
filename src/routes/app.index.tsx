import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/auth/AuthProvider";
import { IdCard, Dices, Gamepad2, Users } from "lucide-react";
import { FeaturedGamesCard } from "@/components/app/FeaturedGamesCard";
import { ActivePollsCard } from "@/components/app/ActivePollsCard";
import { VolunteerCard } from "@/components/app/VolunteerCard";
import { useAppLocale } from "@/i18n/app-i18n";
import { accountDict } from "@/i18n/app/account";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

function AppHome() {
  const { user } = useAuth();
  const { locale } = useAppLocale();
  const t = accountDict[locale];
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">{t.home.greeting}</h1>
        <p className="text-muted-foreground mt-1">{user?.email}</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickCard to="/app/carnet" icon={<IdCard className="h-5 w-5" />} title={t.home.cardCarnetTitle} desc={t.home.cardCarnetDesc} />
        <QuickCard to="/app/kleffers" icon={<Users className="h-5 w-5" />} title={t.home.cardCommunityTitle} desc={t.home.cardCommunityDesc} />
        <QuickCard to="/app/partidas" icon={<Gamepad2 className="h-5 w-5" />} title={t.home.cardGamesTitle} desc={t.home.cardGamesDesc} />
        <QuickCard to="/app/rentals" icon={<Dices className="h-5 w-5" />} title={t.home.cardRentalsTitle} desc={t.home.cardRentalsDesc} />
      </div>

      <FeaturedGamesCard />
      <ActivePollsCard />
      <VolunteerCard />
    </div>
  );
}

function QuickCard({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm hover:shadow-tactile transition-shadow">
      <div className="flex items-center gap-2 text-coral-deep font-semibold">
        {icon} {title}
      </div>
      <p className="text-sm text-muted-foreground mt-2">{desc}</p>
    </Link>
  );
}
