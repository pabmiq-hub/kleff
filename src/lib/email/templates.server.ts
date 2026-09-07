// Minimal branded HTML email templates for KLEFF.
// Kept as pure strings (no React deps) to stay lightweight on the edge runtime.

const BRAND_CORAL = "#E5563D";
const INK = "#1a1a1a";
const CREAM = "#faf6ef";
const BORDER = "#1a1a1a";

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface LayoutOpts {
  title: string;
  preview?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

function layout({ title, preview, bodyHtml, ctaLabel, ctaUrl }: LayoutOpts): string {
  const cta =
    ctaLabel && ctaUrl
      ? `<div style="text-align:center;margin:28px 0 8px;">
           <a href="${escape(ctaUrl)}"
              style="display:inline-block;background:${BRAND_CORAL};color:#ffffff;text-decoration:none;
                     padding:14px 28px;border-radius:999px;font-weight:700;font-size:15px;
                     border:2px solid ${INK};box-shadow:3px 3px 0 ${INK};">
             ${escape(ctaLabel)}
           </a>
         </div>`
      : "";

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
${preview ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(preview)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${CREAM};border:2px solid ${BORDER};border-radius:16px;box-shadow:4px 4px 0 ${INK};overflow:hidden;">
      <tr><td style="padding:28px 32px 8px;">
        <div style="font-family:Georgia,serif;font-weight:700;font-size:28px;letter-spacing:-0.5px;color:${INK};">KLEFF</div>
      </td></tr>
      <tr><td style="padding:8px 32px 32px;font-size:16px;line-height:1.6;color:${INK};">
        ${bodyHtml}
        ${cta}
      </td></tr>
      <tr><td style="padding:20px 32px;background:#ffffff;border-top:1px solid #e5e0d5;font-size:12px;color:#6b6b6b;text-align:center;">
        KLEFF · Barcelona · <a href="https://www.kleff.es" style="color:${BRAND_CORAL};text-decoration:none;">www.kleff.es</a><br>
        ¿Dudas? Responde a este correo y te contestamos.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ---------- Registration confirmation (to user) ----------
export function registrationConfirmationEmail(opts: {
  formTitle: string;
  userName?: string;
  confirmationMessage?: string | null;
}): { subject: string; html: string } {
  const name = opts.userName ? escape(opts.userName) : "";
  const custom = opts.confirmationMessage
    ? `<p style="margin:16px 0;">${escape(opts.confirmationMessage)}</p>`
    : "";
  const html = layout({
    title: `Inscripción recibida — ${opts.formTitle}`,
    preview: `Hemos recibido tu inscripción a ${opts.formTitle}`,
    bodyHtml: `
      <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px;">¡Inscripción recibida! 🎲</h1>
      <p style="margin:0 0 12px;">Hola${name ? ` ${name}` : ""},</p>
      <p style="margin:0 0 12px;">Hemos recibido tu inscripción a <strong>${escape(opts.formTitle)}</strong>. En breve nos ponemos en contacto contigo con los detalles.</p>
      ${custom}
      <p style="margin:16px 0 0;">¡Nos vemos pronto!<br>El equipo de KLEFF</p>
    `,
  });
  return { subject: `Inscripción recibida — ${opts.formTitle}`, html };
}

// ---------- Registration notification (to team) ----------
export function registrationTeamNotificationEmail(opts: {
  formTitle: string;
  responseId: string;
  emailContact?: string | null;
  data: Record<string, unknown>;
}): { subject: string; html: string } {
  const rows = Object.entries(opts.data)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;background:#f5f1e8;border:1px solid #e5e0d5;font-weight:600;vertical-align:top;">${escape(k)}</td><td style="padding:6px 12px;border:1px solid #e5e0d5;">${escape(
          typeof v === "string" ? v : JSON.stringify(v),
        )}</td></tr>`,
    )
    .join("");
  const html = layout({
    title: `Nueva inscripción — ${opts.formTitle}`,
    bodyHtml: `
      <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px;">Nueva inscripción</h1>
      <p style="margin:0 0 4px;"><strong>Formulario:</strong> ${escape(opts.formTitle)}</p>
      ${opts.emailContact ? `<p style="margin:0 0 4px;"><strong>Email:</strong> ${escape(opts.emailContact)}</p>` : ""}
      <p style="margin:0 0 12px;font-size:12px;color:#888;">ID: ${escape(opts.responseId)}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows}
      </table>
    `,
    ctaLabel: "Ver en el panel",
    ctaUrl: `https://www.kleff.es/admin/registrations/${opts.responseId}`,
  });
  return { subject: `📝 Nueva inscripción — ${opts.formTitle}`, html };
}

