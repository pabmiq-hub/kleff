import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { thanksSendAt } from "@/lib/registrations-thanks";

export async function dispatchEventThanks(): Promise<{ events: number; sent: number }> {
  const now = new Date();
  const since = new Date(now.getTime() - 7 * 86400_000).toISOString();
  const { data: forms, error } = await supabaseAdmin
    .from("registration_forms")
    .select("id, title, event_date, thanks_sent_at" as never)
    .gte("event_date", since)
    .lte("event_date", now.toISOString())
    .is("thanks_sent_at" as never, null);
  if (error) throw new Error(error.message);

  const { sendEmailSafe } = await import("@/lib/email/send.server");
  const { eventThanksEmail } = await import("@/lib/email/templates.server");
  const { participantName } = await import("@/lib/registrations-email.server");

  let events = 0;
  let sent = 0;
  for (const f of (forms ?? []) as unknown as Array<{ id: string; title: string; event_date: string }>) {
    if (thanksSendAt(new Date(f.event_date)).getTime() > now.getTime()) continue;
    // Claim atomically so overlapping runs never double-send.
    const { data: claimed } = await supabaseAdmin
      .from("registration_forms")
      .update({ thanks_sent_at: now.toISOString() } as never)
      .eq("id", f.id)
      .is("thanks_sent_at" as never, null)
      .select("id");
    if (!claimed?.length) continue;
    events++;
    const { data: rows } = await supabaseAdmin
      .from("registration_responses")
      .select("email_contact, data")
      .eq("form_id", f.id)
      .is("cancelled_at", null);
    const seen = new Set<string>();
    for (const r of (rows ?? []) as Array<{ email_contact: string | null; data: Record<string, unknown> }>) {
      const to = r.email_contact?.trim().toLowerCase();
      if (!to || seen.has(to)) continue;
      seen.add(to);
      const tpl = eventThanksEmail({ formTitle: f.title, userName: participantName(r.data) ?? null });
      const res = await sendEmailSafe({ to, subject: tpl.subject, html: tpl.html, tags: [{ name: "type", value: "registration_thanks" }] });
      if (res) sent++;
    }
  }
  return { events, sent };
}
