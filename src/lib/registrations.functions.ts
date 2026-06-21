import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertSuperAdmin } from "@/lib/assert-role.server";

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
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RegistrationResponse = {
  id: string;
  form_id: string;
  email_contact: string | null;
  data: Record<string, any>;
  payment_status: "pending" | "paid" | "refunded" | "not_required";
  internal_notes: string | null;
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
    if (!form) return { form: null, questions: [], responsesCount: 0 };
    const f = form as unknown as RegistrationForm;
    const { data: questions } = await supabaseAdmin
      .from("registration_questions")
      .select("*")
      .eq("form_id", f.id)
      .order("position", { ascending: true });
    const { count } = await supabaseAdmin
      .from("registration_responses")
      .select("id", { count: "exact", head: true })
      .eq("form_id", f.id);
    return {
      form: f,
      questions: (questions ?? []) as unknown as RegistrationQuestion[],
      responsesCount: count ?? 0,
    };
  });

export const submitRegistration = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    formId: z.string().uuid(),
    emailContact: z.string().email().max(255).optional(),
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
    if (f.max_responses) {
      const { count } = await supabaseAdmin
        .from("registration_responses")
        .select("id", { count: "exact", head: true })
        .eq("form_id", f.id);
      if ((count ?? 0) >= f.max_responses) {
        throw new Error("No quedan plazas disponibles");
      }
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("registration_responses")
      .insert({
        form_id: f.id,
        email_contact: data.emailContact ?? null,
        data: data.data as never,
        payment_status: f.payment_required ? "pending" : "not_required",
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return {
      ok: true,
      responseId: (inserted as { id: string }).id,
      confirmation: f.confirmation_message,
    };
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
      external_iframe_height: z.number().int().min(400).max(8000).optional(),
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
  }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("registration_questions")
        .update({
          position: data.position, type: data.type, required: data.required,
          label: data.label, help: data.help,
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
