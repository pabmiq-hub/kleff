import { createFileRoute } from "@tanstack/react-router";
import { FeaturedGamesCard } from "@/components/app/FeaturedGamesCard";
import { EventsCalendarCard } from "@/components/app/EventsCalendarCard";
import { ActivePollsCard } from "@/components/app/ActivePollsCard";
import { VolunteerCard } from "@/components/app/VolunteerCard";
import { MemberHeroCard } from "@/components/app/MemberHeroCard";
import { BadgesStripCard } from "@/components/app/BadgesStripCard";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

function AppHome() {
  return (
    <div className="space-y-6">
      <MemberHeroCard />
      <BadgesStripCard />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-6">
          <VolunteerCard />
          <ActivePollsCard />
        </div>
        <div className="lg:col-span-8">
          <EventsCalendarCard />
        </div>
      </div>

      <FeaturedGamesCard />
    </div>
  );
}
