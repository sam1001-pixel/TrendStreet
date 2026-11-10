import crypto from "crypto";
import { promisify } from "util";
import { timingSafeEqualStr } from "./auth";
import { signToken, verifyToken } from "./session-token";

const pbkdf2Async = promisify(crypto.pbkdf2);

export const CUSTOMER_SESSION_COOKIE = "ts_customer_session";
export const SECURE_CUSTOMER_SESSION_COOKIE = "__Host-ts_customer_session";

/** Helper to extract customer session token checking __Host- prefix first */
export function extractCustomerToken(req: { cookies: { get(name: string): { value: string } | undefined } }): string | undefined {
  return req.cookies.get(SECURE_CUSTOMER_SESSION_COOKIE)?.value || req.cookies.get(CUSTOMER_SESSION_COOKIE)?.value || undefined;
}

/** Cookie / token lifetime. Sessions are re-issued (rotated) while in use; see shouldRotateCustomerSession. */
export const CUSTOMER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds
/** However often a session is rotated, the customer signs in again after this long. */
export const CUSTOMER_SESSION_ABSOLUTE_MAX_MS = 90 * 24 * 60 * 60 * 1000;
const ROTATE_AFTER_MS = 24 * 60 * 60 * 1000;

/** PBKDF2 iterations for new hashes. Older hashes (100k) still verify and are upgraded at sign-in. */
const PBKDF2_ITERATIONS = 310000;
const LEGACY_PBKDF2_ITERATIONS = 100000;
/** Refuse absurd iteration counts in a stored hash (CPU exhaustion). */
const MAX_PBKDF2_ITERATIONS = 2_000_000;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 200;

export interface CustomerSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "CUSTOMER";
  issuedAt: number;
  expiresAt: number;
  /** User.sessionVersion when the session was issued. Older tokens have none (= 0). */
  sv?: number;
  /** When the customer last typed their password (absolute session cap). */
  authAt?: number;
}

export interface CustomerUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "CUSTOMER";
  createdAt?: string;
}

export interface StoredCustomerRecord extends CustomerUser {
  passwordHash: string;
  sessionVersion: number;
}

/** Thrown when customer accounts can't be reached; routes turn this into a clear 503. */
export class CustomerStoreUnavailableError extends Error {}

// ----------------------------------------------------
// 1. PASSWORD HASHING (PBKDF2-HMAC-SHA512, 310k iterations, 16-byte random salt)
//    Meets OWASP's PBKDF2-SHA512 guidance (≥ 210k). Stored as "pbkdf2.<iterations>.<salt>.<hash>",
//    or the legacy "salt:hash" (100k iterations, upgraded automatically at the next sign-in).
//    Routes use the async versions so a burst of sign-ins can't block the server's event loop.
// ----------------------------------------------------

type ParsedHash = { salt: string; hash: string; iterations: number };

function parseHash(storedHashOrCombined: string, explicitSalt?: string): ParsedHash | null {
  if (!storedHashOrCombined) return null;
  let salt = explicitSalt;
  let hash = storedHashOrCombined;
  let iterations = PBKDF2_ITERATIONS;

  if (!salt && storedHashOrCombined.startsWith("pbkdf2.")) {
    const [, iter, s, h] = storedHashOrCombined.split(".");
    iterations = parseInt(iter, 10);
    salt = s;
    hash = h;
  } else if (!salt && storedHashOrCombined.includes(":")) {
    [salt, hash] = storedHashOrCombined.split(":");
    iterations = LEGACY_PBKDF2_ITERATIONS;
  }

  if (!salt || !hash || !Number.isFinite(iterations) || iterations < 10000 || iterations > MAX_PBKDF2_ITERATIONS) return null;
  return { salt, hash, iterations };
}

export function hashPassword(password: string): { hash: string; salt: string; combined: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
  return { hash, salt, combined: `pbkdf2.${PBKDF2_ITERATIONS}.${salt}.${hash}` };
}

export async function hashPasswordAsync(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await pbkdf2Async(password, salt, PBKDF2_ITERATIONS, 64, "sha512")).toString("hex");
  return `pbkdf2.${PBKDF2_ITERATIONS}.${salt}.${hash}`;
}

export function verifyPassword(password: string, storedHashOrCombined: string, explicitSalt?: string): boolean {
  if (!password || password.length > MAX_PASSWORD_LENGTH) return false;
  const parsed = parseHash(storedHashOrCombined, explicitSalt);
  if (!parsed) return false;
  try {
    const candidate = crypto.pbkdf2Sync(password, parsed.salt, parsed.iterations, 64, "sha512").toString("hex");
    return timingSafeEqualStr(candidate, parsed.hash);
  } catch {
    return false;
  }
}

