/**
 * Server-side authorization for admin API routes (Node runtime). Every /api/admin route calls
 * requireAdminSession() itself — the Edge middleware check is only the first gate.
 *
 * On top of the signed-token check (signature, expiry, admin email, credential fingerprint):
 * - a session that was signed out is rejected (its id is marked revoked),
 * - "sign out all admin devices" rejects every session issued before that moment,
 * - sensitive actions can demand a recent sign-in (requireRecentAdminAuth).
 */
import { NextResponse, type NextRequest } from "next/server";
import { extractAdminToken, verifySessionToken, type SessionPayload } from "./auth";
import { prisma } from "./prisma";
import { isClaimed } from "./security-marker";

type Guard = { authorized: true; session: SessionPayload } | { authorized: false; response: NextResponse };

const unauthorized = (error = "Unauthorized: Valid administrative session token required.", extra: Record<string, unknown> = {}) =>
  ({ authorized: false, response: NextResponse.json({ error, ...extra }, { status: 401 }) }) as const;

let revokedCache: { at: number; value: number } | null = null;

/** Epoch ms before which every admin session is invalid (0 = none). Cached for 5 s per instance. */
async function sessionsRevokedBefore(): Promise<number> {
  if (revokedCache && Date.now() - revokedCache.at < 5000) return revokedCache.value;
  const row = await prisma.siteSettings.findUnique({ where: { id: "global" }, select: { adminSessionsRevokedAt: true } });
  const value = row?.adminSessionsRevokedAt?.getTime() ?? 0;
  revokedCache = { at: Date.now(), value };
  return value;
}

export function adminSessionRevocationKey(sid: string) {
  return `admin-session-revoked:${sid}`;
}

/** Full check of the admin session for this request. */
export async function requireAdminSession(req: NextRequest): Promise<Guard> {
  const session = await verifySessionToken(extractAdminToken(req));
  if (!session) return unauthorized();

  try {
    if (session.issuedAt < (await sessionsRevokedBefore())) return unauthorized("Your admin session was signed out. Please sign in again.");
    if (session.sid && (await isClaimed(adminSessionRevocationKey(session.sid)))) return unauthorized("You signed out. Please sign in again.");
  } catch (err) {
    // The revocation lists live in the database; if it can't be read, fail closed.
    console.error("[Admin guard] Could not check session revocation:", (err as Error).message);
    return { authorized: false, response: NextResponse.json({ error: "Admin is temporarily unavailable. Please try again." }, { status: 503 }) };
  }
  return { authorized: true, session };
}

/** How recent the sign-in must be for sensitive actions (bulk price changes, customer export, …). */
export const RECENT_ADMIN_AUTH_MS = 30 * 60 * 1000;

/**
 * For sensitive actions: the admin must have typed their password (and 2-step code) within the
 * last 30 minutes. Otherwise the admin UI sends them to sign in again (it redirects on 401).
 */
export async function requireRecentAdminAuth(req: NextRequest, maxAgeMs = RECENT_ADMIN_AUTH_MS): Promise<Guard> {
  const guard = await requireAdminSession(req);
  if (!guard.authorized) return guard;
  if (Date.now() - guard.session.issuedAt > maxAgeMs) {
    return unauthorized("For your security, please sign in again to do this.", { reauth: true });
  }
  return guard;
}

/** Ends every admin session (all browsers), including the current one. */
export async function revokeAllAdminSessions(): Promise<void> {
  const now = new Date();
  await prisma.siteSettings.upsert({
    where: { id: "global" },
    update: { adminSessionsRevokedAt: now },
    create: { id: "global", heroSubtitle: "", adminSessionsRevokedAt: now },
  });
  revokedCache = { at: Date.now(), value: now.getTime() };
}
