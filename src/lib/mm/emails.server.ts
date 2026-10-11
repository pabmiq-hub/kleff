import { getRequest } from "@tanstack/react-start/server";
import { sendEmailSafe } from "@/lib/email/send.server";

export function siteOrigin() {
  try {
    const o = new URL(getRequest().url).origin;
    return o.includes("localhost") ? "https://kleff.es" : o;
  } catch {
    return "https://kleff.es";
  }
}

const wrap = (title: string, body: string) =>
  `<div style="font-family:Georgia,serif;max-width:520px;margin:auto;padding:24px;background:#140d0b;color:#f5e9d7;border-radius:12px"><h1 style="color:#d4a24c;margin:0 0 12px">${title}</h1>${body}</div>`;
const btn = (url: string, label: string) =>
  `<p><a href="${url}" style="display:inline-block;background:#b91c1c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">${label}</a></p>`;

export async function sendInviteEmail(email: string, token: string, gameTitle: string, sessionName: string) {
  const url = `${siteOrigin()}/actividades/juegos/invitacion/${token}`;
  await sendEmailSafe({
    to: email,
    subject: `Estás invitado a «${gameTitle}»`,
    html: wrap(gameTitle, `<p>Has recibido una invitación para la partida <strong>${sessionName}</strong>.</p><p>Regístrate para recibir tu personaje y tu código personal:</p>${btn(url, "Aceptar invitación")}<p style="font-size:12px;opacity:.7">${url}</p>`),
  });
}

export async function sendCodeEmail(email: string, name: string, code: string, gameTitle: string) {
  const url = `${siteOrigin()}/actividades/juegos/jugar`;
  await sendEmailSafe({
    to: email,
    subject: `Tu código para «${gameTitle}»: ${code}`,
    html: wrap(
      gameTitle,
      `<p>Hola ${name}, ya estás dentro. Este es tu código personal (no lo compartas):</p><p style="font-size:28px;letter-spacing:3px;font-weight:bold;background:#24170f;padding:14px;border-radius:8px;text-align:center">${code}</p>${btn(url, "Entrar a jugar")}`,
    ),
  });
}
