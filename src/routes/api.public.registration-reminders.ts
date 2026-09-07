import { createFileRoute } from "@tanstack/react-router";

/**
 * Sends the scheduled reminder email for every published registration form
 * whose reminder time has passed and that has not been sent yet.
 * Meant to be called periodically (cron). Optional shared token via REGISTRATION_CRON_TOKEN.
 */
async function run(request: Request): Promise<Response> {
  const expected = process.env["REGISTRATION_CRON_TOKEN"];
  if (expected) {
    const url = new URL(request.url);
    const provided = request.headers.get("x-cron-token") ?? url.searchParams.get("token");
    if (provided !== expected) return new Response("Unauthorized", { status: 401 });
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const nowIso = new Date().toISOString();
  const { data: forms, error } = await supabaseAdmin
    .from("registration_forms")
    .select("*")
    .eq("is_published", true)
    .eq("reminder_enabled", true)
    .is("reminder_sent_at", null)
    .lte("reminder_at", nowIso);
  if (error) return new Response(error.message, { status: 500 });

  const { sendRegistrationEmail } = await import("@/lib/registrations-email.server");
  let total = 0;
  for (const form of (forms ?? []) as Array<Record<string, unknown>>) {
    const f = form as unknown as Parameters<typeof sendRegistrationEmail>[1];
    const formId = (form as { id: string }).id;
    const { data: rows } = await supabaseAdmin
      .from("registration_responses")
      .select("cancel_token, email_contact, guests_count, data")
      .eq("form_id", formId)
      .is("cancelled_at", null)
      .not("email_contact", "is", null);
    for (const r of (rows ?? []) as Array<Parameters<typeof sendRegistrationEmail>[2]>) {
      await sendRegistrationEmail("reminder", f, r);
      total++;
    }
    await supabaseAdmin
      .from("registration_forms")
      .update({ reminder_sent_at: new Date().toISOString() } as never)
      .eq("id", formId);
  }

  return Response.json({ ok: true, forms: (forms ?? []).length, emails: total });
}

export const Route = createFileRoute("/api/public/registration-reminders")({
  server: {
    handlers: {
      GET: ({ request }) => run(request),
      POST: ({ request }) => run(request),
    },
  },
});
