import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Notifica (in-app + email) al equipo de una nueva solicitud de voluntariado. */
export async function notifyAdminsNewApplication(fullName: string, email: string): Promise<void> {
  const { data: admins } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "super_admin");

  const rows = (admins ?? []).map((a) => ({
    user_id: a.user_id,
    type: "volunteer_application",
    title: "Nueva solicitud de voluntariado",
    body: `${fullName} quiere unirse al equipo de organización.`,
    url: "/admin/team",
  }));
  if (rows.length) await supabaseAdmin.from("notifications").insert(rows);

  try {
    const { sendEmailSafe, TEAM_INBOX } = await import("@/lib/email/send.server");
    await sendEmailSafe({
      to: TEAM_INBOX,
      subject: `Nueva solicitud de voluntariado — ${fullName}`,
      html: `<p><strong>${fullName}</strong> (${email}) ha enviado una solicitud para el equipo de organización.</p><p>Revísala en el panel de administración → Equipo → Solicitudes.</p>`,
    });
  } catch {
    /* el email es opcional */
  }
}

/** Notifica al socio el cambio de estado de su solicitud. */
export async function notifyApplicant(userId: string, status: string): Promise<void> {
  const map: Record<string, { title: string; body: string }> = {
    reviewing: {
      title: "Tu solicitud está en revisión",
      body: "Estamos revisando tu solicitud para el equipo de organización.",
    },
    accepted: {
      title: "¡Bienvenido/a al equipo de organización!",
      body: "Tu solicitud ha sido aceptada. Nos pondremos en contacto contigo muy pronto.",
    },
    declined: {
      title: "Solicitud de voluntariado",
      body: "De momento no podemos incorporarte al equipo, pero te avisaremos en la próxima ronda.",
    },
  };
  const entry = map[status];
  if (!entry) return;
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type: "volunteer_application",
    title: entry.title,
    body: entry.body,
    url: "/app",
  });
}