// ---------- Contact form: confirmation to user ----------
export function contactUserConfirmationEmail(opts: {
  name: string;
  message: string;
}): { subject: string; html: string } {
  const html = layout({
    title: "Hemos recibido tu mensaje",
    preview: "Gracias por escribirnos, te respondemos pronto.",
    bodyHtml: `
      <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px;">¡Gracias por escribirnos! 👋</h1>
      <p style="margin:0 0 12px;">Hola ${escape(opts.name)},</p>
      <p style="margin:0 0 12px;">Hemos recibido tu mensaje y te responderemos en breve desde <strong>hola@kleff.es</strong>.</p>
      <div style="margin:16px 0;padding:14px 16px;background:#ffffff;border:1px solid #e5e0d5;border-radius:8px;white-space:pre-wrap;font-size:14px;color:#444;">${escape(opts.message)}</div>
      <p style="margin:16px 0 0;">Un abrazo,<br>El equipo de KLEFF</p>
    `,
  });
  return { subject: "Hemos recibido tu mensaje — KLEFF", html };
}

// ---------- Invitation ----------
export function invitationEmail(opts: {
  inviteUrl: string;
  expiresAt: string;
}): { subject: string; html: string } {
  const expires = new Date(opts.expiresAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const html = layout({
    title: "Te invitamos a KLEFF",
    preview: "Tu invitación al club KLEFF está lista.",
    bodyHtml: `
      <h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 12px;">¡Bienvenido/a a KLEFF! 🎲</h1>
      <p style="margin:0 0 12px;">Te hemos invitado a formar parte del club. Haz clic en el botón para crear tu cuenta y acceder a tu carnet de socio/a.</p>
      <p style="margin:12px 0;font-size:13px;color:#666;">La invitación caduca el <strong>${escape(expires)}</strong>.</p>
    `,
    ctaLabel: "Aceptar invitación",
    ctaUrl: opts.inviteUrl,
  });
  return { subject: "Tu invitación a KLEFF", html };
}

// ---------- Contact form: alert to team ----------
export function contactTeamAlertEmail(opts: {
  name: string;
  email: string;
  message: string;
}): { subject: string; html: string } {
  const html = layout({
    title: "Nuevo mensaje de contacto",
    bodyHtml: `
      <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px;">Nuevo mensaje de contacto</h1>
      <p style="margin:0 0 4px;"><strong>De:</strong> ${escape(opts.name)} &lt;${escape(opts.email)}&gt;</p>
      <div style="margin:12px 0;padding:14px 16px;background:#ffffff;border:1px solid #e5e0d5;border-radius:8px;white-space:pre-wrap;font-size:14px;">${escape(opts.message)}</div>
      <p style="margin:12px 0 0;font-size:12px;color:#888;">Responde directamente a este correo para contactar con ${escape(opts.name)}.</p>
    `,
  });
  return { subject: `✉️ Contacto web — ${opts.name}`, html };
}

// ---------- Event registration: confirmation / reminder (to participant) ----------
export function registrationEventEmail(opts: {
  kind: "confirmation" | "reminder";
  formTitle: string;
  subject: string;
  intro: string;
  userName?: string;
  eventDateLabel?: string | null;
  eventLocation?: string | null;
  guests?: number;
  googleUrl?: string | null;
  icsUrl?: string | null;
  cancelUrl?: string | null;
  eventUrl?: string | null;
}): { subject: string; html: string } {
  const name = opts.userName ? escape(opts.userName) : "";
  const details: string[] = [];
  if (opts.eventDateLabel) details.push(`<strong>📅 Cuándo:</strong> ${escape(opts.eventDateLabel)}`);
  if (opts.eventLocation) details.push(`<strong>📍 Dónde:</strong> ${escape(opts.eventLocation)}`);
  if (opts.guests && opts.guests > 0) {
    details.push(`<strong>👥 Invitados:</strong> ${opts.guests} (${opts.guests + 1} plazas en total)`);
  }
  const detailsHtml = details.length
    ? `<div style="margin:18px 0;padding:14px 16px;background:#ffffff;border:2px solid ${INK};border-radius:12px;font-size:15px;line-height:1.8;">
         ${details.join("<br>")}
       </div>`
    : "";

  const calendar =
    opts.googleUrl || opts.icsUrl
      ? `<p style="margin:18px 0 6px;font-weight:700;">Añádelo a tu calendario</p>
         <p style="margin:0 0 8px;">
           ${opts.googleUrl ? `<a href="${escape(opts.googleUrl)}" style="display:inline-block;margin:4px 8px 4px 0;padding:10px 18px;border:2px solid ${INK};border-radius:999px;background:#ffffff;color:${INK};text-decoration:none;font-weight:600;font-size:14px;">Google Calendar</a>` : ""}
           ${opts.icsUrl ? `<a href="${escape(opts.icsUrl)}" style="display:inline-block;margin:4px 0;padding:10px 18px;border:2px solid ${INK};border-radius:999px;background:#ffffff;color:${INK};text-decoration:none;font-weight:600;font-size:14px;">iCalendar (Apple / Outlook)</a>` : ""}
         </p>`
      : "";

  const cancel = opts.cancelUrl
    ? `<p style="margin:22px 0 0;font-size:13px;color:#6b6b6b;">
         ¿No puedes venir? <a href="${escape(opts.cancelUrl)}" style="color:${BRAND_CORAL};font-weight:600;">Darme de baja del evento</a>.
       </p>`
    : "";

  const introHtml = opts.intro
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;">${escape(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

  const heading =
    opts.kind === "confirmation" ? "¡Inscripción confirmada! 🎲" : "Te esperamos muy pronto 🎲";

  const html = layout({
    title: opts.subject,
    preview: opts.subject,
    bodyHtml: `
      <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px;">${escape(heading)}</h1>
      <p style="margin:0 0 12px;">Hola${name ? ` ${name}` : ""},</p>
      ${introHtml}
      ${detailsHtml}
      ${calendar}
      ${cancel}
      <p style="margin:18px 0 0;">El equipo de KLEFF</p>
    `,
    ...(opts.eventUrl ? { ctaLabel: "Ver el evento", ctaUrl: opts.eventUrl } : {}),
  });
  return { subject: opts.subject, html };
}

// ---------- Registration cancelled (to team) ----------
export function registrationCancelTeamEmail(opts: {
  formTitle: string;
  emailContact?: string | null;
  userName?: string | null;
  guests?: number;
  formId: string;
}): { subject: string; html: string } {
  const html = layout({
    title: `Baja de inscripción — ${opts.formTitle}`,
    bodyHtml: `
      <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px;">Baja de inscripción</h1>
      <p style="margin:0 0 4px;"><strong>Evento:</strong> ${escape(opts.formTitle)}</p>
      ${opts.userName ? `<p style="margin:0 0 4px;"><strong>Nombre:</strong> ${escape(opts.userName)}</p>` : ""}
      ${opts.emailContact ? `<p style="margin:0 0 4px;"><strong>Email:</strong> ${escape(opts.emailContact)}</p>` : ""}
      <p style="margin:0 0 12px;"><strong>Plazas liberadas:</strong> ${(opts.guests ?? 0) + 1}</p>
    `,
    ctaLabel: "Ver inscritos",
    ctaUrl: `https://www.kleff.es/admin/registrations/${opts.formId}`,
  });
  return { subject: `❌ Baja — ${opts.formTitle}`, html };
}
