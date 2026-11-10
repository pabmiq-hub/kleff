// Konektum closing email: sent when the organizer closes an event with a
// selection deadline. Thanks attendees, links to their selection panel with
// the exact deadline, and asks for a 5-star Google review.
export const KON_GOOGLE_REVIEW_URL = "https://g.page/r/CXntdwa3Ms3XEBE/review";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Deadline formatted in Madrid time, e.g. "jueves 12 de noviembre a las 23:30 h". */
export function formatClosingDeadline(deadline: Date, isEn: boolean): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "Europe/Madrid", weekday: "long", day: "numeric", month: "long",
  };
  const time = deadline.toLocaleTimeString(isEn ? "en-GB" : "es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" });
  const day = deadline.toLocaleDateString(isEn ? "en-GB" : "es-ES", opts);
  return isEn ? `${day} at ${time}` : `${day} a las ${time} h`;
}

export interface ClosingThanksInput {
  name: string;
  eventName: string;
  hours: number;
  deadline: Date;
  selectionUrl: string;
  isEn: boolean;
  primaryColor?: string;
  brandName?: string;
}

export function renderClosingThanksEmail(i: ClosingThanksInput): { subject: string; html: string } {
  const color = i.primaryColor || "#e11d48";
  const brand = esc(i.brandName || "KLEFF");
  const name = esc(i.name.split(" ")[0] || i.name);
  const ev = esc(i.eventName);
  const when = esc(formatClosingDeadline(i.deadline, i.isEn));
  const subject = i.isEn
    ? `Thanks for coming to ${i.eventName}! 🎲 You have ${i.hours}h to choose your connections`
    : `¡Gracias por venir a ${i.eventName}! 🎲 Tienes ${i.hours}h para indicar tus conexiones`;
  const t = i.isEn
    ? {
        pre: `We hope you had a great time. Vote before ${formatClosingDeadline(i.deadline, true)} and help us with your review.`,
        h1: `Thanks for coming to ${ev}! 🎉`, hi: `Hi <strong>${name}</strong>!`,
        p1: "Thank you so much for sharing the evening with us. We hope you enjoyed the games and the people you met.",
        h2: "⏰ Time to choose your connections!",
        p2: `You have <strong>${i.hours} hours</strong> (until <strong>${when}</strong>) to open your panel and tell us who you'd like to meet again. After that, we'll cross the answers and email you your matches.`,
        b1: "Send my selections",
        h3: "⭐ Can you spare 1 minute?",
        p3: "As a community and board game club, it means a lot when attendees share their experience. It would help us enormously if you rated us <strong>5 ⭐ on Google</strong>:",
        b2: "Leave 5 stars on Google", bye: `Thank you and see you next time!<br><strong>The ${brand} team 💕</strong>`,
      }
    : {
        pre: `Esperamos que lo pasaras genial. Vota antes del ${formatClosingDeadline(i.deadline, false)} y ayúdanos con tu reseña.`,
        h1: `¡Gracias por venir a ${ev}! 🎉`, hi: `¡Hola, <strong>${name}</strong>!`,
        p1: "Muchas gracias por haber compartido la velada con nosotros. Esperamos que disfrutaras de las partidas y de la gente que conociste.",
        h2: "⏰ ¡Es momento de elegir tus conexiones!",
        p2: `Tienes <strong>${i.hours} horas</strong> (hasta el <strong>${when}</strong>) para entrar en tu panel y decirnos con quién te gustaría volver a coincidir. Pasado ese plazo, cruzaremos las respuestas y te enviaremos tus matches por correo.`,
        b1: "Enviar mis selecciones",
        h3: "⭐ ¿Nos ayudas con 1 minuto?",
        p3: "Para nosotros, como comunidad y club de juegos, es vital que quienes venís compartáis vuestra experiencia. Nos ayudaría muchísimo que nos valoraras con <strong>5 ⭐ en Google</strong>:",
        b2: "Dejar 5 estrellas en Google", bye: `¡Muchas gracias y nos vemos en la próxima!<br><strong>El equipo de ${brand} 💕</strong>`,
      };
  const btn = (href: string, label: string, bg: string) =>
    `<div style="text-align:center;margin:20px 0;"><a href="${esc(href)}" style="background:${bg};color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">${label}</a></div>`;
  const html = `<!DOCTYPE html><html><body style="font-family:'Segoe UI',Tahoma,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(t.pre)}</div>
<div style="background:#ffffff;padding:30px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
<h1 style="color:${color};font-size:24px;margin:0 0 16px;">${t.h1}</h1>
<p>${t.hi}</p><p>${t.p1}</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
<h2 style="font-size:18px;margin:0 0 8px;">${t.h2}</h2><p>${t.p2}</p>
${btn(i.selectionUrl, t.b1, color)}
<hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
<h2 style="font-size:18px;margin:0 0 8px;">${t.h3}</h2><p>${t.p3}</p>
${btn(KON_GOOGLE_REVIEW_URL, t.b2, "#f59e0b")}
<p style="margin-top:24px;">${t.bye}</p>
</div></body></html>`;
  return { subject, html };
}
