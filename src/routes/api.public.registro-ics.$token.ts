import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/registro-ics/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = params.token;
        if (!/^[0-9a-f-]{36}$/i.test(token)) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("registration_responses")
          .select("form_id")
          .eq("cancel_token", token)
          .maybeSingle();
        if (!row) return new Response("Not found", { status: 404 });
        const { data: form } = await supabaseAdmin
          .from("registration_forms")
          .select("id, slug, title, description, event_date, event_location")
          .eq("id", (row as { form_id: string }).form_id)
          .maybeSingle();
        if (!form) return new Response("Not found", { status: 404 });
        const { icsForResponse } = await import("@/lib/registrations-email.server");
        const ics = icsForResponse(
          form as unknown as Parameters<typeof icsForResponse>[0],
          token,
        );
        if (!ics) return new Response("Event has no date", { status: 404 });
        return new Response(ics, {
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `attachment; filename="kleff-evento.ics"`,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
