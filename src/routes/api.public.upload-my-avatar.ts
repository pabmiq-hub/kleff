import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/upload-my-avatar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
        if (!token) return new Response("Unauthorized", { status: 401 });

        const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
        if (userErr || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const formData = await request.formData();
        const file = formData.get("file");
        if (!(file instanceof File)) return new Response("Missing file", { status: 400 });
        if (file.size > 2 * 1024 * 1024) return new Response("File too large", { status: 413 });
        if (!file.type.startsWith("image/")) return new Response("Invalid file type", { status: 400 });

        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `users/${userId}/${Date.now()}.${ext}`;
        const buf = new Uint8Array(await file.arrayBuffer());

        const { error: upErr } = await supabaseAdmin.storage
          .from("avatars")
          .upload(path, buf, { contentType: file.type, upsert: true, cacheControl: "31536000" });
        if (upErr) return new Response(upErr.message, { status: 500 });

        const { data: pub } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);

        await supabaseAdmin
          .from("profiles")
          .update({ avatar_url: pub.publicUrl })
          .eq("id", userId);

        return Response.json({ url: pub.publicUrl });
      },
    },
  },
});
