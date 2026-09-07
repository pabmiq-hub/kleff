import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertSuperAdmin } from "@/lib/assert-role.server";
import { isQuestionVisible } from "@/lib/registrations-calendar";


const questionTypeSchema = z.enum([
  "text", "textarea", "email", "phone", "number", "select", "checkbox", "radio", "date", "file",
]);

export type RegistrationForm = {
  id: string;
  slug: string;
  kind: "form" | "external";
  title: string;
  description: string | null;
  cover_image_url: string | null;
  cover_position: string;
  external_iframe_height: number;
  is_published: boolean;
  external_mode: "redirect" | "iframe" | null;
  external_url: string | null;
  payment_required: boolean;
  payment_amount_cents: number | null;
  payment_currency: string;
  payment_instructions: string | null;
  max_responses: number | null;
  closes_at: string | null;
  confirmation_message: string | null;
  notify_emails: string[];
  event_date: string | null;
  event_location: string | null;
  allow_guests: boolean;
  max_guests_per_response: number;
  send_confirmation_email: boolean;
  confirmation_email_subject: string | null;
  confirmation_email_body: string | null;
  reminder_enabled: boolean;
  reminder_at: string | null;
  reminder_subject: string | null;
  reminder_body: string | null;
  reminder_sent_at: string | null;
  reminder_offsets_hours: number[];
  created_at: string;
  updated_at: string;
};

export type RegistrationQuestion = {
  id: string;
  form_id: string;
  position: number;
  type: z.infer<typeof questionTypeSchema>;
  required: boolean;
  label: string;
  help: string | null;
  options: Array<{ value: string; label: string }>;
  special: "guests" | "game_pick" | null;
  hide_after_wednesday: boolean;
};


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RegistrationResponse = {
  id: string;
  form_id: string;
  email_contact: string | null;
  data: Record<string, any>;
  payment_status: "pending" | "paid" | "refunded" | "not_required";
  internal_notes: string | null;
  guests_count: number;
  cancelled_at: string | null;
  cancel_token: string;
  created_at: string;
};

// ---------------- PUBLIC ----------------

export const getPublishedForm = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const { data: form } = await supabaseAdmin
      .from("registration_forms")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!form) return { form: null, questions: [], responsesCount: 0, attendeesCount: 0 };
    const f = form as unknown as RegistrationForm;
    const { data: questions } = await supabaseAdmin
      .from("registration_questions")
      .select("*")
      .eq("form_id", f.id)
      .order("position", { ascending: true });
    const { data: rows } = await supabaseAdmin
      .from("registration_responses")
      .select("guests_count, cancelled_at")
      .eq("form_id", f.id)
      .is("cancelled_at", null);
    const active = (rows ?? []) as Array<{ guests_count: number | null }>;
    const attendeesCount = active.reduce((n, r) => n + 1 + (r.guests_count ?? 0), 0);
    const all = (questions ?? []) as unknown as RegistrationQuestion[];
    const visible = all.filter((q) => isQuestionVisible(q, f.event_date));
    return {
      form: f,
      questions: visible,
      responsesCount: active.length,
      attendeesCount,
    };
  });

/** Public catalog search for the "what do you want to play?" question. */
export const searchCatalogGames = createServerFn({ method: "POST" })
  .inputValidator(z.object({ q: z.string().max(80) }))
  .handler(async ({ data }) => {
    const term = data.q.trim();
    if (term.length < 2) return { games: [] as Array<{ id: string; title: string }> };
    const { data: rows } = await supabaseAdmin
      .from("bgg_games")
      .select("id, title, shelf")
      .eq("is_active", true)
      .not("shelf", "is", null)
      .not("shelf", "in", '("on_demand","restocking","especiales")')
      .ilike("title", `%${term}%`)
      .order("title", { ascending: true })
      .limit(15);
    return {
      games: ((rows ?? []) as Array<{ id: string; title: string }>).map((g) => ({
        id: g.id,
        title: g.title,
      })),
    };
  });


