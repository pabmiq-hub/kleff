import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase as publicSupabase } from "@/integrations/supabase/client";

export type TeamMemberRow = {
  id: string;
  name: string;
  emoji: string;
  photo_url: string | null;
  favorite_game: string;
  lucky_number: string;
  sort_order: number;
  active: boolean;
  role_es: string;
  role_ca: string;
  role_en: string;
  bio_es: string;
  bio_ca: string;
  bio_en: string;
  color_es: string;
  color_ca: string;
  color_en: string;
};

export const listTeamMembersPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicSupabase
    .from("team_members")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TeamMemberRow[];
});

export const adminListTeamMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("team_members")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as TeamMemberRow[];
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  emoji: z.string().min(1).max(10),
  photo_url: z.string().max(1000).nullable().optional(),
  favorite_game: z.string().max(200).default("—"),
  lucky_number: z.string().max(20).default("—"),
  sort_order: z.number().int().default(0),
  active: z.boolean().default(true),
  role_es: z.string().max(200).default(""),
  role_ca: z.string().max(200).default(""),
  role_en: z.string().max(200).default(""),
  bio_es: z.string().max(2000).default(""),
  bio_ca: z.string().max(2000).default(""),
  bio_en: z.string().max(2000).default(""),
  color_es: z.string().max(80).default("—"),
  color_ca: z.string().max(80).default("—"),
  color_en: z.string().max(80).default("—"),
});

export const adminUpsertTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => upsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const payload = { ...data, photo_url: data.photo_url ?? null };
    if (data.id) {
      const { error } = await context.supabase.from("team_members").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { id: _ignore, ...insertPayload } = payload;
      const { data: row, error } = await context.supabase
        .from("team_members")
        .insert(insertPayload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: row.id as string };
    }
  });

export const adminDeleteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("team_members").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
