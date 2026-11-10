import { signToken, verifyToken } from "./session-token";

export const SESSION_COOKIE_NAME = "ts_admin_session";
export const SECURE_SESSION_COOKIE_NAME = "__Host-ts_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours in seconds

export function getAdminSessionCookieName(secure: boolean): string {
  return secure ? SECURE_SESSION_COOKIE_NAME : SESSION_COOKIE_NAME;
}

export function extractAdminToken(req: { cookies: { get(name: string): { value: string } | undefined } }): string | undefined {
  return req.cookies.get(SECURE_SESSION_COOKIE_NAME)?.value || req.cookies.get(SESSION_COOKIE_NAME)?.value || undefined;
}

export function setAdminSessionCookie(
  res: { cookies: { set(opts: { name: string; value: string; httpOnly: boolean; secure: boolean; sameSite: "strict"; path: string; maxAge: number }): void } },
  req: { nextUrl?: { protocol: string }; headers: Headers },
  token: string
) {
  const secure = isRequestSecure(req);
  const name = getAdminSessionCookieName(secure);
  res.cookies.set({
    name,
    value: token,
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  if (secure) {
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
  }
}

export function clearAdminSessionCookie(
  res: { cookies: { set(opts: { name: string; value: string; httpOnly: boolean; secure: boolean; sameSite: "strict"; path: string; maxAge: number }): void } },
  req?: { nextUrl?: { protocol: string }; headers: Headers }
) {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set({
    name: SECURE_SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export interface SessionPayload {
  email: string;
  role: "admin";
  issuedAt: number;
  expiresAt: number;
  /** Fingerprint of the admin login settings when the session started (see adminCredentialVersion). */
  cv?: string;
  /** Random session id, so one session can be revoked on sign-out (see lib/admin-guard.ts). */
  sid?: string;
}

/**
 * Changes whenever the admin email, password, 2-step secret or ADMIN_SESSION_VERSION changes.
 * Sessions carry it, so changing the password (or bumping ADMIN_SESSION_VERSION) signs out every
 * device straight away — including a stolen session cookie. Works in Edge and Node.
 */
export async function adminCredentialVersion(): Promise<string> {
  const material = [
    process.env.ADMIN_EMAIL || "",
    process.env.ADMIN_PASSWORD_HASH || "",
    process.env.ADMIN_PASSWORD || "",
    process.env.ADMIN_TOTP_SECRET || "",
    process.env.ADMIN_SESSION_VERSION || "",
  ].join("|");
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(material)));
  return Array.from(digest.slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
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
    cv: await adminCredentialVersion(),
    sid: randomId(),
  };
  return signToken(payload, "admin");
}

/** Verifies a signed admin session token. Returns the payload, or null if tampered, expired or unconfigured. */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  const payload = await verifyToken<SessionPayload>(token, "admin");
  if (!payload || payload.role !== "admin" || typeof payload.email !== "string") return null;
  // Signed before the login settings last changed → no longer valid.
  if (payload.cv !== (await adminCredentialVersion())) return null;
  if (payload.email !== (process.env.ADMIN_EMAIL || "").toLowerCase().trim()) return null;
  return payload;
}

function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// Trusted admin browsers ("device cookie")
// After a successful sign-in the browser gets a signed, httpOnly cookie. When many failed
// sign-ins hit the admin account from around the internet, browsers without this cookie are
// paused — so attackers can't lock the real admin out of the browser they normally use.
// ---------------------------------------------------------------------------

export const ADMIN_DEVICE_COOKIE = "ts_admin_device";
export const ADMIN_DEVICE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function signAdminDeviceToken(email: string): Promise<string> {
  return signToken({ email, d: randomId(), issuedAt: Date.now(), expiresAt: Date.now() + ADMIN_DEVICE_MAX_AGE * 1000 }, "admin-device");
}

export async function verifyAdminDeviceToken(token: string | undefined): Promise<boolean> {
  const p = await verifyToken<{ email: string; expiresAt: number }>(token, "admin-device");
  return Boolean(p && p.email === (process.env.ADMIN_EMAIL || "").toLowerCase().trim());
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

// Route-level admin checks (with session revocation) live in ./admin-guard (Node runtime only).
