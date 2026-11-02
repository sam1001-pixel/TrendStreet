import { signToken, verifyToken } from "./session-token";

export const SESSION_COOKIE_NAME = "ts_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours in seconds

export interface SessionPayload {
  email: string;
  role: "admin";
  issuedAt: number;
  expiresAt: number;
}

/**
 * Creates a signed admin session token. Runs in both Node.js and Edge Runtime.
 * Throws if AUTH_SECRET is not configured in production.
 */
export async function signSessionToken(email: string): Promise<string> {
  const payload: SessionPayload = {
    email,
    role: "admin",
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  };
  return signToken(payload, "admin");
}

/** Verifies a signed admin session token. Returns the payload, or null if tampered, expired or unconfigured. */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  const payload = await verifyToken<SessionPayload>(token, "admin");
  if (!payload || payload.role !== "admin" || typeof payload.email !== "string") return null;
  return payload;
}

/**
 * Determines whether the incoming request is arriving over HTTPS.
 * Used to avoid setting the 'Secure' cookie flag over plain-HTTP localhost.
 */
export function isRequestSecure(req: { nextUrl?: { protocol: string }; headers: Headers }): boolean {
  if (process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV) return true;
  const proto = req.headers.get("x-forwarded-proto") || "";
  if (proto.includes("https")) return true;
  if (req.nextUrl?.protocol === "https:") return true;
  const host = req.headers.get("host") || "";
  if (host.includes("localhost") || host.includes("127.0.0.1") || host.includes("[::1]")) return false;
  return process.env.NODE_ENV === "production";
}

/** Constant-time string equality. Works in Node.js and Edge Runtime. */
export function timingSafeEqualStr(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// Admin credential checks live in ./admin-credentials (Node-only: they use PBKDF2), so this module
// stays safe to import from the Edge middleware.

/**
 * Route-level authorization check for admin API routes, independent of the Edge middleware.
 * Only the httpOnly session cookie is accepted.
 */
export async function requireAdminSession(
  req: import("next/server").NextRequest
): Promise<
  | { authorized: true; session: SessionPayload }
  | { authorized: false; response: import("next/server").NextResponse }
> {
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    const { NextResponse } = await import("next/server");
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized: Valid administrative session token required." },
        { status: 401 }
      ),
    };
  }

  return { authorized: true, session };
}
