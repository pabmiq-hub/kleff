import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createHash } from "crypto";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const Route = createFileRoute("/api/public/upload-invite-avatar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        if (!token) return new Response("Missing token", { status: 400 });

        // Validate the invitation token
        const { data: invite, error } = await supabaseAdmin
          .from("invitations")
          .select("id, expires_at, accepted_at, revoked_at")
          .eq("token_hash", hashToken(token))
          .maybeSingle();
        if (error || !invite) return new Response("Invalid token", { status: 401 });
        if (invite.accepted_at || invite.revoked_at || new Date(invite.expires_at) < new Date()) {
          return new Response("Expired token", { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file");
        if (!(file instanceof File)) return new Response("Missing file", { status: 400 });
        if (file.size > 2 * 1024 * 1024) return new Response("File too large", { status: 413 });
        if (!file.type.startsWith("image/")) return new Response("Invalid file type", { status: 400 });

        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `pending/${invite.id}-${Date.now()}.${ext}`;
        const buf = new Uint8Array(await file.arrayBuffer());

        const { error: upErr } = await supabaseAdmin.storage
          .from("avatars")
          .upload(path, buf, { contentType: file.type, upsert: true, cacheControl: "31536000" });
        if (upErr) return new Response(upErr.message, { status: 500 });

        const { data: pub } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);
        return Response.json({ url: pub.publicUrl });
      },
    },
  },
});
