import crypto from "crypto";
import { timingSafeEqualStr } from "./auth";
import { signToken, verifyToken } from "./session-token";

export const CUSTOMER_SESSION_COOKIE = "ts_customer_session";
export const CUSTOMER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

/** PBKDF2 iterations for new hashes. Older hashes (100k) still verify. */
const PBKDF2_ITERATIONS = 310000;
const LEGACY_PBKDF2_ITERATIONS = 100000;

export interface CustomerSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "CUSTOMER";
  issuedAt: number;
  expiresAt: number;
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
}

/** Thrown when customer accounts can't be reached; routes turn this into a clear 503. */
export class CustomerStoreUnavailableError extends Error {}

// ----------------------------------------------------
// 1. PASSWORD HASHING (PBKDF2-SHA512 + random salt)
//    Stored as "pbkdf2.<iterations>.<salt>.<hash>" (dots, so .env files don't expand it),
//    or the legacy "salt:hash" (100k iterations).
// ----------------------------------------------------

export function hashPassword(password: string): { hash: string; salt: string; combined: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
  return { hash, salt, combined: `pbkdf2.${PBKDF2_ITERATIONS}.${salt}.${hash}` };
}

export function verifyPassword(password: string, storedHashOrCombined: string, explicitSalt?: string): boolean {
  if (!password || !storedHashOrCombined) return false;

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
  } else if (explicitSalt) {
    iterations = PBKDF2_ITERATIONS;
  }

  if (!salt || !hash || !Number.isFinite(iterations) || iterations < 10000) return false;

  try {
    const candidate = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
    return timingSafeEqualStr(candidate, hash);
  } catch {
    return false;
  }
}

/** Verifies a customer password against its stored hash. No demo or fallback passwords. */
export function verifyCustomerPassword(password: string, storedHashOrCombined: string): boolean {
  return verifyPassword(password, storedHashOrCombined);
}

// ----------------------------------------------------
// 2. SESSION TOKENS (signed with a customer-only derived key)
// ----------------------------------------------------

export async function signCustomerToken(user: { id: string; email: string; name: string }): Promise<string> {
  const payload: CustomerSessionPayload = {
    userId: user.id,
    email: user.email.toLowerCase().trim(),
    name: user.name,
    role: "CUSTOMER",
    issuedAt: Date.now(),
    expiresAt: Date.now() + CUSTOMER_SESSION_MAX_AGE * 1000,
  };
  return signToken(payload, "customer");
}

export async function verifyCustomerToken(token: string | undefined): Promise<CustomerSessionPayload | null> {
  const payload = await verifyToken<CustomerSessionPayload>(token, "customer");
  if (!payload || payload.role !== "CUSTOMER" || typeof payload.userId !== "string") return null;
  return payload;
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
export async function findCustomerByEmail(email: string): Promise<StoredCustomerRecord | null> {
  const prisma = await db();
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !user.passwordHash || user.role !== "CUSTOMER") return null;
  return { ...toCustomer(user), passwordHash: user.passwordHash };
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

/**
 * Creates a customer account. If the email already exists from a guest checkout (no password yet),
 * the password is added to that existing record so the shopper keeps one identity.
 * Throws CustomerStoreUnavailableError if the database can't be reached.
 */
export async function createCustomerUser(data: {
  email: string;
  name: string;
  phone?: string;
  password: string;
}): Promise<CustomerUser> {
  const prisma = await db();
  const email = data.email.trim().toLowerCase();
  const { combined } = hashPassword(data.password);
  const name = data.name.trim();
  const phone = data.phone?.trim() || null;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.passwordHash || existing.role !== "CUSTOMER") {
        throw new Error("ACCOUNT_EXISTS");
      }
      // Claim the guest record only if it still has no password (guards against a race).
      const claimed = await prisma.user.updateMany({
        where: { id: existing.id, passwordHash: null },
        data: { passwordHash: combined, name, phone: phone ?? existing.phone },
      });
      if (claimed.count === 0) throw new Error("ACCOUNT_EXISTS");
      return toCustomer({ ...existing, name, phone: phone ?? existing.phone });
    }

    const created = await prisma.user.create({
      data: { email, name, phone, passwordHash: combined, role: "CUSTOMER" },
    });
    return toCustomer(created);
  } catch (err) {
    if (err instanceof Error && err.message === "ACCOUNT_EXISTS") throw err;
    if ((err as { code?: string })?.code === "P2002") throw new Error("ACCOUNT_EXISTS");
    throw new CustomerStoreUnavailableError((err as Error).message);
  }
}