export const submitRegistration = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    formId: z.string().uuid(),
    emailContact: z.string().email().max(255).optional(),
    guests: z.number().int().min(0).max(20).default(0),
    data: z.record(z.unknown()),
  }))
  .handler(async ({ data }) => {
    const { data: form } = await supabaseAdmin
      .from("registration_forms")
      .select("*")
      .eq("id", data.formId)
      .eq("is_published", true)
      .maybeSingle();
    if (!form) throw new Error("Formulario no disponible");
    const f = form as unknown as RegistrationForm;
    if (f.kind === "external" || f.external_mode) throw new Error("Este formulario es externo");
    if (f.closes_at && new Date(f.closes_at) < new Date()) {
      throw new Error("El plazo de inscripción ha finalizado");
    }
    const guests = f.allow_guests ? Math.min(data.guests, f.max_guests_per_response) : 0;
    if (f.max_responses) {
      const { data: rows } = await supabaseAdmin
        .from("registration_responses")
        .select("guests_count")
        .eq("form_id", f.id)
        .is("cancelled_at", null);
      const taken = ((rows ?? []) as Array<{ guests_count: number | null }>)
        .reduce((n, r) => n + 1 + (r.guests_count ?? 0), 0);
      if (taken + 1 + guests > f.max_responses) {
        throw new Error("No quedan plazas suficientes disponibles");
      }
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("registration_responses")
      .insert({
        form_id: f.id,
        email_contact: data.emailContact ?? null,
        guests_count: guests,
        data: data.data as never,
        payment_status: f.payment_required ? "pending" : "not_required",
      } as never)
      .select("id, cancel_token")
      .single();
    if (error) throw new Error(error.message);
    const row = inserted as { id: string; cancel_token: string };
    const responseId = row.id;

    // Fire-and-forget emails (never block the response)
    try {
      const { sendEmailSafe, TEAM_INBOX } = await import("@/lib/email/send.server");
      const { registrationTeamNotificationEmail } = await import("@/lib/email/templates.server");
      const { sendRegistrationEmail } = await import("@/lib/registrations-email.server");

      if (data.emailContact && f.send_confirmation_email !== false) {
        void sendRegistrationEmail("confirmation", f, {
          cancel_token: row.cancel_token,
          email_contact: data.emailContact,
          guests_count: guests,
          data: data.data as Record<string, unknown>,
        });
      }

      if (data.emailContact && f.reminder_enabled) {
        const { scheduleReminderEmails } = await import("@/lib/registrations-email.server");
        const ids = await scheduleReminderEmails(f, {
          cancel_token: row.cancel_token,
          email_contact: data.emailContact,
          guests_count: guests,
          data: data.data as Record<string, unknown>,
        });
        if (ids.length) {
          await supabaseAdmin
            .from("registration_responses")
            .update({ reminder_email_ids: ids } as never)
            .eq("id", responseId);
        }
      }


      const alert = registrationTeamNotificationEmail({
        formTitle: f.title,
        responseId,
        emailContact: data.emailContact ?? null,
        data: data.data as Record<string, unknown>,
      });
      void sendEmailSafe({
        to: TEAM_INBOX,
        subject: alert.subject,
        html: alert.html,
        replyTo: data.emailContact ?? undefined,
        tags: [{ name: "type", value: "registration_team_alert" }],
      });
    } catch (err) {
      console.error("[registrations] email dispatch error:", err);
    }

    return {
      ok: true,
      responseId,
      cancelToken: row.cancel_token,
      confirmation: f.confirmation_message,
    };
  });

// ---------------- PUBLIC: cancellation ----------------

const tokenSchema = z.object({ token: z.string().uuid() });

export const getCancellationInfo = createServerFn({ method: "POST" })
  .inputValidator(tokenSchema)
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin
      .from("registration_responses")
      .select("id, form_id, guests_count, cancelled_at, email_contact")
      .eq("cancel_token", data.token)
      .maybeSingle();
    if (!row) return { found: false as const };
    const r = row as { id: string; form_id: string; guests_count: number | null; cancelled_at: string | null; email_contact: string | null };
    const { data: form } = await supabaseAdmin
      .from("registration_forms")
      .select("title, slug, event_date, event_location")
      .eq("id", r.form_id)
      .maybeSingle();
    const f = (form ?? { title: "", slug: "", event_date: null, event_location: null }) as {
      title: string; slug: string; event_date: string | null; event_location: string | null;
    };
    return {
      found: true as const,
      cancelled: !!r.cancelled_at,
      guests: r.guests_count ?? 0,
      email: r.email_contact,
      title: f.title,
      slug: f.slug,
      eventDate: f.event_date,
      eventLocation: f.event_location,
    };
  });

