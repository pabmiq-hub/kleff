// Supabase client for the ported Konektum backend functions.
//
// The Konektum tables live in the KLEFF database with a `kon_` prefix, so this
// wrapper rewrites table names transparently and lets the ported code keep its
// original queries.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const KON_TABLES = new Set([
  "crush_requests",
  "email_logs",
  "event_series",
  "event_waitlist",
  "events",
  "features",
  "game_rewards",
  "game_sessions",
  "game_votes",
  "global_participants",
  "modules",
  "organizer_branding",
  "organizer_email_connections",
  "organizer_features",
  "organizer_resend_config",
  "organizer_templates",
  "organizer_verified_domains",
  "organizers",
  "participant_avatars",
  "participant_encounters",
  "participant_exclusions",
  "participant_inclusions",
  "participant_selections",
  "participants",
  "plan_features",
  "remarketing_campaigns",
  "remarketing_recipients",
  "repeat_requests",
  "subscription_plans",
  "template_versions",
  "wrapped_profiles",
  "wrapped_table_requests",
]);

// Public (anon-readable) views live under their own `kon_*_public` names.
const PUBLIC_VIEWS: Record<string, string> = {
  events_public: "kon_events_public",
  organizers_public: "kon_organizers_public",
  organizer_branding_public: "kon_organizer_branding_public",
};

const VIEW_ALIASES: Record<string, string> = {};

export function konTable(name: string): string {
  const publicView = PUBLIC_VIEWS[name];
  if (publicView) return publicView;
  const resolved = VIEW_ALIASES[name] ?? name;
  return KON_TABLES.has(resolved) ? `kon_${resolved}` : resolved;
}

/** Drop-in replacement for the Deno `createClient` used by the original functions. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(url: string, key: string, options?: any): any {
  const base = createSupabaseClient(url, key, options) as any;
  return new Proxy(base, {
    get(target, prop, receiver) {
      if (prop === "from") {
        return (table: string) => target.from(konTable(table));
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
