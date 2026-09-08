/**
 * Server-only AI helper.
 *
 * Priority:
 *  1) GOOGLE_AI_API_KEY  -> Google AI Studio (Gemini) directly, billed on the
 *     project's own Google account. No Lovable AI credits are consumed.
 *  2) LOVABLE_API_KEY    -> Lovable AI Gateway (legacy fallback).
 *
 * Returns the raw model text, or null on any failure (callers must degrade
 * gracefully — a failed translation should never lose the user's content).
 */

const GOOGLE_MODEL = process.env.GOOGLE_AI_MODEL || "gemini-3.6-flash";
const GATEWAY_MODEL = "google/gemini-3.6-flash";

export type AiTextOptions = {
  system: string;
  user: string;
  /** Ask the model for a strict JSON object response. */
  json?: boolean;
  /** Log prefix, e.g. "[blog]". */
  tag?: string;
};

export function aiProvider(): "google" | "lovable" | null {
  if (process.env.GOOGLE_AI_API_KEY) return "google";
  if (process.env.LOVABLE_API_KEY) return "lovable";
  return null;
}

async function callGoogle(opts: AiTextOptions, apiKey: string): Promise<string | null> {
  const tag = opts.tag ?? "[ai]";
  const model = encodeURIComponent(GOOGLE_MODEL);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: [{ text: opts.user }] }],
      generationConfig: {
        temperature: 0.2,
        ...(opts.json ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error(`${tag} Google AI ${res.status}: ${txt.slice(0, 300)}`);
    return null;
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  return text.length > 0 ? text : null;
}

async function callLovable(opts: AiTextOptions, apiKey: string): Promise<string | null> {
  const tag = opts.tag ?? "[ai]";
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GATEWAY_MODEL,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error(`${tag} AI gateway ${res.status}: ${txt.slice(0, 300)}`);
    return null;
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content?.trim();
  return content && content.length > 0 ? content : null;
}

/** Strip ```json fences some models add around JSON answers. */
export function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```[a-zA-Z]*\s*/, "")
    .replace(/```$/, "")
    .trim();
}

export async function aiText(opts: AiTextOptions): Promise<string | null> {
  const tag = opts.tag ?? "[ai]";
  const provider = aiProvider();
  if (!provider) {
    console.warn(`${tag} no AI key configured (GOOGLE_AI_API_KEY / LOVABLE_API_KEY) — skipping`);
    return null;
  }
  try {
    const out =
      provider === "google"
        ? await callGoogle(opts, process.env.GOOGLE_AI_API_KEY!)
        : await callLovable(opts, process.env.LOVABLE_API_KEY!);
    return out ? (opts.json ? stripCodeFence(out) : out) : null;
  } catch (e) {
    console.error(`${tag} AI request failed`, e);
    return null;
  }
}