export const cancelRegistration = createServerFn({ method: "POST" })
  .inputValidator(tokenSchema)
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin
      .from("registration_responses")
      .select("id, form_id, guests_count, cancelled_at, email_contact, data, reminder_email_ids")
      .eq("cancel_token", data.token)
      .maybeSingle();
    if (!row) throw new Error("Inscripción no encontrada");
    const r = row as { id: string; form_id: string; guests_count: number | null; cancelled_at: string | null; email_contact: string | null; data: Record<string, unknown>; reminder_email_ids: string[] | null };
    if (r.cancelled_at) return { ok: true, alreadyCancelled: true };
    const { error } = await supabaseAdmin
      .from("registration_responses")
      .update({ cancelled_at: new Date().toISOString(), reminder_email_ids: [] } as never)
      .eq("id", r.id);
    if (error) throw new Error(error.message);

    try {
      const { cancelScheduledReminders } = await import("@/lib/registrations-email.server");
      await cancelScheduledReminders(Array.isArray(r.reminder_email_ids) ? r.reminder_email_ids : []);
    } catch (err) {
      console.error("[registrations] reminder cancellation error:", err);
    }


    try {
      const { data: form } = await supabaseAdmin
        .from("registration_forms")
        .select("id, title, notify_emails")
        .eq("id", r.form_id)
        .maybeSingle();
      const f = form as { id: string; title: string; notify_emails: string[] } | null;
      if (f) {
        const { sendEmailSafe, TEAM_INBOX } = await import("@/lib/email/send.server");
        const { registrationCancelTeamEmail } = await import("@/lib/email/templates.server");
        const { participantName } = await import("@/lib/registrations-email.server");
        const tpl = registrationCancelTeamEmail({
          formTitle: f.title,
          emailContact: r.email_contact,
          userName: participantName(r.data) ?? null,
          guests: r.guests_count ?? 0,
          formId: f.id,
        });
        const to = f.notify_emails?.length ? f.notify_emails : [TEAM_INBOX];
        void sendEmailSafe({ to, subject: tpl.subject, html: tpl.html, tags: [{ name: "type", value: "registration_cancelled" }] });
      }
    } catch (err) {
      console.error("[registrations] cancel notification error:", err);
    }
    return { ok: true, alreadyCancelled: false };
  });

// ---------------- ADMIN ----------------


export const adminListForms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("registration_forms")
      .select("id, slug, title, kind, is_published, external_mode, created_at, max_responses, closes_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as Array<{ id: string; slug: string; title: string; kind: "form" | "external"; is_published: boolean; external_mode: string | null; created_at: string; max_responses: number | null; closes_at: string | null }>;
    const ids = rows.map((d) => d.id);
    let counts: Record<string, number> = {};
    if (ids.length) {
      const { data: rs } = await supabaseAdmin
        .from("registration_responses")
        .select("form_id")
        .in("form_id", ids);
      counts = ((rs ?? []) as Array<{ form_id: string }>).reduce<Record<string, number>>((acc, r) => {
        acc[r.form_id] = (acc[r.form_id] ?? 0) + 1;
        return acc;
      }, {});
    }
    return { forms: rows.map((f) => ({ ...f, responses: counts[f.id] ?? 0 })) };
  });

