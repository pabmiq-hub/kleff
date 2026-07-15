import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  message: z.string().trim().min(5).max(5000),
  // Honeypot — bots fill this, humans don't
  website: z.string().max(0).optional(),
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }
        const parsed = bodySchema.safeParse(payload);
        if (!parsed.success) {
          return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
        }
        // Honeypot triggered — pretend success
        if (parsed.data.website && parsed.data.website.length > 0) {
          return json({ ok: true });
        }

        const { sendEmailSafe, TEAM_INBOX } = await import("@/lib/email/send.server");
        const { contactUserConfirmationEmail, contactTeamAlertEmail } = await import(
          "@/lib/email/templates.server"
        );

        const { name, email, message } = parsed.data;

        const alert = contactTeamAlertEmail({ name, email, message });
        void sendEmailSafe({
          to: TEAM_INBOX,
          subject: alert.subject,
          html: alert.html,
          replyTo: email,
          tags: [{ name: "type", value: "contact_team_alert" }],
        });

        const conf = contactUserConfirmationEmail({ name, message });
        void sendEmailSafe({
          to: email,
          subject: conf.subject,
          html: conf.html,
          tags: [{ name: "type", value: "contact_user_confirmation" }],
        });

        return json({ ok: true });
      },
    },
  },
});
