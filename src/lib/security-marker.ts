/**
 * "First time only" markers backed by the `security_markers` table (primary key = marker).
 * claimOnce() inserts the key and returns true only for the first caller — concurrent callers
 * race on the primary key, so exactly one wins. Used for:
 *   - admin TOTP codes (a code can't be replayed inside its 90-second window),
 *   - admin recovery codes (each works once),
 *   - processed Razorpay webhook events.
 */
import { prisma } from "./prisma";

/** Returns true if this is the first claim of `key`; false if it was already claimed. Throws if the DB is down. */
export async function claimOnce(key: string, ttlMs: number): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(Date.now() + ttlMs);
  const existing = await prisma.securityMarker.findUnique({ where: { key } });
  if (existing && existing.expiresAt > now) {
    return false;
  }
  await prisma.securityMarker.upsert({
    where: { key },
    update: { expiresAt },
    create: { key, expiresAt, createdAt: now },
  });
  // Opportunistic cleanup of expired markers.
  if (Math.random() < 0.01) {
    void prisma.securityMarker.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => {});
  }
  return true;
}

/** True if `key` has an unexpired marker. */
export async function isClaimed(key: string): Promise<boolean> {
  const row = await prisma.securityMarker.findUnique({ where: { key } });
  return Boolean(row && row.expiresAt.getTime() > Date.now());
}

export const FOREVER_MS = 100 * 365 * 24 * 60 * 60 * 1000;
