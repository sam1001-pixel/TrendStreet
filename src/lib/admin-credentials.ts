/**
 * Admin credential check (Node.js runtime only).
 *
 * Configure ADMIN_EMAIL plus ONE of:
 *   ADMIN_PASSWORD_HASH — recommended; generate with `npm run hash-password`
 *   ADMIN_PASSWORD      — plain text, at least 12 characters
 * There are no built-in defaults, aliases or alternative passwords: if nothing valid is
 * configured, every attempt fails.
 */
import { timingSafeEqualStr } from "./auth";
import { verifyPassword } from "./customer-auth";

/** Plain-text admin passwords shorter than this are refused outright, even if configured. */
export const MIN_ADMIN_PASSWORD_LENGTH = 12;

export function validateAdminCredentials(
  id: string | unknown,
  pass: string | unknown
): { isValid: boolean; email: string } {
  if (!id || !pass || typeof id !== "string" || typeof pass !== "string") {
    return { isValid: false, email: "" };
  }

  const configuredEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const passwordHash = (process.env.ADMIN_PASSWORD_HASH || "").trim();
  const plainPassword = process.env.ADMIN_PASSWORD || "";

  if (!configuredEmail || (!passwordHash && !plainPassword)) {
    console.error("[Auth] ADMIN_EMAIL and ADMIN_PASSWORD_HASH (or ADMIN_PASSWORD) must be set; admin login is disabled.");
    return { isValid: false, email: "" };
  }

  const isEmailMatch = timingSafeEqualStr(id.trim().toLowerCase(), configuredEmail);

  let isPassValid = false;
  if (passwordHash) {
    if (!passwordHash.startsWith("pbkdf2.")) {
      console.error("[Auth] ADMIN_PASSWORD_HASH is not in the expected format. Regenerate it with `npm run hash-password`.");
      return { isValid: false, email: "" };
    }
    isPassValid = verifyPassword(pass, passwordHash);
  } else {
    if (process.env.NODE_ENV === "production") {
      console.error("[Auth] Plain-text ADMIN_PASSWORD is forbidden in production. Configure ADMIN_PASSWORD_HASH instead (`npm run hash-password`).");
      return { isValid: false, email: "" };
    }
    if (plainPassword.length < MIN_ADMIN_PASSWORD_LENGTH) {
      console.error(`[Auth] ADMIN_PASSWORD is shorter than ${MIN_ADMIN_PASSWORD_LENGTH} characters; admin login is disabled.`);
      return { isValid: false, email: "" };
    }
    isPassValid = timingSafeEqualStr(pass, plainPassword);
  }

  return { isValid: isEmailMatch && isPassValid, email: configuredEmail };
}
