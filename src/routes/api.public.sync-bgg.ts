import { createFileRoute } from "@tanstack/react-router";
import { syncBggCollection } from "@/server/bgg.server";

// Public cron endpoint to sync BGG collection.
// Called daily by pg_cron. Lightweight token check via SYNC_TOKEN if configured;
// otherwise relies on the obscure path under /api/public/.
export const Route = createFileRoute("/api/public/sync-bgg")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.BGG_SYNC_TOKEN;
        if (token) {
          const auth = request.headers.get("authorization");
          if (auth !== `Bearer ${token}`) {
            return new Response("Unauthorized", { status: 401 });
          }
        }
        try {
          const result = await syncBggCollection();
          return Response.json({ ok: true, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[sync-bgg] failed:", msg);
          return Response.json({ ok: false, error: msg }, { status: 500 });
        }
      },
      GET: async () => {
        // Allow manual GET trigger (no token required when none configured) for convenience
        const token = process.env.BGG_SYNC_TOKEN;
        if (token) return new Response("Use POST", { status: 405 });
        try {
          const result = await syncBggCollection();
          return Response.json({ ok: true, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, error: msg }, { status: 500 });
        }
      },
    },
  },
});
