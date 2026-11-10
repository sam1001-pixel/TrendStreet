/**
 * OFFVYBE — shared rate limiter.
 *
 * Order of backends (the first one that works is used):
 *   1. Upstash Redis REST — when UPSTASH_REDIS_REST_URL / _TOKEN are set.
 *   2. PostgreSQL (`rate_limit_buckets` table) — the site's own database, shared by every
 *      serverless instance. This is the production default when Upstash isn't configured.
 *   3. In-memory — last resort only (database down, or local tests without DATABASE_URL).
 *      On serverless each instance has its own memory, so this alone is NOT a real limit.
 *
 * All backends use fixed windows: a key may be hit `maxRequests` times per `windowMs`.
 *
 * Client IPs: only headers set by our own proxy are trusted (see getClientIp). A client can
 * never pick its own bucket by sending X-Forwarded-For unless TRUST_PROXY_HEADERS says so.
 */

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests allowed within the window
}

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  remaining: number;
  resetMs: number;
  isDistributed?: boolean;
  backend?: "upstash" | "postgres" | "memory";
}

// Standardized Route Rate Limit Profiles
export const RATE_LIMIT_CONFIG = {
  ADMIN_LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  ORDER_LOOKUP: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  COD_ORDER: { windowMs: 10 * 60 * 1000, maxRequests: 5 },
  CHECKOUT_VALIDATE: { windowMs: 10 * 60 * 1000, maxRequests: 30 },
  PAYMENT_CREATE: { windowMs: 10 * 60 * 1000, maxRequests: 15 },
  PAYMENT_VERIFY: { windowMs: 10 * 60 * 1000, maxRequests: 30 },
  STOREFRONT_SEARCH: { windowMs: 1 * 60 * 1000, maxRequests: 60 },
  /** Failed customer sign-ins per account (any IP). Only failures count. */
  CUSTOMER_LOGIN_ACCOUNT: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  PASSWORD_RESET_IP: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  PASSWORD_RESET_ACCOUNT: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  EMAIL_CONFIRM_SEND: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  TOKEN_REDEEM: { windowMs: 15 * 60 * 1000, maxRequests: 20 },
  ADMIN_UPLOAD: { windowMs: 10 * 60 * 1000, maxRequests: 60 },
};

// ---------------------------------------------------------------------------
// In-memory fallback
// ---------------------------------------------------------------------------

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale in-memory records every 10 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record: RateLimitRecord, key: string) => {
      record.timestamps = record.timestamps.filter((ts: number) => now - ts < 3600000); // retain 1 hr
      if (record.timestamps.length === 0) rateLimitStore.delete(key);
    });
  }, 600000);
  if (typeof timer.unref === "function") timer.unref();
}

/** Synchronous in-memory sliding-window check (fallback, and used directly by unit tests). */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const record = rateLimitStore.get(key) || { timestamps: [] };
  const activeTimestamps = record.timestamps.filter((ts) => ts > windowStart);

  // In development, give localhost generous headroom so developer testing is never blocked.
  const effectiveMax =
    process.env.NODE_ENV !== "production" && (key.includes("127.0.0.1") || key.includes("::1") || key.includes("localhost"))
      ? Math.max(options.maxRequests, 100)
      : options.maxRequests;

  if (activeTimestamps.length >= effectiveMax) {
    const resetMs = Math.max(0, activeTimestamps[0] + options.windowMs - now);
    return { allowed: false, currentCount: activeTimestamps.length, remaining: 0, resetMs, isDistributed: false, backend: "memory" };
  }

  activeTimestamps.push(now);
  rateLimitStore.set(key, { timestamps: activeTimestamps });
  return {
    allowed: true,
    currentCount: activeTimestamps.length,
    remaining: Math.max(0, effectiveMax - activeTimestamps.length),
    resetMs: options.windowMs,
    isDistributed: false,
    backend: "memory",
  };
}

function peekMemory(key: string, options: RateLimitOptions): number {
  const windowStart = Date.now() - options.windowMs;
  return (rateLimitStore.get(key)?.timestamps || []).filter((ts) => ts > windowStart).length;
}

