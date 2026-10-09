import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Super admin, or a delegated user with an active "konektum" permission. */
export async function canManageKonektum(userId: string): Promise<boolean> {
  const { data } = await (supabaseAdmin as any).rpc("tiene_permiso", {
    _user_id: userId,
    _recurso: "konektum",
    _recurso_id: null,
  });
  return data === true;
}
