import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertSuperAdmin } from "@/lib/assert-role.server";

export type MediaAppearance = {
  id: string;
  url: string;
  outlet: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  dateLabel: string | null;
  year: number;
  month: number;
  displayOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

function mapRow(row: any): MediaAppearance {
  return {
    id: row.id,
    url: row.url,
    outlet: row.outlet,
    title: row.title,
    description: row.description ?? null,
    imageUrl: row.image_url ?? null,
    dateLabel: row.date_label ?? null,
    year: row.year,
    month: row.month,
    displayOrder: row.display_order ?? 0,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ----- Public listing (only published) -----
export const listMediaAppearances = createServerFn({ method: "GET" }).handler(
  async (): Promise<MediaAppearance[]> => {
    const { data, error } = await supabaseAdmin
      .from("media_appearances")
      .select("*")
      .eq("is_published", true)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .order("display_order", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRow);
  },
);

// ----- Admin listing (includes drafts) -----
export const adminListMediaAppearances = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MediaAppearance[]> => {
    await assertSuperAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("media_appearances")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .order("display_order", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRow);
  });

export const adminGetMediaAppearance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }): Promise<MediaAppearance | null> => {
    await assertSuperAdmin(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("media_appearances")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? mapRow(row) : null;
  });

const upsertSchema = z.object({
  url: z.string().url().max(2048),
  outlet: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).nullable().optional(),
  imageUrl: z.string().url().max(2048).nullable().optional().or(z.literal("")),
  dateLabel: z.string().max(40).nullable().optional(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  displayOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

export const adminCreateMediaAppearance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(upsertSchema)
  .handler(async ({ data, context }): Promise<MediaAppearance> => {
    await assertSuperAdmin(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("media_appearances")
      .insert({
        url: data.url,
        outlet: data.outlet,
        title: data.title,
        description: data.description || null,
        image_url: data.imageUrl || null,
        date_label: data.dateLabel || null,
        year: data.year,
        month: data.month,
        display_order: data.displayOrder ?? 0,
        is_published: data.isPublished ?? true,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapRow(row);
  });

export const adminUpdateMediaAppearance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(upsertSchema.extend({ id: z.string().uuid() }))
  .handler(async ({ data, context }): Promise<MediaAppearance> => {
    await assertSuperAdmin(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("media_appearances")
      .update({
        url: data.url,
        outlet: data.outlet,
        title: data.title,
        description: data.description || null,
        image_url: data.imageUrl || null,
        date_label: data.dateLabel || null,
        year: data.year,
        month: data.month,
        display_order: data.displayOrder ?? 0,
        is_published: data.isPublished ?? true,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapRow(row);
  });

export const adminDeleteMediaAppearance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("media_appearances")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