// ---------------------------------------------------------------------------
// Upstash Redis REST
// ---------------------------------------------------------------------------

function upstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || /replace_with/i.test(url)) return null;
  return { url, token };
}

async function upstash(commands: (string | number)[][]): Promise<{ result: unknown }[] | null> {
  const cfg = upstashConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as { result: unknown }[];
  } catch (err) {
    console.warn("[RateLimit] Upstash unavailable:", (err as Error).message);
    return null;
  }
}

function windowKey(key: string, windowMs: number) {
  const slot = Math.floor(Date.now() / windowMs);
  return { redisKey: `ratelimit:${key}:${slot}`, resetMs: (slot + 1) * windowMs - Date.now() };
}

// ---------------------------------------------------------------------------
// PostgreSQL (rate_limit_buckets)
// ---------------------------------------------------------------------------

let pgDisabledUntil = 0;

function postgresAvailable() {
  return Boolean(process.env.DATABASE_URL) && Date.now() > pgDisabledUntil;
}

async function pgHit(key: string, options: RateLimitOptions): Promise<{ count: number; resetAt: Date } | null> {
  if (!postgresAvailable()) return null;
  try {
    const { prisma } = await import("./prisma");
    const now = new Date();
    const existing = await prisma.rateLimitBucket.findUnique({ where: { key } });
    let count = 1;
    let resetAt = new Date(Date.now() + options.windowMs);

    if (existing && existing.resetAt > now) {
      count = existing.count + 1;
      resetAt = existing.resetAt;
      await prisma.rateLimitBucket.update({
        where: { key },
        data: { count },
      });
    } else {
      await prisma.rateLimitBucket.upsert({
        where: { key },
        update: { count: 1, resetAt },
        create: { key, count: 1, resetAt },
      });
    }

    // Opportunistic cleanup of long-expired buckets (about 1 call in 200).
    if (Math.random() < 0.005) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      void prisma.rateLimitBucket.deleteMany({ where: { resetAt: { lt: yesterday } } }).catch(() => {});
    }
    return { count, resetAt };
  } catch (err) {
    // Table missing (schema not pushed yet) or database down: stop trying for a minute.
    pgDisabledUntil = Date.now() + 60_000;
    console.warn("[RateLimit] Database limiter unavailable, using in-memory fallback:", (err as Error).message);
    return null;
  }
}

