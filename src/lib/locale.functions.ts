import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyLocale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("preferred_locale")
      .eq("id", context.userId)
      .maybeSingle();
    return { locale: (data?.preferred_locale ?? "es") as "es" | "ca" | "en" };
  });

export const updateMyLocale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ locale: z.enum(["es", "ca", "en"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ preferred_locale: data.locale })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });
