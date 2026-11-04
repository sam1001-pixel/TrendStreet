/**
 * Shared HMAC-SHA256 session tokens for admin and customer sessions.
 * Runs in both Node.js and the Edge runtime (Web Crypto only — no Node imports).
 *
 * - The signing secret comes from AUTH_SECRET (or SESSION_SECRET / NEXTAUTH_SECRET).
 * - In production there is NO fallback: without a secret, signing throws and every
 *   token fails verification (fail closed).
 * - Admin and customer tokens are signed with different derived keys, so a token of
 *   one kind can never be replayed as the other.
 */

export type TokenScope = "admin" | "customer" | "admin-device";

const DEV_ONLY_SECRET = "dev-only-insecure-secret-do-not-use-in-production";

export function getAuthSecret(): string | null {
  const candidates = [process.env.AUTH_SECRET, process.env.SESSION_SECRET, process.env.NEXTAUTH_SECRET];
  // Ignore the placeholder values from .env.example.
  const secret = candidates.find((v) => v && !/replace_with/i.test(v));
  if (secret && secret.length >= 32) return secret;
  if (secret && process.env.NODE_ENV !== "production") return secret;
  if (process.env.NODE_ENV === "production") {
    console.error("[Auth] AUTH_SECRET is missing or shorter than 32 characters. All sessions are rejected until it is set.");
    return null;
  }
  return DEV_ONLY_SECRET;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Admin tokens can use their own secret (ADMIN_AUTH_SECRET, 32+ characters), so a leak of the
 * shared AUTH_SECRET alone can't forge an admin session. Without it, admin keys are derived from
 * AUTH_SECRET with a different label than customer keys (as before).
 */
function secretFor(scope: TokenScope): string | null {
  if (scope !== "customer") {
    const adminSecret = process.env.ADMIN_AUTH_SECRET;
    if (adminSecret && adminSecret.length >= 32 && !/replace_with/i.test(adminSecret)) return adminSecret;
  }
  return getAuthSecret();
}

async function getHmacKey(scope: TokenScope): Promise<CryptoKey | null> {
  const secret = secretFor(scope);
  if (!secret) return null;
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`trendstreet:${scope}:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Signs `payload` as base64url(JSON).base64url(HMAC). Throws if no secret is configured. */
export async function signToken(payload: object, scope: TokenScope): Promise<string> {
  const key = await getHmacKey(scope);
  if (!key) throw new Error("AUTH_SECRET is not configured; refusing to issue a session.");
  const enc = new TextEncoder();
  const payloadStr = uint8ArrayToBase64Url(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(payloadStr)));
  return `${payloadStr}.${uint8ArrayToBase64Url(sig)}`;
}

/** Returns the decoded payload if the signature is valid and `expiresAt` is in the future, else null. */
export async function verifyToken<T extends { expiresAt: number }>(token: string | undefined, scope: TokenScope): Promise<T | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadStr, signatureStr] = parts;

  try {
    const key = await getHmacKey(scope);
    if (!key) return null;
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToUint8Array(signatureStr) as unknown as BufferSource,
      new TextEncoder().encode(payloadStr)
    );
    if (!isValid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(payloadStr))) as T;
    if (typeof payload?.expiresAt !== "number" || Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}
