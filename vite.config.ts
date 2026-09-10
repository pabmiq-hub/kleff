// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const define: Record<string, string | undefined> = {};

// The app runs against the owner's own Supabase project. The public values
// (URL + publishable key — both safe to ship to the browser) are inlined here
// so every build, including the published one where APP_SUPABASE_* build-time
// variables are not available, talks to the right project. APP_SUPABASE_*
// still take priority when present (sandbox / local dev).
const OWN_SUPABASE_URL = "https://vkxogcfrbphhwdwzcnmt.supabase.co";
const OWN_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ERJs0uQ4rrZxyF2RgaF3Vw_UYsV68SJ";

define["import.meta.env.VITE_SUPABASE_URL"] = JSON.stringify(
  process.env.APP_SUPABASE_URL || OWN_SUPABASE_URL
);
define["import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY"] = JSON.stringify(
  process.env.APP_SUPABASE_PUBLISHABLE_KEY || OWN_SUPABASE_PUBLISHABLE_KEY
);

export default defineConfig({
  vite: {
    define,
  },
});
