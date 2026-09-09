// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const define: Record<string, string | undefined> = {};

// During the migration to the owner's Supabase project, APP_SUPABASE_* secrets
// take priority over the Lovable-managed Supabase values injected by default.
// Only the public values (URL + publishable key) are inlined for the browser.
if (process.env.APP_SUPABASE_URL) {
  define["import.meta.env.VITE_SUPABASE_URL"] = JSON.stringify(
    process.env.APP_SUPABASE_URL
  );
}
if (process.env.APP_SUPABASE_PUBLISHABLE_KEY) {
  define["import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY"] = JSON.stringify(
    process.env.APP_SUPABASE_PUBLISHABLE_KEY
  );
}

export default defineConfig({
  vite: {
    define,
  },
});
