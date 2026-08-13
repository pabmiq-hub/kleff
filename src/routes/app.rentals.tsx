import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useAppLocale } from "@/i18n/app-i18n";
import { rentalsDict } from "@/i18n/app/rentals";

export const Route = createFileRoute("/app/rentals")({
  component: RentalsLayout,
});

function RentalsLayout() {
  const { locale } = useAppLocale();
  const t = rentalsDict[locale];
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground mt-1">{t.subtitle}</p>
      </header>
      <nav className="flex flex-wrap gap-1 border-b border-ink/15">
        <TabLink to="/app/rentals" exact label={t.tabs.catalog} />
        <TabLink to="/app/rentals/active" label={t.tabs.active} />
        <TabLink to="/app/rentals/requests" label={t.tabs.requests} />
        <TabLink to="/app/rentals/history" label={t.tabs.history} />
      </nav>
      <Outlet />
    </div>
  );
}

function TabLink({ to, label, exact }: { to: string; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      activeProps={{ className: "border-coral text-ink" }}
      className="px-4 py-2 text-sm font-semibold text-ink/60 border-b-2 border-transparent hover:text-ink hover:border-ink/30 -mb-px"
    >
      {label}
    </Link>
  );
}
