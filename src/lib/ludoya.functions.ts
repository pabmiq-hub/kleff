import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  findLudoyaUserByUsername,
  inviteToKleffGroup,
  searchLudoyaUsers,
  searchLudoyaBoardgames,
  listLudoyaMatches,
  createLudoyaMatch,
} from "@/lib/ludoya.server";

// -------- Public (no auth): validate username during invite acceptance --------

const usernameSchema = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-zA-Z0-9_.-]+$/);

export const checkLudoyaUsername = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ username: usernameSchema }).parse(input))
  .handler(async ({ data }) => {
    const user = await findLudoyaUserByUsername(data.username);
    if (!user) return { exists: false as const };
    return {
      exists: true as const,
      user: { id: user.id, username: user.username, name: user.name, avatarUrl: user.avatarUrl },
    };
  });

// -------- Authenticated: search Ludoya users (for profile linking helper) --------

export const searchLudoyaUsersFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ query: z.string().min(2).max(60) }).parse(input),
  )
  .handler(async ({ data }) => {
    const results = await searchLudoyaUsers(data.query, 10, 0);
    return { results };
  });

// -------- Authenticated: link my Ludoya account + invite to KLEFF --------

export const linkLudoyaAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ username: usernameSchema.nullable() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Unlink
    if (data.username === null) {
      const { error } = await context.supabase
        .from("profiles")
        .update({ ludoya_username: null })
        .eq("id", context.userId);
      if (error) throw new Error(error.message);
      return { linked: false as const };
    }

    const found = await findLudoyaUserByUsername(data.username);
    if (!found) throw new Error("No existe ese usuario en Ludoya");

    const { error } = await context.supabase
      .from("profiles")
      .update({ ludoya_username: found.username })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);

    // Send an invite to the KLEFF group. If already a member the API responds
    // 409 which we surface as "already"; not_found shouldn't happen here.
    const invite = await inviteToKleffGroup(found.username);

    return {
      linked: true as const,
      user: found,
      invite: { status: invite.status, httpStatus: invite.httpStatus, message: invite.message ?? null },
    };
  });

// -------- Authenticated: send/re-send a KLEFF group invite --------

export const inviteMeToKleff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("ludoya_username")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile?.ludoya_username) throw new Error("Vincula primero tu cuenta de Ludoya");
    const result = await inviteToKleffGroup(profile.ludoya_username);
    return result;
  });

// -------- Authenticated: search boardgames from Ludoya --------

export const searchLudoyaBoardgamesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ query: z.string().min(2).max(80) }).parse(input),
  )
  .handler(async ({ data }) => {
    const results = await searchLudoyaBoardgames(data.query, 20, 0);
    return { results };
  });