export const adminCreateForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
    title: z.string().min(1).max(200),
    kind: z.enum(["form", "external"]).default("form"),
    external_mode: z.enum(["redirect", "iframe"]).nullable().optional(),
    external_url: z.string().url().max(2000).nullable().optional(),
  }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    // Validate slug doesn't collide with reserved built-in routes
    const reserved = new Set([
      "admin", "app", "login", "super-admin", "blog", "medios", "ludoteca",
      "contacto", "contacte", "contact", "about", "sobre-nosotros", "qui-som",
      "actividades", "activitats", "activities", "como-funciona", "com-funciona",
      "how-it-works", "catan", "torneos", "tornejos", "tournaments",
      "blood-on-the-clocktower", "roles-ocultos", "rols-ocults", "hidden-roles",
      "cookies", "privacidad", "privacitat", "privacy", "aviso-legal", "avis-legal",
      "legal-notice", "terminos", "termes", "terms", "inscripcion", "invite",
      "api", "ca", "en", "sitemap.xml", "robots.txt",
    ]);
    if (reserved.has(data.slug)) {
      throw new Error(`El slug «${data.slug}» está reservado por el sistema. Usa otro nombre.`);
    }
    // Check collision with other forms / pages
    const { data: existingForm } = await supabaseAdmin
      .from("registration_forms").select("id").eq("slug", data.slug).maybeSingle();
    if (existingForm) throw new Error(`Ya existe una inscripción con el slug «${data.slug}».`);
    const { data: existingPage } = await supabaseAdmin
      .from("content_pages").select("id").or(`slug_es.eq.${data.slug},slug_ca.eq.${data.slug},slug_en.eq.${data.slug}`).maybeSingle();
    if (existingPage) throw new Error(`Ya existe una página con el slug «${data.slug}».`);

    const insertData: Record<string, unknown> = {
      slug: data.slug,
      title: data.title,
      kind: data.kind,
    };
    if (data.kind === "external") {
      insertData.external_mode = data.external_mode ?? "redirect";
      insertData.external_url = data.external_url ?? null;
    }
    const { data: row, error } = await supabaseAdmin
      .from("registration_forms")
      .insert(insertData as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (row as { id: string }).id };
  });

export const adminGetForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { data: form, error } = await supabaseAdmin
      .from("registration_forms").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    const { data: qs } = await supabaseAdmin
      .from("registration_questions").select("*").eq("form_id", data.id).order("position", { ascending: true });
    return {
      form: form as unknown as RegistrationForm,
      questions: (qs ?? []) as unknown as RegistrationQuestion[],
    };
  });

export const adminUpdateForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    id: z.string().uuid(),
    patch: z.object({
      slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/).optional(),
      title: z.string().max(200).optional(),
      description: z.string().max(5000).nullable().optional(),
      cover_image_url: z.string().url().nullable().optional(),
      cover_position: z.string().max(50).optional(),
      external_iframe_height: z.number().int().min(400).max(20000).optional(),
      is_published: z.boolean().optional(),
      kind: z.enum(["form", "external"]).optional(),
      external_mode: z.enum(["redirect", "iframe"]).nullable().optional(),
      external_url: z.string().url().max(2000).nullable().optional(),
      payment_required: z.boolean().optional(),
      payment_amount_cents: z.number().int().min(0).nullable().optional(),
      payment_currency: z.string().length(3).optional(),
      payment_instructions: z.string().max(2000).nullable().optional(),
      max_responses: z.number().int().min(1).nullable().optional(),
      closes_at: z.string().nullable().optional(),
      confirmation_message: z.string().max(2000).nullable().optional(),
      notify_emails: z.array(z.string().email()).max(10).optional(),
      event_date: z.string().nullable().optional(),
      event_location: z.string().max(300).nullable().optional(),
      allow_guests: z.boolean().optional(),
      max_guests_per_response: z.number().int().min(0).max(20).optional(),
      send_confirmation_email: z.boolean().optional(),
      confirmation_email_subject: z.string().max(200).nullable().optional(),
      confirmation_email_body: z.string().max(5000).nullable().optional(),
      reminder_enabled: z.boolean().optional(),
      reminder_at: z.string().nullable().optional(),
      reminder_subject: z.string().max(200).nullable().optional(),
      reminder_body: z.string().max(5000).nullable().optional(),
      reminder_offsets_hours: z.array(z.number().int().min(1).max(1440)).max(5).optional(),
    }),
  }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("registration_forms").update(data.patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin.from("registration_forms").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpsertQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    id: z.string().uuid().optional(),
    form_id: z.string().uuid(),
    position: z.number().int().min(0).max(1000),
    type: questionTypeSchema,
    required: z.boolean(),
    label: z.string().max(300),
    help: z.string().max(1000).nullable().optional(),
    options: z.array(z.object({
      value: z.string().min(1).max(120),
      label: z.string().max(200),
    })).max(50).default([]),
    special: z.enum(["guests", "game_pick"]).nullable().optional(),
    hide_after_wednesday: z.boolean().optional(),
  }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("registration_questions")
        .update({
          position: data.position, type: data.type, required: data.required,
          label: data.label, help: data.help,
          special: data.special ?? null,
          hide_after_wednesday: data.hide_after_wednesday ?? false,
          options: data.options as never,
        } as never)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("registration_questions")
      .insert({
        form_id: data.form_id, position: data.position, type: data.type, required: data.required,
        label: data.label, help: data.help,
        special: data.special ?? null,
        hide_after_wednesday: data.hide_after_wednesday ?? false,
        options: data.options as never,
      } as never)
      .select("id").single();
    if (error) throw new Error(error.message);
    return { id: (row as { id: string }).id };
  });

