import { createFileRoute } from "@tanstack/react-router";

/** Temporary diagnostic endpoint: verifies GOOGLE_AI_API_KEY against Gemini. */
export const Route = createFileRoute("/api/public/ai-test")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env.GOOGLE_AI_API_KEY;
        if (!key) {
          return Response.json({ ok: false, error: "GOOGLE_AI_API_KEY no guardada" });
        }
        const model = process.env.GOOGLE_AI_MODEL || "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Di solo: ok" }] }],
          }),
        });
        const body = await res.text().catch(() => "");
        return Response.json({
          ok: res.ok,
          status: res.status,
          keyLen: key.length,
          keyPrefix: key.slice(0, 6),
          body: body.slice(0, 400),
        });
      },
    },
  },
});
