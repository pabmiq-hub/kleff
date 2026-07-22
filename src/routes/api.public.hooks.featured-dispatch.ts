import { createFileRoute } from "@tanstack/react-router";
import { dispatchDueFeaturedNotifications } from "@/lib/featured.functions";

export const Route = createFileRoute("/api/public/hooks/featured-dispatch")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await dispatchDueFeaturedNotifications();
          return Response.json({ ok: true, ...result });
        } catch (err) {
          return Response.json(
            { ok: false, error: err instanceof Error ? err.message : "error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