async function pgPeek(key: string): Promise<{ count: number; resetAt: Date } | null | undefined> {
  if (!postgresAvailable()) return undefined;
  try {
    const { prisma } = await import("./prisma");
    const row = await prisma.rateLimitBucket.findUnique({ where: { key } });
    if (!row || row.resetAt.getTime() <= Date.now()) return null;
    return { count: row.count, resetAt: row.resetAt };
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Counts one request against `key` and says whether it's allowed.
 * Uses Upstash, then PostgreSQL, then memory (see top of file).
 */
export async function checkDistributedRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  if (upstashConfig()) {
    const { redisKey, resetMs } = windowKey(key, options.windowMs);
    const out = await upstash([
      ["INCR", redisKey],
      ["PEXPIRE", redisKey, options.windowMs],
    ]);
    if (out) {
      const currentCount = Number(out[0]?.result || 1);
      return {
        allowed: currentCount <= options.maxRequests,
        currentCount,
        remaining: Math.max(0, options.maxRequests - currentCount),
        resetMs,
        isDistributed: true,
        backend: "upstash",
      };
    }
  }

  const pg = await pgHit(key, options);
  if (pg) {
    return {
      allowed: pg.count <= options.maxRequests,
      currentCount: pg.count,
      remaining: Math.max(0, options.maxRequests - pg.count),
      resetMs: Math.max(0, pg.resetAt.getTime() - Date.now()),
      isDistributed: true,
      backend: "postgres",
    };
  }

  return checkRateLimit(key, options);
}

/**
 * Reads the current count for `key` without adding to it. Use with recordFailure() for
 * "only failures count" limits (e.g. wrong passwords per account).
 */
export async function peekRateLimit(key: string, options: RateLimitOptions): Promise<{ blocked: boolean; count: number; resetMs: number }> {
  if (upstashConfig()) {
    const { redisKey, resetMs } = windowKey(key, options.windowMs);
    const out = await upstash([["GET", redisKey]]);
    if (out) {
      const count = Number(out[0]?.result || 0);
      return { blocked: count >= options.maxRequests, count, resetMs };
    }
  }
  const pg = await pgPeek(key);
  if (pg !== undefined) {
    const count = pg?.count ?? 0;
    return { blocked: count >= options.maxRequests, count, resetMs: pg ? Math.max(0, pg.resetAt.getTime() - Date.now()) : 0 };
  }
  const count = peekMemory(key, options);
  return { blocked: count >= options.maxRequests, count, resetMs: options.windowMs };
}

/** Adds one failure to `key` (same counter peekRateLimit reads). */
export async function recordFailure(key: string, options: RateLimitOptions): Promise<void> {
  await checkDistributedRateLimit(key, options);
}

/** Clears a counter (e.g. after a successful sign-in) in every backend. */
export async function resetRateLimit(key: string): Promise<void> {
  rateLimitStore.delete(key);
  if (upstashConfig()) {
    // Fixed windows: clear the current and previous slot for the common window sizes.
    const slots = [60_000, 10 * 60_000, 15 * 60_000, 60 * 60_000].map((w) => windowKey(key, w).redisKey);
    await upstash([["DEL", ...slots]]);
  }
  if (postgresAvailable()) {
    try {
      const { prisma } = await import("./prisma");
      await prisma.rateLimitBucket.deleteMany({ where: { key } });
    } catch {
      /* best effort */
    }
  }
}

/** Which shared backend is in use — reported by the production configuration check. */
export function rateLimitBackend(): "upstash" | "postgres" | "memory" {
  if (upstashConfig()) return "upstash";
  if (process.env.DATABASE_URL) return "postgres";
  return "memory";
}

// ---------------------------------------------------------------------------
// Client IP
// ---------------------------------------------------------------------------

/**
 * The client's IP, taken only from headers our own proxy sets:
 * - On Vercel (VERCEL is set), Vercel overwrites X-Real-IP / X-Forwarded-For with the real client
 *   address, so they can't be forged by the client.
 * - Behind Cloudflare, set TRUST_CLOUDFLARE_IP=true to use CF-Connecting-IP.
 * - Behind another reverse proxy, set TRUST_PROXY_HEADERS=true (the proxy must overwrite the header).
 * - Otherwise the headers are ignored and every request shares one "unknown" bucket — safe, just strict.
 */
export function getClientIp(headers: Headers): string {
  if (process.env.TRUST_CLOUDFLARE_IP === "true") {
    const cfIp = headers.get("cf-connecting-ip");
    if (cfIp && isValidIp(cfIp.trim())) return cfIp.trim();
  }

  const trustProxy = Boolean(process.env.VERCEL) || process.env.TRUST_PROXY_HEADERS === "true";
  if (trustProxy) {
    const realIp = headers.get("x-real-ip")?.trim();
    if (realIp && isValidIp(realIp)) return realIp;
    const vercelIp = headers.get("x-vercel-forwarded-for")?.split(",")[0].trim();
    if (vercelIp && isValidIp(vercelIp)) return vercelIp;
    const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0].trim();
    if (forwardedFor && isValidIp(forwardedFor)) return forwardedFor;
  }

  // Local development: keep the old behaviour so the dev-only headroom for localhost applies.
  if (process.env.NODE_ENV !== "production") return "127.0.0.1";
  return "unknown";
}

function isValidIp(ip: string): boolean {
  if (!ip || ip.length > 45) return false;
  const ipv4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
  const ipv6 = /^[0-9a-fA-F:]+$/;
  return ipv4.test(ip) || (ip.includes(":") && ipv6.test(ip));
}
