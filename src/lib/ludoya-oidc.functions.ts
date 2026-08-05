import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function redirectUriFrom(requestUrl: string): string {
  const override = process.env["LUDOYA_OIDC_REDIRECT_URI"];
  if (override) return override;
  return new URL("/auth/ludoya/callback", requestUrl).toString();
}

export const getLudoyaLinkStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ludoyaOidcConfigured } = await import("@/lib/ludoya-oidc.server");
    const { data } = await context.supabase
      .from("profiles")
      .select("ludoya_username, ludoya_user_id, ludoya_display_name, ludoya_avatar_url, ludoya_linked_at")
      .eq("id", context.userId)
      .maybeSingle();
    return { configured: ludoyaOidcConfigured(), profile: data ?? null };
  });

export const startLudoyaLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { signState, buildAuthorizationUrl } = await import("@/lib/ludoya-oidc.server");
    const request = getRequest();
    if (!request) throw new Error("La vinculación debe iniciarse desde la aplicación");
    const redirectUri = redirectUriFrom(request.url);
    const state = await signState(context.userId);
    const authorizationUrl = await buildAuthorizationUrl(state, redirectUri);
    return { authorizationUrl };
  });

export const completeLudoyaLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().min(4).max(2048), state: z.string().min(4).max(2048) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { verifyState, exchangeCode, nonceFromState } = await import("@/lib/ludoya-oidc.server");
    const request = getRequest();
    if (!request) throw new Error("Solicitud inválida");
    if (!(await verifyState(data.state, context.userId))) {
      throw new Error("La sesión de vinculación ha caducado. Inténtalo de nuevo.");
    }

    const identity = await exchangeCode(data.code, redirectUriFrom(request.url), nonceFromState(data.state));

    // Another member cannot claim the same Ludoya account.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: taken } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("ludoya_user_id", identity.sub)
      .neq("id", context.userId)
      .maybeSingle();
    if (taken) throw new Error("Esa cuenta de Ludoya ya está vinculada a otro socio");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        ludoya_user_id: identity.sub,
        ludoya_username: identity.username,
        ludoya_display_name: identity.name,
        ludoya_avatar_url: identity.picture,
        ludoya_linked_at: new Date().toISOString(),
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);

    // Fallback: make sure they end up in the KLEFF group even if the login
    // join policy did not add them automatically.
    let invite: { status: string } = { status: "skipped" };
    if (identity.username) {
      try {
        const { inviteToKleffGroup } = await import("@/lib/ludoya.server");
        invite = await inviteToKleffGroup(identity.username);
      } catch {
        /* non fatal */
      }
    }

    await supabaseAdmin.from("notifications").insert({
      user_id: context.userId,
      type: "ludoya_linked",
      title: "Cuenta de Ludoya vinculada",
      body: identity.username
        ? `Tu cuenta @${identity.username} ya está conectada con KLEFF.`
        : "Tu cuenta de Ludoya ya está conectada con KLEFF.",
      url: "/app/profile",
    });

    return { ok: true as const, username: identity.username, invite: invite.status };
  });

export const unlinkLudoyaAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        ludoya_user_id: null,
        ludoya_username: null,
        ludoya_display_name: null,
        ludoya_avatar_url: null,
        ludoya_linked_at: null,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
