/**
 * One-time email links (password reset, email confirmation).
 * - The token is 32 random bytes (256 bits), sent only in the email.
 * - Only its SHA-256 hash is stored, so a database leak can't be turned into working links.
 * - Single use: redeeming is a conditional update that only one request can win.
 * - Short-lived, and issuing a new link cancels older unused links of the same kind.
 */
import crypto from "crypto";
import type { AuthTokenPurpose, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes
export const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

/** Creates a new link token for the user; older unused tokens of the same purpose stop working. */
export async function issueAuthToken(
  userId: string,
  purpose: AuthTokenPurpose,
  ttlMs: number,
  payload?: Prisma.InputJsonValue
): Promise<string> {
  const raw = crypto.randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.authToken.updateMany({ where: { userId, purpose, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.authToken.create({
      data: { userId, purpose, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + ttlMs), ...(payload !== undefined ? { payload } : {}) },
    }),
  ]);
  return raw;
}

export type RedeemedToken = { id: string; userId: string; payload: Prisma.JsonValue | null };

/**
 * Uses up a token. Returns its row if it was valid (right purpose, not expired, not used),
 * otherwise null. Exactly one concurrent caller can succeed.
 */
export async function redeemAuthToken(raw: unknown, purpose: AuthTokenPurpose): Promise<RedeemedToken | null> {
  if (typeof raw !== "string" || !/^[A-Za-z0-9_-]{40,64}$/.test(raw)) return null;
  const tokenHash = hashToken(raw);
  const row = await prisma.authToken.findUnique({ where: { tokenHash } });
  if (!row || row.purpose !== purpose || row.usedAt || row.expiresAt.getTime() <= Date.now()) return null;
  const won = await prisma.authToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
  if (won.count !== 1) return null;
  return { id: row.id, userId: row.userId, payload: row.payload };
}

/** Checks a token without using it (so the reset page can say "this link has expired" up front). */
export async function peekAuthToken(raw: unknown, purpose: AuthTokenPurpose): Promise<boolean> {
  if (typeof raw !== "string" || !/^[A-Za-z0-9_-]{40,64}$/.test(raw)) return false;
  const row = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(raw) } });
  return Boolean(row && row.purpose === purpose && !row.usedAt && row.expiresAt.getTime() > Date.now());
}
