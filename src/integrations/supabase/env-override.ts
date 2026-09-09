/**
 * Runtime override that makes the app connect to the owner's Supabase
 * project (APP_SUPABASE_*) instead of the Lovable-managed one.
 *
 * This module must be imported before any Supabase client is instantiated,
 * typically at the very top of src/router.tsx.
 *
 * Browser: Vite replaces import.meta.env.VITE_SUPABASE_* via defineConfig,
 * so no process.env access happens there.
 * Server: process.env.SUPABASE_* is shadowed with APP_SUPABASE_* values
 * before the generated clients read them.
 */

function applyOverride() {
  if (typeof process === "undefined" || !process.env) return;

  const env = process.env;

  // Only override when the owner-provided values are present.
  // This keeps the app working in environments without APP_SUPABASE_* set.
  if (env.APP_SUPABASE_URL && !env.SUPABASE_URL) {
    env.SUPABASE_URL = env.APP_SUPABASE_URL;
  }
  if (env.APP_SUPABASE_PUBLISHABLE_KEY && !env.SUPABASE_PUBLISHABLE_KEY) {
    env.SUPABASE_PUBLISHABLE_KEY = env.APP_SUPABASE_PUBLISHABLE_KEY;
  }
  if (env.APP_SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY) {
    env.SUPABASE_SERVICE_ROLE_KEY = env.APP_SUPABASE_SERVICE_ROLE_KEY;
  }
}

applyOverride();
