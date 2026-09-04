/**
 * Konektum data access.
 *
 * The Konektum tables live inside the KLEFF database with a `kon_` prefix.
 * This proxy lets the ported Konektum code keep using its original table
 * names (`events`, `participants`, …) without touching every query.
 */
import { supabase as baseClient } from "@/integrations/supabase/client";

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

/** Public read-only views of the original project map onto the base tables. */
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

type InvokeResult = { data: any; error: any };

type LooseClient = {
  from: (table: string) => any;
  rpc: (fn: string, args?: unknown, opts?: unknown) => any;
  auth: typeof baseClient.auth;
  storage: typeof baseClient.storage;
  functions: { invoke: (name: string, options?: { body?: unknown; headers?: Record<string, string> }) => Promise<InvokeResult> };
  channel: typeof baseClient.channel;
  removeChannel: typeof baseClient.removeChannel;
};

const client = baseClient as unknown as Omit<LooseClient, "functions">;

/**
 * The original Konektum edge functions now live inside KLEFF as server routes
 * under `/api/public/kon/<name>`. Calls keep the `functions.invoke` shape.
 */
async function invoke(
  name: string,
  options?: { body?: unknown; headers?: Record<string, string> },
): Promise<InvokeResult> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json", ...(options?.headers ?? {}) };
    if (!headers["Authorization"]) {
      const { data } = await baseClient.auth.getSession();
      const token = data.session?.access_token;
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`/api/public/kon/${name}`, {
      method: "POST",
      headers,
      body: JSON.stringify(options?.body ?? {}),
    });
    const text = await res.text();
    let payload: any = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }
    if (!res.ok) {
      return {
        data: null,
        error: {
          message: payload?.error ?? payload?.message ?? `Request failed (${res.status})`,
          status: res.status,
          context: { status: res.status, body: payload },
        },
      };
    }
    return { data: payload, error: null };
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : "Network error" } };
  }
}

export const supabase: LooseClient = {
  from: (table: string) => client.from(konTable(table)),
  rpc: (fn: string, args?: unknown, opts?: unknown) => client.rpc(fn, args as never, opts as never),
  auth: client.auth,
  storage: client.storage,
  functions: { invoke },
  channel: client.channel.bind(baseClient),
  removeChannel: client.removeChannel.bind(baseClient),
};

export default supabase;

