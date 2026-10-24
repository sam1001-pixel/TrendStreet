import crypto from "crypto";
import { timingSafeEqualStr } from "./auth";

export const CUSTOMER_SESSION_COOKIE = "ts_customer_session";
export const CUSTOMER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[FATAL SECURITY] AUTH_SECRET environment variable is missing in production.");
    }
    return "trend_street_luxury_menswear_dev_fallback_secret_key_2026_non_prod";
  }
  return secret;
}

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

// ----------------------------------------------------
// 1. PASSWORD CRYPTOGRAPHY (PBKDF2-SHA512 + Random Salt)
// ----------------------------------------------------

export function hashPassword(password: string): { hash: string; salt: string; combined: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512");
  const hash = derivedKey.toString("hex");
  return { hash, salt, combined: `${salt}:${hash}` };
}

export function verifyPassword(password: string, storedHashOrCombined: string, explicitSalt?: string): boolean {
  if (!password || !storedHashOrCombined) return false;

  let salt = explicitSalt;
  let hash = storedHashOrCombined;

  if (!salt && storedHashOrCombined.includes(":")) {
    const parts = storedHashOrCombined.split(":");
    salt = parts[0];
    hash = parts[1];
  }

  if (!salt || !hash) return false;

  try {
    const keyToVerify = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return timingSafeEqualStr(keyToVerify, hash);
  } catch {
    return false;
  }
}

// ----------------------------------------------------
// 2. CRYPTOGRAPHIC SESSION TOKENS (Web Crypto HMAC-SHA256)
// ----------------------------------------------------

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signCustomerToken(user: { id: string; email: string; name: string }): Promise<string> {
  const payload: CustomerSessionPayload = {
    userId: user.id,
    email: user.email.toLowerCase().trim(),
    name: user.name,
    role: "CUSTOMER",
    issuedAt: Date.now(),
    expiresAt: Date.now() + CUSTOMER_SESSION_MAX_AGE * 1000,
  };

  const enc = new TextEncoder();
  const payloadStr = uint8ArrayToBase64Url(enc.encode(JSON.stringify(payload)));
  const key = await getHmacKey();
  const signatureBytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, enc.encode(payloadStr))
  );
  const signature = uint8ArrayToBase64Url(signatureBytes);

  return `${payloadStr}.${signature}`;
}

export async function verifyCustomerToken(token: string | undefined): Promise<CustomerSessionPayload | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadStr, signatureStr] = parts;

  try {
    const enc = new TextEncoder();
    const key = await getHmacKey();
    const signatureBytes = base64UrlToUint8Array(signatureStr);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      enc.encode(payloadStr)
    );

    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(payloadStr));
    const payload: CustomerSessionPayload = JSON.parse(payloadJson);

    if (Date.now() > payload.expiresAt || payload.role !== "CUSTOMER") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// 3. PERSISTENCE LAYER (Prisma + Resilient Development Fallback)
// ----------------------------------------------------

interface StoredCustomerRecord {
  id: string;
  email: string;
  name: string;
  phone?: string;
  passwordHash: string;
  role: "CUSTOMER";
  createdAt: string;
}

// Pre-seeded customer user for local testing
const DEFAULT_PRESEEDED_CUSTOMER = {
  id: "cust_demo_001",
  email: "customer@trendstreet.in",
  name: "Aryan Mehra",
  phone: "+91 98200 54321",
  passwordHash: hashPassword("TrendStreet2026!").combined,
  role: "CUSTOMER" as const,
  createdAt: new Date().toISOString(),
};

// Global in-memory storage to survive hot reloads in development
const globalCustomerStore = globalThis as unknown as {
  __trendStreetCustomers?: Map<string, StoredCustomerRecord>;
};

if (!globalCustomerStore.__trendStreetCustomers) {
  globalCustomerStore.__trendStreetCustomers = new Map();
  globalCustomerStore.__trendStreetCustomers.set(
    DEFAULT_PRESEEDED_CUSTOMER.email.toLowerCase(),
    DEFAULT_PRESEEDED_CUSTOMER
  );
}

export async function findCustomerByEmail(email: string): Promise<StoredCustomerRecord | null> {
  const normalized = email.trim().toLowerCase();

  // Try database first if available
  try {
    const { prisma } = await import("./prisma");
    const dbUser = await prisma.user.findUnique({
      where: { email: normalized },
    });
    if (dbUser && dbUser.passwordHash) {
      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name || "Customer",
        phone: dbUser.phone || undefined,
        passwordHash: dbUser.passwordHash,
        role: "CUSTOMER",
        createdAt: dbUser.createdAt.toISOString(),
      };
    }
  } catch {
    // Database offline or not configured — fall through to in-memory store
  }

  // Fallback to resilient memory store
  const record = globalCustomerStore.__trendStreetCustomers?.get(normalized);
  return record || null;
}

export async function findCustomerById(id: string): Promise<CustomerUser | null> {
  try {
    const { prisma } = await import("./prisma");
    const dbUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, phone: true, createdAt: true },
    });
    if (dbUser) {
      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name || "Customer",
        phone: dbUser.phone || undefined,
        role: "CUSTOMER",
        createdAt: dbUser.createdAt.toISOString(),
      };
    }
  } catch {
    // Fall through to memory store
  }

  const records = globalCustomerStore.__trendStreetCustomers
    ? Array.from(globalCustomerStore.__trendStreetCustomers.values())
    : [];
  for (const record of records) {
    if (record.id === id) {
      return {
        id: record.id,
        email: record.email,
        name: record.name,
        phone: record.phone,
        role: "CUSTOMER",
        createdAt: record.createdAt,
      };
    }
  }

  return null;
}

export async function createCustomerUser(data: {
  email: string;
  name: string;
  phone?: string;
  password: string;
}): Promise<CustomerUser> {
  const normalized = data.email.trim().toLowerCase();
  const { combined } = hashPassword(data.password);
  const now = new Date().toISOString();
  const newId = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const customerRecord: StoredCustomerRecord = {
    id: newId,
    email: normalized,
    name: data.name.trim(),
    phone: data.phone?.trim() || undefined,
    passwordHash: combined,
    role: "CUSTOMER",
    createdAt: now,
  };

  // Attempt database write
  try {
    const { prisma } = await import("./prisma");
    const { Role } = await import("@prisma/client");
    const created = await prisma.user.create({
      data: {
        email: normalized,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        passwordHash: combined,
        role: Role.CUSTOMER,
      },
    });

    customerRecord.id = created.id;
  } catch (dbErr) {
    console.warn("[Customer Auth] Database unavailable, persisting to memory cache:", (dbErr as Error).message);
  }

  // Always keep in fallback cache for seamless local availability
  globalCustomerStore.__trendStreetCustomers?.set(normalized, customerRecord);

  return {
    id: customerRecord.id,
    email: customerRecord.email,
    name: customerRecord.name,
    phone: customerRecord.phone,
    role: "CUSTOMER",
    createdAt: customerRecord.createdAt,
  };
}
