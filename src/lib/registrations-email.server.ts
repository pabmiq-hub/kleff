// Server-only helpers to build & send registration emails (confirmation / reminder).
import {
  buildIcs,
  formatMadrid,
  googleCalendarUrl,
  renderTemplateText,
} from "@/lib/registrations-calendar";

export interface EmailFormLike {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  event_date?: string | null;
  event_location?: string | null;
  confirmation_message?: string | null;
  confirmation_email_subject?: string | null;
  confirmation_email_body?: string | null;
  reminder_subject?: string | null;
  reminder_body?: string | null;
}

export interface EmailResponseLike {
  cancel_token: string;
  email_contact?: string | null;
  guests_count?: number | null;
  data?: Record<string, unknown> | null;
}

export function siteUrl(): string {
  return (process.env.PUBLIC_APP_URL ?? "https://www.kleff.es").replace(/\/$/, "");
}

export function participantName(data?: Record<string, unknown> | null): string | undefined {
  if (!data) return undefined;
  for (const key of Object.keys(data)) {
    if (/nom|name/i.test(key)) {
      const v = data[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return undefined;
}

export const DEFAULT_CONFIRMATION_BODY =
  "Hemos recibido tu inscripción a {{titulo}}. ¡Ya tienes tu plaza reservada!";
export const DEFAULT_REMINDER_BODY =
  "Te recordamos que {{titulo}} es muy pronto. ¡Te esperamos!";

export function templateVars(form: EmailFormLike, name?: string, guests = 0) {
  return {
    nombre: name ?? "",
    titulo: form.title,
    fecha: form.event_date ? formatMadrid(form.event_date) : "",
    ubicacion: form.event_location ?? "",
    invitados: String(guests),
  };
}

export function buildRegistrationEmail(
  kind: "confirmation" | "reminder",
  form: EmailFormLike,
  response: EmailResponseLike,
) {
  const name = participantName(response.data);
  const guests = response.guests_count ?? 0;
  const vars = templateVars(form, name, guests);
  const site = siteUrl();

  const rawBody =
    kind === "confirmation"
      ? form.confirmation_email_body || form.confirmation_message || DEFAULT_CONFIRMATION_BODY
      : form.reminder_body || DEFAULT_REMINDER_BODY;
  const rawSubject =
    kind === "confirmation"
      ? form.confirmation_email_subject || `Inscripción confirmada — {{titulo}}`
      : form.reminder_subject || `Recordatorio — {{titulo}}`;

  const start = form.event_date ? new Date(form.event_date) : null;
  const hasDate = !!start && !Number.isNaN(start.getTime());

  return {
    subject: renderTemplateText(rawSubject, vars),
    intro: renderTemplateText(rawBody, vars),
    userName: name,
    eventDateLabel: hasDate ? formatMadrid(start as Date) : null,
    eventLocation: form.event_location ?? null,
    guests,
    googleUrl: hasDate
      ? googleCalendarUrl({
          title: form.title,
          start: start as Date,
          location: form.event_location ?? undefined,
          description: form.description ?? undefined,
          url: `${site}/${form.slug}`,
        })
      : null,
    icsUrl: hasDate ? `${site}/api/public/registro-ics/${response.cancel_token}` : null,
    cancelUrl: `${site}/inscripcion/baja/${response.cancel_token}`,
    eventUrl: `${site}/${form.slug}`,
  };
}

export function icsForResponse(form: EmailFormLike, token: string): string | null {
  if (!form.event_date) return null;
  const start = new Date(form.event_date);
  if (Number.isNaN(start.getTime())) return null;
  return buildIcs({
    title: form.title,
    start,
    location: form.event_location ?? undefined,
    description: form.description ?? undefined,
    url: `${siteUrl()}/${form.slug}`,
    uid: `${token}@kleff.es`,
  });
}

export async function sendRegistrationEmail(
  kind: "confirmation" | "reminder",
  form: EmailFormLike,
  response: EmailResponseLike,
): Promise<void> {
  if (!response.email_contact) return;
  const { sendEmailSafe } = await import("@/lib/email/send.server");
  const { registrationEventEmail } = await import("@/lib/email/templates.server");
  const built = buildRegistrationEmail(kind, form, response);
  const tpl = registrationEventEmail({ kind, formTitle: form.title, ...built });
  await sendEmailSafe({
    to: response.email_contact,
    subject: tpl.subject,
    html: tpl.html,
    tags: [{ name: "type", value: `registration_${kind}` }],
  });
}
