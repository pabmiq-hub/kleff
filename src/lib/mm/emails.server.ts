import { getRequest } from "@tanstack/react-start/server";
import { sendEmailSafe } from "@/lib/email/send.server";
import { mmLocale } from "./i18n";

export function siteOrigin() {
  try {
    const o = new URL(getRequest().url).origin;
    return o.includes("localhost") ? "https://kleff.es" : o;
  } catch {
    return "https://kleff.es";
  }
}

const esc = (s: string | null | undefined) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const wrap = (title: string, body: string) =>
  `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;padding:24px;background:#140d0b;color:#f5e9d7;border-radius:12px;line-height:1.5"><h1 style="color:#d4a24c;margin:0 0 12px">${esc(title)}</h1>${body}</div>`;
const btn = (url: string, label: string) =>
  `<p style="margin:20px 0"><a href="${url}" style="display:inline-block;background:#b91c1c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${esc(label)}</a></p>`;
const steps = (title: string, items: string[]) =>
  `<div style="background:#24170f;border-radius:10px;padding:14px 18px;margin:16px 0"><p style="margin:0 0 8px;color:#d4a24c;font-weight:bold">${esc(title)}</p><ol style="margin:0;padding-left:20px">${items.map((i) => `<li style="margin:6px 0">${i}</li>`).join("")}</ol></div>`;
const small = (t: string) => `<p style="font-size:12px;opacity:.7">${t}</p>`;

