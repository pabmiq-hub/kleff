/**
 * Runtime override that makes the app connect to the owner's Supabase
 * project (APP_SUPABASE_*) instead of the Lovable-managed one.
 *
 * Browser: Vite replaces import.meta.env.VITE_SUPABASE_* via defineConfig
 * (see vite.config.ts), so no process.env access happens there.
 *
 * Server: process.env.SUPABASE_* is shadowed with APP_SUPABASE_* values.
 *
 * IMPORTANT: on the production Worker runtime, `process.env` is a proxy that
 * reads from the per-request environment (`globalThis.__env__`), which is
 * (re)assigned on every request. A one-off override at module load is
 * therefore invisible to request handlers. `applySupabaseEnvOverride()` must
 * run at the start of EVERY request (see the request middleware in
 * src/start.ts) in addition to the module-load call below.
 */

const OVERRIDES: Array<[target: string, source: string]> = [
  ["SUPABASE_URL", "APP_SUPABASE_URL"],
  ["SUPABASE_PUBLISHABLE_KEY", "APP_SUPABASE_PUBLISHABLE_KEY"],
  ["SUPABASE_ANON_KEY", "APP_SUPABASE_PUBLISHABLE_KEY"],
  ["SUPABASE_SERVICE_ROLE_KEY", "APP_SUPABASE_SERVICE_ROLE_KEY"],
  ["SUPABASE_DB_URL", "APP_SUPABASE_DATABASE_URL"],
];

type EnvBag = Record<string, string | undefined>;

function writeOverrides(bag: EnvBag, source: EnvBag): boolean {
  let ok = true;
  for (const [target, from] of OVERRIDES) {
    const value = source[from];
    if (!value) continue;
    try {
      bag[target] = value;
    } catch {
      ok = false;
    }
    if (bag[target] !== value) ok = false;
  }
  return ok;
}

export function applySupabaseEnvOverride(): void {
  if (typeof process === "undefined" || !process.env) return;

  const env = process.env as EnvBag;
  const g = globalThis as { __env__?: EnvBag };

  // Production Worker: the live per-request env object.
  if (g.__env__ && typeof g.__env__ === "object") {
    const live = g.__env__;
    if (!writeOverrides(live, live)) {
      // Frozen/immutable env object: swap in a writable copy.
      const copy: EnvBag = { ...live };
      writeOverrides(copy, copy);
      g.__env__ = copy;
    }
  }

  // Node / dev server (and the fallback bag of the Worker proxy).
  writeOverrides(env, env);
}

applySupabaseEnvOverride();
