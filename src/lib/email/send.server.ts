// Resend email sender (server-only). Direct Resend API via RESEND_API_KEY.
// Do NOT import from client code.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export const DEFAULT_FROM = "KLEFF <hola@kleff.es>";
export const DEFAULT_REPLY_TO = "hola@kleff.es";
export const TEAM_INBOX = "hola@kleff.es";

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  id: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const body: Record<string, unknown> = {
    from: input.from ?? DEFAULT_FROM,
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    html: input.html,
    reply_to: input.replyTo ?? DEFAULT_REPLY_TO,
  };
  if (input.text) body.text = input.text;
  if (input.cc) body.cc = input.cc;
  if (input.bcc) body.bcc = input.bcc;
  if (input.tags) body.tags = input.tags;

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[email] Resend failed [${res.status}]: ${errText}`);
    throw new Error(`Resend request failed [${res.status}]: ${errText}`);
  }
  const json = (await res.json()) as { id: string };
  return { id: json.id };
}

// Fire-and-log: never throw, so email failures don't break the primary user flow.
export async function sendEmailSafe(input: SendEmailInput): Promise<SendEmailResult | null> {
  try {
    return await sendEmail(input);
  } catch (err) {
    console.error("[email] sendEmailSafe error:", err);
    return null;
  }
}
