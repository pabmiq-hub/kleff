import { createServerFn } from "@tanstack/react-start";

/** Temporary diagnostic: test the stored GOOGLE_AI_API_KEY against Gemini. */
export const testGoogleAiKey = createServerFn({ method: "POST" }).handler(
  async () => {
    const key = process.env.GOOGLE_AI_API_KEY;
    if (!key) return { ok: false, error: "GOOGLE_AI_API_KEY no está guardada" };
    const model = process.env.GOOGLE_AI_MODEL || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Di solo: ok" }] }],
      }),
    });
    const body = await res.text().catch(() => "");
    return {
      ok: res.ok,
      status: res.status,
      keyLen: key.length,
      keyPrefix: key.slice(0, 6),
      body: body.slice(0, 400),
    };
  },
);
