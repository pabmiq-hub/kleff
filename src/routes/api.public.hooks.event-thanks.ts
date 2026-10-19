import { createFileRoute } from "@tanstack/react-router";

// Public cron hook: idempotent, only sends thank-you emails that are due
// (12:00 Madrid the day after each event), and claims each event once.
export const Route = createFileRoute("/api/public/hooks/event-thanks")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const { dispatchEventThanks } = await import("@/lib/registrations-thanks.server");
          return Response.json({ ok: true, ...(await dispatchEventThanks()) });
        } catch (err) {
          console.error("[event-thanks]", err);
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});