export async function verifyPasswordAsync(password: string, storedHashOrCombined: string): Promise<boolean> {
  if (!password || password.length > MAX_PASSWORD_LENGTH) return false;
  const parsed = parseHash(storedHashOrCombined);
  if (!parsed) return false;
  try {
    const candidate = (await pbkdf2Async(password, parsed.salt, parsed.iterations, 64, "sha512")).toString("hex");
    return timingSafeEqualStr(candidate, parsed.hash);
  } catch {
    return false;
  }
}

/** True when a stored hash is weaker than the current settings (re-hash it after a successful sign-in). */
export function passwordNeedsRehash(stored: string): boolean {
  const parsed = parseHash(stored);
  return !parsed || parsed.iterations < PBKDF2_ITERATIONS || !stored.startsWith("pbkdf2.");
}

/** Burns the same PBKDF2 time as a real check, so "no such account" isn't faster than "wrong password". */
const DUMMY_HASH = `pbkdf2.${PBKDF2_ITERATIONS}.00000000000000000000000000000000.${"0".repeat(128)}`;
export function spendPasswordCheckTime(password: string) {
  verifyPassword(password || "x", DUMMY_HASH);
}
export async function spendPasswordCheckTimeAsync(password: string) {
  await verifyPasswordAsync(password || "x", DUMMY_HASH);
}

/** Verifies a customer password against its stored hash. No demo or fallback passwords. */
export function verifyCustomerPassword(password: string, storedHashOrCombined: string): boolean {
  return verifyPassword(password, storedHashOrCombined);
}

// Very common passwords that pass a length check but are guessed first by credential-stuffing tools.
const COMMON_PASSWORDS = new Set([
  "password", "password1", "password12", "password123", "password@123", "passw0rd", "12345678", "123456789",
  "1234567890", "12341234", "11111111", "00000000", "87654321", "qwerty123", "qwertyuiop", "1q2w3e4r",
  "iloveyou", "sunshine", "princess", "football", "baseball", "welcome1", "welcome123", "admin123",
  "abc12345", "abcd1234", "india123", "india@123", "offvybe", "offvybe123", "trendstreet", "letmein1",
  "monkey123", "dragon123", "superman", "michael1", "computer", "whatever", "trustno1", "zaq12wsx",
]);

