/**
 * Admin two-step sign-in (Node runtime).
 *
 * - ADMIN_TOTP_SECRET          — base32 secret for the authenticator app (npm run admin:2fa).
 * - ADMIN_REQUIRE_2FA=true     — in production, refuse admin sign-in unless ADMIN_TOTP_SECRET is set.
 * - ADMIN_RECOVERY_CODE_HASHES — comma-separated SHA-256 hashes of one-time recovery codes
 *                                (npm run admin:recovery-codes). Each code works once.
 *
 * Used TOTP steps and recovery codes are recorded in security_markers, so a code that was seen
 * (shoulder-surfed, phished, logged by a proxy) can't be replayed.
 */
import crypto from "crypto";
import { totpMatchStep } from "./totp";
import { claimOnce, FOREVER_MS } from "./security-marker";

export function totpSecret(): string | null {
  const s = (process.env.ADMIN_TOTP_SECRET || "").trim();
  return s.length >= 16 ? s : null;
}

/** True when admin sign-in must use two-step codes but no secret is configured (production only). */
export function mfaRequiredButMissing(): boolean {
  return process.env.NODE_ENV === "production" && process.env.ADMIN_REQUIRE_2FA === "true" && !totpSecret();
}

export function twoFactorEnabled(): boolean {
  return Boolean(totpSecret());
}

/** Recovery codes look like ABCD-EFGH-JKLM-NPQR (letters/digits, dashes optional, any case). */
export function normalizeRecoveryCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashRecoveryCode(raw: string): string {
  return crypto.createHash("sha256").update(`offvybe-admin-recovery:${normalizeRecoveryCode(raw)}`).digest("hex");
}

export function generateRecoveryCodes(count = 10): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  return Array.from({ length: count }, () => {
    const bytes = crypto.randomBytes(16);
    const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
    return chars.match(/.{4}/g)!.join("-"); // 16 chars ≈ 80 bits
  });
}

function configuredRecoveryHashes(): string[] {
  return (process.env.ADMIN_RECOVERY_CODE_HASHES || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter((h) => /^[0-9a-f]{64}$/.test(h));
}

export type SecondFactorResult = { ok: true; method: "totp" | "recovery" } | { ok: false };

/**
 * Checks the second factor. `code` is either the 6-digit authenticator code or a recovery code.
 * Each successful code is used up.
 */
export async function verifySecondFactor(code: unknown): Promise<SecondFactorResult> {
  const secret = totpSecret();
  if (!secret || typeof code !== "string") return { ok: false };
  const trimmed = code.trim();

  if (/^\d{6}$/.test(trimmed)) {
    const step = totpMatchStep(secret, trimmed);
    if (step === null) return { ok: false };
    // One use per 30-second step (kept for 3 minutes, longer than the ±30 s window).
    return (await claimOnce(`admin-totp:${step}`, 3 * 60 * 1000)) ? { ok: true, method: "totp" } : { ok: false };
  }

  const normalized = normalizeRecoveryCode(trimmed);
  if (normalized.length !== 16) return { ok: false };
  const candidate = hashRecoveryCode(normalized);
  let match: string | null = null;
  for (const h of configuredRecoveryHashes()) {
    if (crypto.timingSafeEqual(Buffer.from(h), Buffer.from(candidate))) match = h;
  }
  if (!match) return { ok: false };
  return (await claimOnce(`admin-recovery:${match}`, FOREVER_MS)) ? { ok: true, method: "recovery" } : { ok: false };
}