type L = "es" | "ca" | "en";
const pick = (lang: string | null | undefined): L => (lang === "ca" || lang === "en" ? lang : lang === "fr" ? "en" : "es");
const fmtDate = (iso: string | null | undefined, lang: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString(mmLocale(lang), { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Madrid" }) : null;

const TX = {
  invite: {
    es: { subject: "Estás invitado a «{g}»", intro: "Has recibido una invitación para la partida <strong>{s}</strong>{d}.", how: "Cómo completar tu alta", s1: "Pulsa <strong>«Aceptar invitación»</strong> y escribe tu nombre.", s2: "En pantalla (y por email) recibirás tu <strong>código personal</strong>. Guárdalo: es tu llave para entrar.", s3: "Entra en la sala de espera y pulsa <strong>«Confirmo que asistiré»</strong>.", s4: "Unas 24 h antes te enviaremos tu <strong>personaje</strong>: léelo con calma (coartada, relaciones y vestuario).", s5: "El día de la partida, entra con tu código y pulsa <strong>«Estoy listo»</strong>.", cta: "Aceptar invitación", on: " el {d}" },
    ca: { subject: "Estàs convidat a «{g}»", intro: "Has rebut una invitació per a la partida <strong>{s}</strong>{d}.", how: "Com completar l'alta", s1: "Prem <strong>«Acceptar invitació»</strong> i escriu el teu nom.", s2: "A la pantalla (i per correu) rebràs el teu <strong>codi personal</strong>. Guarda'l: és la teva clau.", s3: "Entra a la sala d'espera i prem <strong>«Confirmo que hi assistiré»</strong>.", s4: "Unes 24 h abans t'enviarem el teu <strong>personatge</strong>: llegeix-lo amb calma.", s5: "El dia de la partida, entra amb el codi i prem <strong>«Estic a punt»</strong>.", cta: "Acceptar invitació", on: " el {d}" },
    en: { subject: "You're invited to “{g}”", intro: "You've been invited to the game <strong>{s}</strong>{d}.", how: "How to sign up", s1: "Click <strong>“Accept invitation”</strong> and type your name.", s2: "You'll get your <strong>personal code</strong> on screen and by email. Keep it: it's your key.", s3: "Enter the waiting room and tap <strong>“I confirm I'll attend”</strong>.", s4: "About 24 h before, we'll send you your <strong>character</strong>: read it carefully.", s5: "On game day, log in with your code and tap <strong>“I'm ready”</strong>.", cta: "Accept invitation", on: " on {d}" },
  },
  code: {
    es: { subject: "Tu código para «{g}»: {c}", hi: "Hola {n}, ya estás dentro. Este es tu código personal (no lo compartas):", next: "Próximos pasos", s1: "Entra en <a style=\"color:#d4a24c\" href=\"{u}\">{u}</a> e introduce tu código. Si cierras el navegador, vuelve a usarlo.", s2: "Pulsa <strong>«Confirmo que asistiré»</strong> en la sala de espera.", s3: "Recibirás otro email cuando se te asigne personaje (unas 24 h antes).", s4: "El día de la partida pulsa <strong>«Estoy listo»</strong> y sigue el acto en curso en la parte superior de la pantalla.", cta: "Entrar a jugar" },
    ca: { subject: "El teu codi per a «{g}»: {c}", hi: "Hola {n}, ja hi ets. Aquest és el teu codi personal (no el comparteixis):", next: "Propers passos", s1: "Entra a <a style=\"color:#d4a24c\" href=\"{u}\">{u}</a> i introdueix el codi. Si tanques el navegador, torna'l a fer servir.", s2: "Prem <strong>«Confirmo que hi assistiré»</strong> a la sala d'espera.", s3: "Rebràs un altre correu quan se t'assigni personatge (unes 24 h abans).", s4: "El dia de la partida prem <strong>«Estic a punt»</strong> i segueix l'acte a la part superior.", cta: "Entrar a jugar" },
    en: { subject: "Your code for “{g}”: {c}", hi: "Hi {n}, you're in. This is your personal code (don't share it):", next: "Next steps", s1: "Go to <a style=\"color:#d4a24c\" href=\"{u}\">{u}</a> and enter your code. If you close the browser, just use it again.", s2: "Tap <strong>“I confirm I'll attend”</strong> in the waiting room.", s3: "You'll get another email when your character is assigned (about 24 h before).", s4: "On game day tap <strong>“I'm ready”</strong> and follow the current act at the top of the screen.", cta: "Play" },
  },
  assigned: {
    es: { subject: "«{g}»: se te ha asignado a {ch}", hi: "Hola {n}, ya tienes papel en <strong>{g}</strong>{d}:", costume: "Vestuario y actitud", brief: "Antes de la partida", next: "Prepárate", s1: "Entra con tu código <strong>{c}</strong> y abre la pestaña <strong>Personaje</strong>: coartada, relaciones y secretos.", s2: "Mira el <strong>Elenco</strong> para saber quién es quién.", s3: "Guarda el secreto: nadie más debe ver tu ficha.", s4: "El día de la partida pulsa <strong>«Estoy listo»</strong>.", cta: "Ver mi personaje" },
    ca: { subject: "«{g}»: se t'ha assignat {ch}", hi: "Hola {n}, ja tens paper a <strong>{g}</strong>{d}:", costume: "Vestuari i actitud", brief: "Abans de la partida", next: "Prepara't", s1: "Entra amb el codi <strong>{c}</strong> i obre la pestanya <strong>Personatge</strong>.", s2: "Mira el <strong>Repartiment</strong> per saber qui és qui.", s3: "Guarda el secret: ningú més ha de veure la teva fitxa.", s4: "El dia de la partida prem <strong>«Estic a punt»</strong>.", cta: "Veure el meu personatge" },
    en: { subject: "“{g}”: you'll play {ch}", hi: "Hi {n}, you now have a role in <strong>{g}</strong>{d}:", costume: "Costume and attitude", brief: "Before the game", next: "Get ready", s1: "Log in with your code <strong>{c}</strong> and open the <strong>Character</strong> tab.", s2: "Check the <strong>Cast</strong> to learn who's who.", s3: "Keep it secret: nobody else should see your sheet.", s4: "On game day tap <strong>“I'm ready”</strong>.", cta: "See my character" },
  },
} as const;

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

export async function sendInviteEmail(email: string, token: string, gameTitle: string, sessionName: string, lang?: string | null, scheduledAt?: string | null) {
  const t = TX.invite[pick(lang)];
  const url = `${siteOrigin()}/actividades/juegos/invitacion/${token}`;
  const d = fmtDate(scheduledAt, lang);
  await sendEmailSafe({
    to: email,
    subject: fill(t.subject, { g: gameTitle }),
    html: wrap(gameTitle, `<p>${fill(t.intro, { s: esc(sessionName), d: d ? fill(t.on, { d: esc(d) }) : "" })}</p>${steps(t.how, [t.s1, t.s2, t.s3, t.s4, t.s5])}${btn(url, t.cta)}${small(url)}`),
  });
}

export async function sendCodeEmail(email: string, name: string, code: string, gameTitle: string, lang?: string | null) {
  const t = TX.code[pick(lang)];
  const url = `${siteOrigin()}/actividades/juegos/jugar`;
  await sendEmailSafe({
    to: email,
    subject: fill(t.subject, { g: gameTitle, c: code }),
    html: wrap(
      gameTitle,
      `<p>${fill(t.hi, { n: esc(name) })}</p><p style="font-size:28px;letter-spacing:3px;font-weight:bold;background:#24170f;padding:14px;border-radius:8px;text-align:center">${esc(code)}</p>${steps(t.next, [fill(t.s1, { u: url }), t.s2, t.s3, t.s4])}${btn(url, t.cta)}`,
    ),
  });
}

export async function sendAssignmentEmail(opts: {
  email: string;
  name: string;
  code: string;
  gameTitle: string;
  character: { name: string; summary?: string | null; costume?: string | null };
  briefing?: string | null;
  scheduledAt?: string | null;
  lang?: string | null;
}) {
  const t = TX.assigned[pick(opts.lang)];
  const url = `${siteOrigin()}/actividades/juegos/jugar`;
  const d = fmtDate(opts.scheduledAt, opts.lang);
  const ch = opts.character;
  const body =
    `<p>${fill(t.hi, { n: esc(opts.name), g: esc(opts.gameTitle), d: d ? ` (${esc(d)})` : "" })}</p>` +
    `<div style="border:1px solid #d4a24c55;border-radius:10px;padding:14px 18px"><p style="font-size:22px;margin:0;color:#d4a24c;font-weight:bold">${esc(ch.name)}</p>${ch.summary ? `<p style="margin:8px 0 0">${esc(ch.summary)}</p>` : ""}${ch.costume ? `<p style="margin:10px 0 0"><strong>${t.costume}:</strong> ${esc(ch.costume)}</p>` : ""}</div>` +
    (opts.briefing ? `<p style="margin-top:16px"><strong style="color:#d4a24c">${t.brief}:</strong> ${esc(opts.briefing)}</p>` : "") +
    steps(t.next, [fill(t.s1, { c: esc(opts.code) }), t.s2, t.s3, t.s4]) +
    btn(url, t.cta);
  await sendEmailSafe({ to: opts.email, subject: fill(t.subject, { g: opts.gameTitle, ch: ch.name }), html: wrap(opts.gameTitle, body) });
}