/** Returns a shopper-readable reason the password can't be used, or null if it's fine. */
export function passwordProblem(password: unknown, email?: string): string | null {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) return `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower) || /^(.)\1+$/.test(password)) {
    return "That password is too common. Please choose something harder to guess.";
  }
  const local = (email || "").split("@")[0]?.toLowerCase() || "";
  if (local.length >= 4 && lower.includes(local)) return "Please don't use your email address in your password.";
  return null;
}

// ----------------------------------------------------
// 2. SESSION TOKENS (signed with a customer-only derived key)
// ----------------------------------------------------

export async function signCustomerToken(
  user: { id: string; email: string; name: string; sessionVersion?: number },
  authAt: number = Date.now()
): Promise<string> {
  const payload: CustomerSessionPayload = {
    userId: user.id,
    email: user.email.toLowerCase().trim(),
    name: user.name,
    role: "CUSTOMER",
    issuedAt: Date.now(),
    expiresAt: Date.now() + CUSTOMER_SESSION_MAX_AGE * 1000,
    sv: user.sessionVersion ?? 0,
    authAt,
  };
  return signToken(payload, "customer");
}

/** Checks the signature and expiry only. Use getValidCustomerSession() to also check the account. */
export async function verifyCustomerToken(token: string | undefined): Promise<CustomerSessionPayload | null> {
  const payload = await verifyToken<CustomerSessionPayload>(token, "customer");
  if (!payload || payload.role !== "CUSTOMER" || typeof payload.userId !== "string") return null;
  if (payload.authAt && Date.now() - payload.authAt > CUSTOMER_SESSION_ABSOLUTE_MAX_MS) return null;
  return payload;
}

/** True when a still-valid session is old enough to be re-issued with a fresh expiry. */
export function shouldRotateCustomerSession(p: CustomerSessionPayload): boolean {
  return Date.now() - p.issuedAt > ROTATE_AFTER_MS;
}

export type ValidCustomerSession = {
  session: CustomerSessionPayload;
  user: { id: string; email: string; name: string | null; phone: string | null; sessionVersion: number };
};

/**
 * The full session check used by every customer API: signature + expiry, and the account still
 * exists, still has a password, and hasn't been signed out everywhere / had its password changed
 * since this session was issued (sessionVersion).
 */
export async function getValidCustomerSession(token: string | undefined): Promise<ValidCustomerSession | null> {
  const session = await verifyCustomerToken(token);
  if (!session) return null;
  const prisma = await db();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, phone: true, role: true, passwordHash: true, sessionVersion: true },
  });
  if (!user || user.role !== "CUSTOMER" || !user.passwordHash) return null;
  if ((session.sv ?? 0) !== user.sessionVersion) return null;
  return { session, user: { id: user.id, email: user.email, name: user.name, phone: user.phone, sessionVersion: user.sessionVersion } };
}

/** Ends every session for the account (password change, reset, "sign out everywhere"). Returns the new version. */
export async function bumpSessionVersion(userId: string): Promise<number> {
  const prisma = await db();
  const u = await prisma.user.update({ where: { id: userId }, data: { sessionVersion: { increment: 1 } }, select: { sessionVersion: true } });
  return u.sessionVersion;
}

// ----------------------------------------------------
// 3. PERSISTENCE — PostgreSQL only. No file or in-memory fallback:
//    an account that isn't in the database doesn't exist.
// ----------------------------------------------------

async function db() {
  if (!process.env.DATABASE_URL) {
    throw new CustomerStoreUnavailableError("DATABASE_URL is not configured; customer accounts are unavailable.");
  }
  const { prisma } = await import("./prisma");
  return prisma;
}

function toCustomer(u: { id: string; email: string; name: string | null; phone: string | null; createdAt: Date }): CustomerUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name || "Customer",
    phone: u.phone || undefined,
    role: "CUSTOMER",
    createdAt: u.createdAt.toISOString(),
  };
}

/** Returns the customer with a password set, or null. Guest-checkout users (no password) return null. */
/** Runs an account query; a database outage becomes CustomerStoreUnavailableError (→ a clear 503). */
async function query<T>(fn: (prisma: Awaited<ReturnType<typeof db>>) => Promise<T>): Promise<T> {
  const prisma = await db();
  try {
    return await fn(prisma);
  } catch (err) {
    throw new CustomerStoreUnavailableError((err as Error).message);
  }
}

export async function findCustomerByEmail(email: string): Promise<StoredCustomerRecord | null> {
  const user = await query((prisma) => prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } }));
  if (!user || !user.passwordHash || user.role !== "CUSTOMER") return null;
  return { ...toCustomer(user), passwordHash: user.passwordHash, sessionVersion: user.sessionVersion };
}

export async function findCustomerById(id: string): Promise<CustomerUser | null> {
  const prisma = await db();
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, phone: true, createdAt: true, role: true },
  });
  if (!user || user.role !== "CUSTOMER") return null;
  return toCustomer(user);
}

/** What an email address currently is in our records. */
export async function emailAccountState(email: string): Promise<"none" | "guest" | "account" | "staff"> {
  const user = await query((prisma) => prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { role: true, passwordHash: true } }));
  if (!user) return "none";
  if (user.role !== "CUSTOMER") return "staff";
  return user.passwordHash ? "account" : "guest";
}

/**
 * Creates a customer account straight away (used only when email confirmation isn't available).
 *
 * An email that already exists from a guest checkout is NOT claimed here: anyone could type
 * someone else's email, set a password, and take over that person's identity (and the phone number
 * saved from their orders). Claiming a guest record requires proving the inbox — see the
 * email-confirmation flow — so this throws GUEST_EXISTS instead.
 */
export async function createCustomerUser(data: {
  email: string;
  name: string;
  phone?: string;
  password: string;
}): Promise<CustomerUser> {
  const prisma = await db();
  const email = data.email.trim().toLowerCase();
  const passwordHash = await hashPasswordAsync(data.password);
  const name = data.name.trim();
  const phone = data.phone?.trim() || null;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.passwordHash || existing.role !== "CUSTOMER") throw new Error("ACCOUNT_EXISTS");
      throw new Error("GUEST_EXISTS");
    }
    const created = await prisma.user.create({
      data: { email, name, phone, passwordHash, role: "CUSTOMER" },
    });
    return toCustomer(created);
  } catch (err) {
    if (err instanceof Error && (err.message === "ACCOUNT_EXISTS" || err.message === "GUEST_EXISTS")) throw err;
    if ((err as { code?: string })?.code === "P2002") throw new Error("ACCOUNT_EXISTS");
    throw new CustomerStoreUnavailableError((err as Error).message);
  }
}

/**
 * Applies a confirmed sign-up (the email owner opened the confirmation link).
 * Works for brand-new emails and for guest-checkout records. Only the details typed at sign-up
 * are used — a phone number saved from earlier guest orders is cleared unless the person typed one.
 */
export async function completeConfirmedSignup(userId: string, pending: { name: string; phone: string | null; passwordHash: string }) {
  const prisma = await db();
  const claimed = await prisma.user.updateMany({
    where: { id: userId, role: "CUSTOMER", passwordHash: null },
    data: {
      passwordHash: pending.passwordHash,
      name: pending.name,
      phone: pending.phone,
      emailVerifiedAt: new Date(),
      sessionVersion: { increment: 1 },
    },
  });
  if (claimed.count !== 1) return null; // already has a password (e.g. confirmed twice) — nothing to do
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, sessionVersion: true } });
}
