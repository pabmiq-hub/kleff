// Server-only helpers for "Sign in with Ludoya" (standard OpenID Connect).
// Issuer: https://api.ludoya.com — everything is discovered from
// /.well-known/openid-configuration.

const ISSUER = "https://api.ludoya.com";

export const LUDOYA_SCOPES = "openid profile email";

function clientId(): string {
  const v = process.env["LUDOYA_OIDC_CLIENT_ID"];
  if (!v) throw new Error("LUDOYA_OIDC_CLIENT_ID no configurado");
  return v;
}

function clientSecret(): string {
  const v = process.env["LUDOYA_OIDC_CLIENT_SECRET"];
  if (!v) throw new Error("LUDOYA_OIDC_CLIENT_SECRET no configurado");
  return v;
}

export function ludoyaOidcConfigured(): boolean {
  return Boolean(process.env["LUDOYA_OIDC_CLIENT_ID"] && process.env["LUDOYA_OIDC_CLIENT_SECRET"]);
}

interface Discovery {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
}

let cachedDiscovery: { at: number; doc: Discovery } | null = null;

export async function discover(): Promise<Discovery> {
  if (cachedDiscovery && Date.now() - cachedDiscovery.at < 10 * 60 * 1000) {
    return cachedDiscovery.doc;
  }
  const res = await fetch(`${ISSUER}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error(`No se pudo leer la configuración OIDC de Ludoya (${res.status})`);
  const doc = (await res.json()) as Discovery;
  if (!doc.authorization_endpoint || !doc.token_endpoint) {
    throw new Error("La configuración OIDC de Ludoya está incompleta");
  }
  cachedDiscovery = { at: Date.now(), doc };
  return doc;
}

// ---------------- Signed, single-use-ish state ----------------
// Payload: base64url(JSON) . base64url(HMAC-SHA256). Bound to the app user id
// and short-lived, so a state cannot be replayed for another account.

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(input: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(clientSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return b64url(new Uint8Array(sig));
}

export async function signState(userId: string): Promise<string> {
  const payload = b64url(
    new TextEncoder().encode(
      JSON.stringify({ u: userId, n: crypto.randomUUID(), e: Date.now() + 10 * 60 * 1000 }),
    ),
  );
  return `${payload}.${await hmac(payload)}`;
}

function decodeState(state: string): { u: string; n: string; e: number } | null {
  const [payload] = state.split(".");
  if (!payload) return null;
  try {
    return JSON.parse(new TextDecoder().decode(fromB64url(payload))) as {
      u: string;
      n: string;
      e: number;
    };
  } catch {
    return null;
  }
}

/** The nonce is the random value embedded in the signed state (OIDC replay protection). */
export function nonceFromState(state: string): string | null {
  return decodeState(state)?.n ?? null;
}

export async function verifyState(state: string, userId: string): Promise<boolean> {
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return false;
  if ((await hmac(payload)) !== sig) return false;
  const data = decodeState(state);
  if (!data) return false;
  return data.u === userId && data.e > Date.now();
}

// ---------------- Authorization + token exchange ----------------

export async function buildAuthorizationUrl(state: string, redirectUri: string): Promise<string> {
  const { authorization_endpoint } = await discover();
  const url = new URL(authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId());
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", LUDOYA_SCOPES);
  url.searchParams.set("state", state);
  return url.toString();
}

export interface LudoyaIdentity {
  sub: string;
  username: string | null;
  name: string | null;
  email: string | null;
  picture: string | null;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const part = token.split(".")[1];
  if (!part) throw new Error("id_token inválido");
  return JSON.parse(new TextDecoder().decode(fromB64url(part))) as Record<string, unknown>;
}

export async function exchangeCode(code: string, redirectUri: string): Promise<LudoyaIdentity> {
  const { token_endpoint, userinfo_endpoint } = await discover();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId(),
    client_secret: clientSecret(),
  });
  const res = await fetch(token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Ludoya rechazó el intercambio de código (${res.status}): ${text.slice(0, 200)}`);

  let tokens: { id_token?: string; access_token?: string };
  try {
    tokens = JSON.parse(text) as { id_token?: string; access_token?: string };
  } catch {
    throw new Error("Respuesta inválida del endpoint de token de Ludoya");
  }

  let claims: Record<string, unknown> = {};
  if (tokens.id_token) claims = decodeJwtPayload(tokens.id_token);

  // Fill gaps from userinfo when available (username/avatar are the ones we need).
  if (userinfo_endpoint && tokens.access_token) {
    try {
      const ui = await fetch(userinfo_endpoint, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (ui.ok) claims = { ...claims, ...((await ui.json()) as Record<string, unknown>) };
    } catch {
      /* non fatal */
    }
  }

  const str = (k: string): string | null => {
    const v = claims[k];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  const sub = str("sub");
  if (!sub) throw new Error("Ludoya no devolvió un identificador de usuario");

  return {
    sub,
    username: str("preferred_username") ?? str("username") ?? str("nickname"),
    name: str("name") ?? str("given_name"),
    email: str("email"),
    picture: str("picture") ?? str("avatarUrl") ?? str("avatar_url"),
  };
}
