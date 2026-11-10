// Konektum closing email: thanks + selection deadline + Google review.
// Sent once per event to checked-in, non-cancelled participants when the
// organizer closes the event with a selection deadline.
import { createClient } from "@/lib/kon-fn/client.server";
import { canManageKonektum } from "./_shared/konAccess";
import { renderClosingThanksEmail } from "@/konektum/lib/closing-thanks";
import { participantVariant, variantEventName } from "./_shared/variantTemplates";

const env = (k: string): string | undefined => (globalThis as any).process?.env?.[k];
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function konHandler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null);
  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) return json({ error: "No autenticado" }, 401);
    const auth = createClient(env("SUPABASE_URL")!, env("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await auth.auth.getUser(token);
    if (!user) return json({ error: "Sesión caducada" }, 401);

    const body = await req.json().catch(() => ({}));
    const eventId = typeof body.event_id === "string" ? body.event_id : "";
    if (!eventId) return json({ error: "Falta el evento" }, 400);

    const resendKey = env("RESEND_API_KEY");
    if (!resendKey) return json({ error: "RESEND_API_KEY not configured" }, 500);
    const supabase = createClient(env("SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: event } = await supabase
      .from("events")
      .select("id, name, secondary_event_name, organizer_id, language, email_template, scheduled_email_at, selection_deadline_hours, is_test_event, test_config")
      .eq("id", eventId)
      .single();
    if (!event) return json({ error: "Evento no encontrado" }, 404);
    if (event.organizer_id !== user.id && !(await canManageKonektum(user.id))) {
      return json({ error: "No tienes permiso para este evento" }, 403);
    }
    if (!event.scheduled_email_at) return json({ success: true, skipped: true, reason: "no_deadline" });

    let redirectTo = "";
    if (event.is_test_event) {
      const cfg = (event.test_config || {}) as Record<string, unknown>;
      redirectTo = typeof cfg.redirectEmail === "string" ? cfg.redirectEmail.trim() : "";
      if (!redirectTo || cfg.disableEmails === true) return json({ success: true, skipped: true, reason: "test_event" });
    }

    // Send once per event: skip if any closing email is already logged.
    const { count } = await supabase
      .from("email_logs").select("id", { count: "exact", head: true })
      .eq("event_id", eventId).eq("email_type", "closing_thanks");
    if ((count ?? 0) > 0) return json({ success: true, skipped: true, reason: "already_sent" });

    const tpl = (event.email_template || {}) as Record<string, any>;
    const ct = tpl.communication_templates_v2 || tpl;
    const brandName = ct.brandName || "KLEFF";
    const deadline = new Date(event.scheduled_email_at);
    const hours = Number(event.selection_deadline_hours) || Math.max(1, Math.round((deadline.getTime() - Date.now()) / 3600_000));
    const isEn = event.language === "en";

    const { data: participants } = await supabase
      .from("participants")
      .select("id, name, email, registration_variant")
      .eq("event_id", eventId)
      .eq("checked_in", true)
      .is("cancelled_at", null);

    const stats = { total: 0, sent: 0, failed: 0, noEmail: 0 };
    for (const p of participants || []) {
      stats.total++;
      if (!p.email) { stats.noEmail++; continue; }
      const { subject, html } = renderClosingThanksEmail({
        name: p.name || "",
        eventName: variantEventName(event, participantVariant(p)),
        hours, deadline, isEn, brandName,
        primaryColor: ct.primaryColor,
        selectionUrl: `https://kleff.es/event/${eventId}/access`,
      });
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: `${brandName} <hola@kleff.es>`, to: [redirectTo || p.email], subject, html }),
      }).catch(() => null);
      const ok = !!res?.ok;
      if (ok) stats.sent++; else stats.failed++;
      await supabase.from("email_logs").insert({
        event_id: eventId, participant_id: p.id, email_type: "closing_thanks",
        status: ok ? "sent" : "failed",
        error_message: ok ? null : (res ? `[${res.status}]` : "network"),
        sent_at: ok ? new Date().toISOString() : null,
      });
      await delay(600);
    }
    return json({ success: true, stats });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
}
