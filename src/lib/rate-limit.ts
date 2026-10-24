/**
 * TREND STREET — DISTRIBUTED & IN-MEMORY HYBRID RATE LIMITER
 *
 * Provides defense-in-depth protection against brute-force, scraping, and resource-exhaustion attacks.
 * Architecture:
 * - High-speed in-memory sliding-window limiter by default
 * - Optional Upstash Redis REST distributed rate limiter when UPSTASH_REDIS_REST_URL is configured
 * - Graceful fallback: Redis connection failures never drop legitimate traffic
 * - Hardened client IP extraction prioritizing trusted CDN & platform proxy headers
 */

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
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    });
  }, 600000);
  if (typeof timer.unref === "function") {
    timer.unref();
  }
}

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max allowed requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  remaining: number;
  resetMs: number;
  isDistributed?: boolean;
}

// Standardized Route Rate Limit Profiles
export const RATE_LIMIT_CONFIG = {
  ADMIN_LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  ORDER_LOOKUP: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  COD_ORDER: { windowMs: 10 * 60 * 1000, maxRequests: 5 },
  CHECKOUT_VALIDATE: { windowMs: 10 * 60 * 1000, maxRequests: 30 },
  PAYMENT_CREATE: { windowMs: 10 * 60 * 1000, maxRequests: 15 },
  STOREFRONT_SEARCH: { windowMs: 1 * 60 * 1000, maxRequests: 60 },
};

/**
 * Synchronous in-memory sliding-window rate limit check.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  const record = rateLimitStore.get(key) || { timestamps: [] };

  // Filter timestamps within the current sliding window
  const activeTimestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= options.maxRequests) {
    const oldestTimestamp = activeTimestamps[0];
    const resetMs = Math.max(0, oldestTimestamp + options.windowMs - now);

    return {
      allowed: false,
      currentCount: activeTimestamps.length,
      remaining: 0,
      resetMs,
      isDistributed: false,
    };
  }

  // Record this request
  activeTimestamps.push(now);
  rateLimitStore.set(key, { timestamps: activeTimestamps });

  return {
    allowed: true,
    currentCount: activeTimestamps.length,
    remaining: Math.max(0, options.maxRequests - activeTimestamps.length),
    resetMs: options.windowMs,
    isDistributed: false,
  };
}

/**
 * Async rate limiter that uses Upstash Redis REST when configured,
 * seamlessly falling back to in-memory sliding window if Redis is unconfigured or fails.
 */
export async function checkDistributedRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken && !redisUrl.includes("replace_with")) {
    try {
      const windowSeconds = Math.ceil(options.windowMs / 1000);
      const redisKey = `ratelimit:${key}:${Math.floor(Date.now() / options.windowMs)}`;

      // Atomic INCR with pipeline EXPIRE via Upstash REST
      const res = await fetch(`${redisUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", redisKey],
          ["EXPIRE", redisKey, windowSeconds],
        ]),
      });

      if (res.ok) {
        const results = await res.json();
        const currentCount = Number(results[0]?.result || 1);

        const allowed = currentCount <= options.maxRequests;
        return {
          allowed,
          currentCount,
          remaining: Math.max(0, options.maxRequests - currentCount),
          resetMs: options.windowMs,
          isDistributed: true,
        };
      }
    } catch (redisErr) {
      console.warn("[RateLimit Distributed Warning]: Redis unavailable, falling back to in-memory limiter.", redisErr);
    }
  }

  // In-memory fallback
  return checkRateLimit(key, options);
}

/**
 * Hardened client IP extraction.
 * Prioritizes trusted CDN and platform headers (Cloudflare CF-Connecting-IP, Vercel Forwarded-For),
 * followed by X-Real-IP and sanitized X-Forwarded-For.
 */
export function getClientIp(headers: Headers): string {
  // 1. Cloudflare Enterprise / Pro connecting IP
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp && isValidIp(cfIp)) return cfIp.trim();

  // 2. Vercel edge trusted forwarder
  const vercelIp = headers.get("x-vercel-forwarded-for");
  if (vercelIp && isValidIp(vercelIp)) return vercelIp.split(",")[0].trim();

  // 3. Nginx / AWS ALB direct real IP
  const realIp = headers.get("x-real-ip");
  if (realIp && isValidIp(realIp)) return realIp.trim();

  // 4. Standard X-Forwarded-For (take the client-origin first entry, sanitized)
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (isValidIp(firstIp)) return firstIp;
  }

  return "127.0.0.1";
}

/**
 * Validates whether an IP address is syntactically IPv4 or IPv6.
 */
function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== "string") return false;
  const clean = ip.trim();
  // IPv4 regex
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(clean)) {
    const parts = clean.split(".").map(Number);
    return parts.every((p) => p >= 0 && p <= 255);
  }
  // IPv6 basic regex
  if (/^[a-fA-F0-9:]{2,39}$/.test(clean) && clean.includes(":")) {
    return true;
  }
  return false;
}