export const adminDeleteQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin.from("registration_questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReorderQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ form_id: z.string().uuid(), orderedIds: z.array(z.string().uuid()).max(100) }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    await Promise.all(data.orderedIds.map((id, idx) =>
      supabaseAdmin.from("registration_questions")
        .update({ position: idx } as never)
        .eq("id", id).eq("form_id", data.form_id)
    ));
    return { ok: true };
  });

export const adminListResponses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ form_id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { data: rows, error } = await supabaseAdmin
      .from("registration_responses")
      .select("*")
      .eq("form_id", data.form_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { responses: (rows ?? []) as unknown as RegistrationResponse[] };
  });

export const adminUpdateResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    id: z.string().uuid(),
    payment_status: z.enum(["pending", "paid", "refunded", "not_required"]).optional(),
    internal_notes: z.string().max(2000).nullable().optional(),
  }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const patch: Record<string, unknown> = {};
    if (data.payment_status) patch.payment_status = data.payment_status;
    if (data.internal_notes !== undefined) patch.internal_notes = data.internal_notes;
    const { error } = await supabaseAdmin.from("registration_responses").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin.from("registration_responses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Manually send the reminder email to every active registration (or a single one). */
export const adminSendReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ form_id: z.string().uuid(), response_id: z.string().uuid().optional() }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { data: form } = await supabaseAdmin
      .from("registration_forms").select("*").eq("id", data.form_id).maybeSingle();
    if (!form) throw new Error("Formulario no encontrado");
    const f = form as unknown as RegistrationForm;
    let query = supabaseAdmin
      .from("registration_responses")
      .select("id, cancel_token, email_contact, guests_count, data")
      .eq("form_id", f.id)
      .is("cancelled_at", null)
      .not("email_contact", "is", null);
    if (data.response_id) query = query.eq("id", data.response_id);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as Array<{ cancel_token: string; email_contact: string | null; guests_count: number | null; data: Record<string, unknown> }>;
    const { sendRegistrationEmail } = await import("@/lib/registrations-email.server");
    for (const r of list) {
      await sendRegistrationEmail("reminder", f, r);
    }
    return { sent: list.length };
  });

/** Preview of the emails as the participant will receive them. */
export const adminPreviewEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ form_id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { data: form } = await supabaseAdmin
      .from("registration_forms").select("*").eq("id", data.form_id).maybeSingle();
    if (!form) throw new Error("Formulario no encontrado");
    const f = form as unknown as RegistrationForm;
    const { buildRegistrationEmail } = await import("@/lib/registrations-email.server");
    const { registrationEventEmail } = await import("@/lib/email/templates.server");
    const sample = {
      cancel_token: "00000000-0000-0000-0000-000000000000",
      email_contact: "participante@ejemplo.com",
      guests_count: f.allow_guests ? 1 : 0,
      data: { nombre: "Marta" },
    };
    const make = (kind: "confirmation" | "reminder") => {
      const built = buildRegistrationEmail(kind, f, sample);
      return registrationEventEmail({ kind, formTitle: f.title, ...built });
    };
    return { confirmation: make("confirmation"), reminder: make("reminder") };
  });
