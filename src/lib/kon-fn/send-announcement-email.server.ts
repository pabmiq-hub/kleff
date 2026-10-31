// Konektum "Enviar comunicado": free-form email from the organizer to the
// event's active participants, each with a personal cancellation link.
import { createClient } from "@/lib/kon-fn/client.server";
import { canManageKonektum } from "./_shared/konAccess";
import { hasAnnouncementText, renderAnnouncementEmail } from "@/konektum/lib/announcement";

const env = (k: string): string | undefined => (globalThis as any).process?.env?.[k];
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const APP_BASE_URL = "https://kleff.es";
const encoder = new TextEncoder();
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function toBase64Url(buffer: ArrayBuffer): string {
  let binary = "";
  for (const b of new Uint8Array(buffer)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

// Same token scheme as the reminder emails so /event/:id/cancel/:pid accepts it.
async function cancellationToken(eventId: string, participantId: string): Promise<string> {
  const secret = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(`${eventId}:${participantId}`)));
}

async function sendWithRetry(apiKey: string, payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return { ok: true };
      const text = await res.text();
      if (res.status === 429 && attempt < 3) { await delay(2000); continue; }
      return { ok: false, error: `[${res.status}] ${text}` };
    } catch (e) {
      if (attempt < 3) { await delay(2000); continue; }
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
  return { ok: false, error: "Max retries exceeded" };
}

export default async function konHandler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null);
  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) return json({ error: "No autenticado" }, 401);
    const auth = createClient(env("SUPABASE_URL")!, env("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await auth.auth.getUser(token);
    if (authError || !user) return json({ error: "Sesión caducada" }, 401);

    const body = await req.json().catch(() => ({}));
    const eventId = typeof body.event_id === "string" ? body.event_id : "";
    const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 200) : "";
    const bodyHtml = typeof body.body_html === "string" ? body.body_html.slice(0, 50000) : "";
    const includeCancel = body.include_cancel !== false;
    const ids: string[] = Array.isArray(body.participant_ids)
      ? body.participant_ids.filter((x: unknown) => typeof x === "string").slice(0, 1000)
      : [];
    if (!eventId) return json({ error: "Falta el evento" }, 400);
    if (!subject) return json({ error: "Escribe el título del correo" }, 400);
    if (!hasAnnouncementText(bodyHtml)) return json({ error: "Escribe el texto del comunicado" }, 400);
    if (ids.length === 0) return json({ error: "No hay destinatarios" }, 400);

    const resendKey = env("RESEND_API_KEY");
    if (!resendKey) return json({ error: "RESEND_API_KEY not configured" }, 500);

    const supabase = createClient(env("SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: event } = await supabase
      .from("events")
      .select("id, name, organizer_id, language, email_template, is_test_event, test_config")
      .eq("id", eventId)
      .single();
    if (!event) return json({ error: "Evento no encontrado" }, 404);
    if (event.organizer_id !== user.id && !(await canManageKonektum(user.id))) {
      return json({ error: "No tienes permiso para este evento" }, 403);
    }

    let redirectTo = "";
    if (event.is_test_event) {
      const cfg = (event.test_config || {}) as Record<string, unknown>;
      redirectTo = typeof cfg.redirectEmail === "string" ? cfg.redirectEmail.trim() : "";
      if (!redirectTo || cfg.disableEmails === true) {
        return json({ success: true, skipped: true, reason: "test_event", stats: { total: 0, sent: 0, failed: 0, noEmail: 0 } });
      }
    }

    const tpl = (event.email_template || {}) as Record<string, any>;
    const ct = tpl.communication_templates_v2 || tpl;
    const brandName = ct.brandName || tpl.brandName || "KLEFF";
    const branding = {
      brandName,
      primaryColor: ct.primaryColor || tpl.primaryColor || "#e11d48",
      logoUrl: ct.logoUrl || tpl.logoUrl || "https://kleff.es/kleff-logo.png",
      logoHeight: Number(ct.logoHeight ?? tpl.logoHeight ?? 48),
      isEn: event.language === "en",
    };
    const from = `${brandName} <hola@kleff.es>`;

    // Only participants who are still signed up (bajas are never emailed).
    const { data: participants, error: pErr } = await supabase
      .from("participants")
      .select("id, name, email, cancelled_at")
      .eq("event_id", eventId)
      .in("id", ids)
      .is("cancelled_at", null);
    if (pErr) throw pErr;

    const stats = { total: 0, sent: 0, failed: 0, noEmail: 0 };
    const errors: string[] = [];
    const list = participants || [];
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      stats.total++;
      if (!p.email) { stats.noEmail++; continue; }
      const cancelUrl = includeCancel
        ? `${APP_BASE_URL}/event/${eventId}/cancel/${p.id}?token=${encodeURIComponent(await cancellationToken(eventId, p.id))}`
        : null;
      const email = renderAnnouncementEmail({ ...branding, subject, bodyHtml, participantName: p.name, cancelUrl });
      const result = await sendWithRetry(resendKey, {
        from,
        to: [redirectTo || p.email],
        reply_to: "hola@kleff.es",
        subject: email.subject,
        html: email.html,
      });
      if (result.ok) stats.sent++;
      else { stats.failed++; errors.push(`${p.name}: ${result.error}`); console.error("[send-announcement-email]", p.id, result.error); }
      try {
        await supabase.from("email_logs").insert({
          event_id: eventId,
          participant_id: p.id,
          email_type: "announcement",
          status: result.ok ? "sent" : "failed",
          error_message: result.error || null,
          sent_at: result.ok ? new Date().toISOString() : null,
        });
      } catch (e) {
        console.error("[send-announcement-email] log failed", e);
      }
      if (i < list.length - 1) await delay(550);
    }

    return json({ success: true, stats, errors: errors.length ? errors : undefined });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[send-announcement-email]", msg);
    return json({ error: msg }, 500);
  }
}
