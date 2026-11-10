/**
 * Regression tests for the 2026-11-05 security hardening. Runs against an in-memory stand-in for
 * Prisma (installed on globalThis before src/lib/prisma loads), so no database is needed.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

type Row = Record<string, any>;

const state = {
  markers: new Map<string, number>(), // key -> expiresAt
  buckets: new Map<string, { count: number; resetAt: number }>(),
  users: [] as Row[],
  tokens: [] as Row[],
  coupons: [] as Row[],
  orders: [] as Row[],
  settings: null as Row | null,
  locks: [] as string[],
};

function sqlOf(strings: TemplateStringsArray) {
  return strings.join("?").replace(/\s+/g, " ");
}

const db: any = {
  async $queryRaw(strings: TemplateStringsArray, ...values: any[]) {
    const sql = sqlOf(strings);
    if (sql.includes("INSERT INTO security_markers")) {
      const [key, expiresAt] = values as [string, Date];
      const existing = state.markers.get(key);
      if (existing !== undefined && existing > Date.now()) return [];
      state.markers.set(key, expiresAt.getTime());
      return [{ key }];
    }
    if (sql.includes("INSERT INTO rate_limit_buckets")) {
      const [key, resetAt] = values as [string, Date];
      const b = state.buckets.get(key);
      if (!b || b.resetAt <= Date.now()) state.buckets.set(key, { count: 1, resetAt: resetAt.getTime() });
      else b.count += 1;
      const now = state.buckets.get(key)!;
      return [{ count: now.count, reset_at: new Date(now.resetAt) }];
    }
    if (sql.includes("pg_advisory_xact_lock")) {
      state.locks.push(values[0]);
      return [{}];
    }
    throw new Error("unexpected SQL in test: " + sql);
  },
  async $executeRaw() {
    return 0;
  },
  async $transaction(arg: any) {
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg(db);
  },
  securityMarker: {
    findUnique: async ({ where }: Row) => {
      const e = state.markers.get(where.key);
      return e === undefined ? null : { key: where.key, expiresAt: new Date(e) };
    },
    upsert: async ({ where, create, update }: Row) => {
      const val = state.markers.has(where.key) ? update.expiresAt : create.expiresAt;
      state.markers.set(where.key, new Date(val).getTime());
      return { key: where.key, expiresAt: new Date(val) };
    },
    deleteMany: async () => ({ count: 0 }),
  },
  rateLimitBucket: {
    findUnique: async ({ where }: Row) => {
      const b = state.buckets.get(where.key);
      return b ? { key: where.key, count: b.count, resetAt: new Date(b.resetAt) } : null;
    },
    upsert: async ({ where, create, update }: Row) => {
      const count = state.buckets.has(where.key) ? update.count : create.count;
      const resetAt = state.buckets.has(where.key) ? update.resetAt : create.resetAt;
      state.buckets.set(where.key, { count, resetAt: new Date(resetAt).getTime() });
      return { key: where.key, count, resetAt: new Date(resetAt) };
    },
    update: async ({ where, data }: Row) => {
      const b = state.buckets.get(where.key);
      if (b) {
        b.count = data.count;
        return { key: where.key, count: b.count, resetAt: new Date(b.resetAt) };
      }
      return null;
    },
    deleteMany: async ({ where }: Row) => {
      state.buckets.delete(where.key);
      return { count: 1 };
    },
  },
  user: {
    findUnique: async ({ where }: Row) => state.users.find((u) => (where.id ? u.id === where.id : u.email === where.email)) ?? null,
    update: async ({ where, data }: Row) => {
      const u = state.users.find((x) => x.id === where.id)!;
      for (const [k, v] of Object.entries(data)) u[k] = v && typeof v === "object" && "increment" in (v as Row) ? u[k] + (v as Row).increment : v;
      return u;
    },
  },
  authToken: {
    create: async ({ data }: Row) => {
      const row = { id: `t${state.tokens.length + 1}`, usedAt: null, payload: null, ...data };
      state.tokens.push(row);
      return row;
    },
    updateMany: async ({ where, data }: Row) => {
      const rows = state.tokens.filter(
        (t) => (where.id === undefined || t.id === where.id) && (where.userId === undefined || t.userId === where.userId) && (where.purpose === undefined || t.purpose === where.purpose) && (where.usedAt !== null || t.usedAt === null)
      );
      rows.forEach((r) => Object.assign(r, data));
      return { count: rows.length };
    },
    findUnique: async ({ where }: Row) => state.tokens.find((t) => t.tokenHash === where.tokenHash) ?? null,
  },
  coupon: {
    findUnique: async ({ where }: Row) => state.coupons.find((c) => c.code === where.code) ?? null,
  },
  order: {
    count: async ({ where }: Row) => {
      // Minimal evaluator for the coupon-rule query: same customer (email or phone), counting orders, optional promoCode.
      const [same, counts, promo] = where.AND as Row[];
      return state.orders.filter((o) => {
        const sameCustomer = same.OR.some((c: Row) =>
          c.user ? o.email.toLowerCase() === c.user.email.equals.toLowerCase() : o.phone.includes(c.shippingAddress.phone.contains)
        );
        const counted = !counts.status.notIn.includes(o.status) && !o.paymentFailed;
        return sameCustomer && counted && (!promo || o.promoCode === promo.promoCode);
      }).length;
    },
  },
  siteSettings: {
    findUnique: async () => state.settings,
    upsert: async ({ update }: Row) => {
      state.settings = { ...(state.settings || {}), ...update };
      return state.settings;
    },
  },
};

(globalThis as any).prisma = db;
process.env.AUTH_SECRET = "test-secret-for-security-hardening-0123456789abcdef";
process.env.DATABASE_URL = "postgresql://test"; // routes the rate limiter to the (stubbed) PostgreSQL backend
process.env.ADMIN_EMAIL = "owner@example.test";
process.env.ADMIN_PASSWORD = "Correct-Horse-Battery-2026";

// ---------------------------------------------------------------------------
// Passwords
// ---------------------------------------------------------------------------

test("passwords - common, short and email-based passwords are refused", async () => {
  const { passwordProblem } = await import("../../src/lib/customer-auth");
  assert.match(passwordProblem("short", "a@b.test")!, /at least 8/);
  assert.match(passwordProblem("password123", "a@b.test")!, /too common/);
  assert.match(passwordProblem("aaaaaaaaaa", "a@b.test")!, /too common/);
  assert.match(passwordProblem("kabir.malhotra99", "kabir.malhotra@x.test")!, /email/);
  assert.match(passwordProblem("x".repeat(201))!, /at most/);
  assert.equal(passwordProblem("Quiet-Lantern-48", "kabir@x.test"), null);
});

test("passwords - async hashing round-trips; huge iteration counts and over-long passwords are rejected", async () => {
  const { hashPasswordAsync, verifyPasswordAsync, verifyPassword, passwordNeedsRehash } = await import("../../src/lib/customer-auth");
  const h = await hashPasswordAsync("Quiet-Lantern-48");
  assert.equal(await verifyPasswordAsync("Quiet-Lantern-48", h), true);
  assert.equal(await verifyPasswordAsync("quiet-lantern-48", h), false);
  assert.equal(passwordNeedsRehash(h), false);
  assert.equal(passwordNeedsRehash("a1b2c3d4:deadbeef"), true, "legacy salt:hash is upgraded at sign-in");
  // A stored hash claiming 50M iterations would pin the CPU — it must be refused outright.
  assert.equal(verifyPassword("x", "pbkdf2.50000000.00.00"), false);
  assert.equal(await verifyPasswordAsync("y".repeat(500), h), false);
});

// ---------------------------------------------------------------------------
// Customer sessions
// ---------------------------------------------------------------------------

test("customer sessions - a password change / sign-out-everywhere (sessionVersion) kills old sessions", async () => {
  const { signCustomerToken, getValidCustomerSession } = await import("../../src/lib/customer-auth");
  state.users.push({ id: "u1", email: "kabir@x.test", name: "Kabir", phone: null, role: "CUSTOMER", passwordHash: "pbkdf2.x", sessionVersion: 0 });
  const token = await signCustomerToken({ id: "u1", email: "kabir@x.test", name: "Kabir", sessionVersion: 0 });
  assert.ok(await getValidCustomerSession(token));
  state.users[0].sessionVersion = 1; // bumpSessionVersion()
  assert.equal(await getValidCustomerSession(token), null);
  const fresh = await signCustomerToken({ id: "u1", email: "kabir@x.test", name: "Kabir", sessionVersion: 1 });
  assert.ok(await getValidCustomerSession(fresh));
});

test("customer sessions - tokens past the 90-day absolute limit are refused even if rotated", async () => {
  const { signCustomerToken, verifyCustomerToken } = await import("../../src/lib/customer-auth");
  const old = await signCustomerToken({ id: "u1", email: "kabir@x.test", name: "Kabir" }, Date.now() - 91 * 24 * 3600 * 1000);
  assert.equal(await verifyCustomerToken(old), null);
});

test("customer sessions - pre-upgrade tokens (no sv field) keep working while the account is at version 0", async () => {
  const { getValidCustomerSession } = await import("../../src/lib/customer-auth");
  const { signToken } = await import("../../src/lib/session-token");
  state.users.push({ id: "u2", email: "old@x.test", name: "Old", phone: null, role: "CUSTOMER", passwordHash: "pbkdf2.x", sessionVersion: 0 });
  const legacy = await signToken({ userId: "u2", email: "old@x.test", name: "Old", role: "CUSTOMER", issuedAt: Date.now(), expiresAt: Date.now() + 60_000 }, "customer");
  assert.ok(await getValidCustomerSession(legacy));
});

// ---------------------------------------------------------------------------
// One-time email links
// ---------------------------------------------------------------------------

test("auth tokens - stored hashed, single use, and a newer link cancels the older one", async () => {
  const { issueAuthToken, redeemAuthToken, hashToken } = await import("../../src/lib/auth-tokens");
  const first = await issueAuthToken("u1", "PASSWORD_RESET", 60_000);
  const second = await issueAuthToken("u1", "PASSWORD_RESET", 60_000);
  assert.ok(!state.tokens.some((t) => t.tokenHash === first), "the raw token is never stored");
  assert.ok(state.tokens.some((t) => t.tokenHash === hashToken(first)));
  assert.equal(await redeemAuthToken(first, "PASSWORD_RESET"), null, "older link no longer works");
  assert.ok(await redeemAuthToken(second, "PASSWORD_RESET"));
  assert.equal(await redeemAuthToken(second, "PASSWORD_RESET"), null, "can't be used twice");
});

test("auth tokens - wrong purpose, expired and malformed tokens are refused", async () => {
  const { issueAuthToken, redeemAuthToken } = await import("../../src/lib/auth-tokens");
  const t = await issueAuthToken("u1", "EMAIL_VERIFY", 60_000);
  assert.equal(await redeemAuthToken(t, "PASSWORD_RESET"), null);
  const expired = await issueAuthToken("u1", "PASSWORD_RESET", -1);
  assert.equal(await redeemAuthToken(expired, "PASSWORD_RESET"), null);
  assert.equal(await redeemAuthToken("' OR 1=1 --", "PASSWORD_RESET"), null);
  assert.equal(await redeemAuthToken({ $ne: null } as unknown, "PASSWORD_RESET"), null);
});

// ---------------------------------------------------------------------------
// Rate limiting & client IP
// ---------------------------------------------------------------------------

test("rate limit - shared (PostgreSQL) counter blocks after the limit and resets", async () => {
  const { checkDistributedRateLimit, peekRateLimit, recordFailure, resetRateLimit } = await import("../../src/lib/rate-limit");
  const opts = { windowMs: 60_000, maxRequests: 3 };
  for (let i = 0; i < 3; i++) assert.equal((await checkDistributedRateLimit("t:ip", opts)).allowed, true);
  const blocked = await checkDistributedRateLimit("t:ip", opts);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.backend, "postgres");
  await resetRateLimit("t:ip");
  assert.equal((await checkDistributedRateLimit("t:ip", opts)).allowed, true);

  // "Only failures count": peek doesn't add, recordFailure does.
  assert.equal((await peekRateLimit("t:acct", opts)).blocked, false);
  for (let i = 0; i < 3; i++) await recordFailure("t:acct", opts);
  assert.equal((await peekRateLimit("t:acct", opts)).blocked, true);
});

test("client IP - X-Forwarded-For is ignored unless the proxy is trusted", async () => {
  const { getClientIp } = await import("../../src/lib/rate-limit");
  const env = process.env as Record<string, string | undefined>;
  const saved = { NODE_ENV: env.NODE_ENV, VERCEL: env.VERCEL, TRUST: env.TRUST_PROXY_HEADERS };
  try {
    env.NODE_ENV = "production";
    delete env.VERCEL;
    delete env.TRUST_PROXY_HEADERS;
    const spoofed = new Headers({ "x-forwarded-for": "6.6.6.6", "x-real-ip": "7.7.7.7" });
    assert.equal(getClientIp(spoofed), "unknown", "a client can't choose its own rate-limit bucket");
    env.VERCEL = "1";
    assert.equal(getClientIp(new Headers({ "x-real-ip": "203.0.113.9" })), "203.0.113.9");
    assert.equal(getClientIp(new Headers({ "x-real-ip": "not-an-ip<script>" })), "unknown");
  } finally {
    env.NODE_ENV = saved.NODE_ENV;
    if (saved.VERCEL === undefined) delete env.VERCEL; else env.VERCEL = saved.VERCEL;
    if (saved.TRUST !== undefined) env.TRUST_PROXY_HEADERS = saved.TRUST;
  }
});

// ---------------------------------------------------------------------------
// Admin two-step sign-in
// ---------------------------------------------------------------------------

test("admin 2FA - a TOTP code can't be replayed, and recovery codes work exactly once", async () => {
  const { generateTotpSecret, totpCode } = await import("../../src/lib/totp");
  const { verifySecondFactor, generateRecoveryCodes, hashRecoveryCode } = await import("../../src/lib/admin-mfa");
  const env = process.env as Record<string, string | undefined>;
  env.ADMIN_TOTP_SECRET = generateTotpSecret();
  const codes = generateRecoveryCodes(2);
  env.ADMIN_RECOVERY_CODE_HASHES = codes.map(hashRecoveryCode).join(",");
  try {
    const now = totpCode(env.ADMIN_TOTP_SECRET);
    assert.deepEqual(await verifySecondFactor(now), { ok: true, method: "totp" });
    assert.deepEqual(await verifySecondFactor(now), { ok: false }, "same code again = replay");
    assert.deepEqual(await verifySecondFactor("000000"), { ok: false });

    assert.match(codes[0], /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    assert.deepEqual(await verifySecondFactor(codes[0].toLowerCase().replace(/-/g, "")), { ok: true, method: "recovery" });
    assert.deepEqual(await verifySecondFactor(codes[0]), { ok: false }, "recovery codes are single use");
    assert.deepEqual(await verifySecondFactor("AAAA-BBBB-CCCC-DDDD"), { ok: false });
  } finally {
    delete env.ADMIN_TOTP_SECRET;
    delete env.ADMIN_RECOVERY_CODE_HASHES;
  }
});

test("admin 2FA - ADMIN_REQUIRE_2FA blocks password-only sign-in in production", async () => {
  const { mfaRequiredButMissing } = await import("../../src/lib/admin-mfa");
  const env = process.env as Record<string, string | undefined>;
  const saved = env.NODE_ENV;
  env.NODE_ENV = "production";
  env.ADMIN_REQUIRE_2FA = "true";
  try {
    assert.equal(mfaRequiredButMissing(), true);
    env.ADMIN_TOTP_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DP";
    assert.equal(mfaRequiredButMissing(), false);
    env.ADMIN_REQUIRE_2FA = "false";
    delete env.ADMIN_TOTP_SECRET;
    assert.equal(mfaRequiredButMissing(), false, "off unless switched on");
  } finally {
    env.NODE_ENV = saved;
    delete env.ADMIN_REQUIRE_2FA;
  }
});

// ---------------------------------------------------------------------------
// Admin sessions
// ---------------------------------------------------------------------------

function adminRequest(token?: string, path = "/api/admin/orders") {
  return new NextRequest(`https://offvybe.test${path}`, { headers: token ? { cookie: `ts_admin_session=${token}` } : {} });
}

test("admin sessions - sensitive actions need a sign-in from the last 30 minutes", async () => {
  const { signToken } = await import("../../src/lib/session-token");
  const { adminCredentialVersion } = await import("../../src/lib/auth");
  const { requireRecentAdminAuth } = await import("../../src/lib/admin-guard");
  const issuedAt = Date.now() - 45 * 60 * 1000;
  const old = await signToken(
    { email: "owner@example.test", role: "admin", issuedAt, expiresAt: Date.now() + 3600_000, cv: await adminCredentialVersion(), sid: "a".repeat(32) },
    "admin"
  );
  const res = await requireRecentAdminAuth(adminRequest(old, "/api/admin/pricing"));
  assert.equal(res.authorized, false);
  if (!res.authorized) {
    assert.equal(res.response.status, 401);
    assert.equal((await res.response.json()).reauth, true);
  }
});

test("admin sessions - signed-out sessions and 'sign out all devices' are rejected server-side", async () => {
  const { signSessionToken, verifySessionToken } = await import("../../src/lib/auth");
  const { requireAdminSession, adminSessionRevocationKey, revokeAllAdminSessions } = await import("../../src/lib/admin-guard");
  const { claimOnce } = await import("../../src/lib/security-marker");

  const a = await signSessionToken("owner@example.test");
  assert.equal((await requireAdminSession(adminRequest(a))).authorized, true);
  const sid = (await verifySessionToken(a))!.sid!;
  assert.match(sid, /^[0-9a-f]{32}$/);
  await claimOnce(adminSessionRevocationKey(sid), 60_000); // what /api/auth/logout does
  assert.equal((await requireAdminSession(adminRequest(a))).authorized, false);

  const b = await signSessionToken("owner@example.test");
  assert.equal((await requireAdminSession(adminRequest(b))).authorized, true);
  await new Promise((r) => setTimeout(r, 5));
  await revokeAllAdminSessions();
  assert.equal((await requireAdminSession(adminRequest(b))).authorized, false);
  await new Promise((r) => setTimeout(r, 5));
  const c = await signSessionToken("owner@example.test");
  assert.equal((await requireAdminSession(adminRequest(c))).authorized, true, "a fresh sign-in works again");
  assert.equal((await requireAdminSession(adminRequest(undefined))).authorized, false);
});

test("admin device cookie - only valid for the configured admin, and a customer token can't pass as one", async () => {
  const { signAdminDeviceToken, verifyAdminDeviceToken } = await import("../../src/lib/auth");
  const { signCustomerToken } = await import("../../src/lib/customer-auth");
  assert.equal(await verifyAdminDeviceToken(await signAdminDeviceToken("owner@example.test")), true);
  assert.equal(await verifyAdminDeviceToken(await signAdminDeviceToken("someone@else.test")), false);
  assert.equal(await verifyAdminDeviceToken(await signCustomerToken({ id: "u1", email: "owner@example.test", name: "x" })), false);
});

// ---------------------------------------------------------------------------
// Middleware: CSRF, content type and body size
// ---------------------------------------------------------------------------

test("middleware - cross-site writes, non-JSON bodies and oversized bodies never reach API code", async () => {
  const { middleware } = await import("../../src/middleware");
  type Init = { headers: Record<string, string>; body?: string };
  const call = (init: Init, path = "/api/orders/cod") =>
    middleware(new NextRequest(`https://offvybe.test${path}`, { method: "POST", headers: init.headers, body: init.body }));

  const crossSite = await call({ headers: { origin: "https://evil.test", host: "offvybe.test", "content-type": "application/json" }, body: "{}" });
  assert.equal(crossSite.status, 403);

  const formPost = await call({ headers: { host: "offvybe.test", "content-type": "application/x-www-form-urlencoded", "content-length": "9" }, body: "items=all" });
  assert.equal(formPost.status, 415);

  const huge = await call({ headers: { host: "offvybe.test", "content-type": "application/json", "content-length": String(10 * 1024 * 1024) }, body: "{}" });
  assert.equal(huge.status, 413);

  const ok = await call({ headers: { host: "offvybe.test", origin: "https://offvybe.test", "content-type": "application/json", "content-length": "2" }, body: "{}" });
  assert.equal(ok.status, 200, "same-site JSON passes through to the route");

  const upload = await call({ headers: { host: "offvybe.test", "content-type": "multipart/form-data; boundary=x", "content-length": "100" }, body: "x" }, "/api/admin/upload");
  assert.equal(upload.status, 401, "uploads skip the JSON rule but still need an admin session");
});

// ---------------------------------------------------------------------------
// Business logic
// ---------------------------------------------------------------------------

test("coupons - first-order-only and per-customer limits, matched by canonical email or phone", async () => {
  const { enforceCustomerCouponRules, CouponRuleError, customerIdentity } = await import("../../src/lib/coupons");
  assert.equal(customerIdentity("K.a.b.i.r+promo@GMAIL.com", "").email, "kabir@gmail.com");
  assert.equal(customerIdentity("x@y.in", "+91 98200-11111").phoneDigits, "9820011111");

  state.coupons.push({ code: "WELCOME10", firstOrderOnly: true, perCustomerLimit: null }, { code: "TWICE", firstOrderOnly: false, perCustomerLimit: 2 }, { code: "OPEN", firstOrderOnly: false, perCustomerLimit: null });
  const newbie = { email: "new@x.test", phone: "9000000001" };
  await enforceCustomerCouponRules(db, "WELCOME10", newbie); // no prior orders → fine
  assert.ok(state.locks.length >= 2, "per-customer locks taken before counting");

  state.orders.push({ email: "kabir@gmail.com", phone: "9820011111", status: "DELIVERED", promoCode: null });
  await assert.rejects(() => enforceCustomerCouponRules(db, "WELCOME10", { email: "k.abir+2@gmail.com", phone: "" }), CouponRuleError);
  await assert.rejects(() => enforceCustomerCouponRules(db, "WELCOME10", { email: "other@x.test", phone: "+91 98200 11111" }), CouponRuleError, "same phone, different email");

  state.orders.push({ email: "a@x.test", phone: "9111111111", status: "CONFIRMED", promoCode: "TWICE" });
  await enforceCustomerCouponRules(db, "TWICE", { email: "a@x.test", phone: "9111111111" });
  state.orders.push({ email: "a@x.test", phone: "9111111111", status: "PENDING", promoCode: "TWICE" }); // unpaid still counts
  await assert.rejects(() => enforceCustomerCouponRules(db, "TWICE", { email: "a@x.test", phone: "9111111111" }), CouponRuleError);
  state.orders.push({ email: "b@x.test", phone: "9222222222", status: "CANCELLED", promoCode: "WELCOME10" });
  await enforceCustomerCouponRules(db, "WELCOME10", { email: "b@x.test", phone: "9222222222" }); // cancelled orders don't count
  await enforceCustomerCouponRules(db, "OPEN", { email: "a@x.test", phone: "9111111111" }); // no rules
});

test("admin orders - unpaid online orders can't be confirmed/shipped/re-opened; delivered can't be cancelled", async () => {
  const { checkOrderTransition } = await import("../../src/lib/admin-orders");
  const unpaid = { status: "PENDING", payments: [{ provider: "RAZORPAY", status: "PENDING" }] };
  const paid = { status: "CONFIRMED", payments: [{ provider: "RAZORPAY", status: "CAPTURED" }] };
  const cod = { status: "PENDING", payments: [{ provider: "CASH_ON_DELIVERY", status: "PENDING" }] };
  assert.match(checkOrderTransition(unpaid, "CONFIRMED")!, /hasn't been paid/);
  assert.match(checkOrderTransition(unpaid, "DELIVERED")!, /hasn't been paid/);
  assert.equal(checkOrderTransition(unpaid, "CANCELLED"), null);
  assert.match(checkOrderTransition({ status: "CANCELLED", payments: unpaid.payments }, "PENDING")!, /hasn't been paid/);
  assert.equal(checkOrderTransition(paid, "SHIPPED"), null);
  assert.equal(checkOrderTransition(cod, "CONFIRMED"), null);
  assert.match(checkOrderTransition({ ...paid, status: "DELIVERED" }, "CANCELLED")!, /return/);
  assert.match(checkOrderTransition({ ...paid, status: "SHIPPED" }, "PENDING")!, /Pending/);
  assert.match(checkOrderTransition({ ...paid, status: "REFUNDED" }, "CONFIRMED")!, /refunded/);
});

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

test("config check - flags missing secrets and NEXT_PUBLIC_ secrets, never prints values", async () => {
  const { checkProductionEnv } = await import("../../src/lib/env-check");
  const findings = checkProductionEnv({ NODE_ENV: "production", AUTH_SECRET: "short", NEXT_PUBLIC_RAZORPAY_SECRET: "rzp_live_SECRETVALUE" } as NodeJS.ProcessEnv);
  const keys = findings.map((f) => f.key);
  for (const k of ["AUTH_SECRET", "DATABASE_URL", "RAZORPAY_WEBHOOK_SECRET", "CRON_SECRET", "NEXT_PUBLIC_RAZORPAY_SECRET"]) assert.ok(keys.includes(k), k);
  assert.ok(!JSON.stringify(findings).includes("SECRETVALUE"), "values are never echoed");
});

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

test("payment verify - only a captured payment for this exact order counts as paid", async () => {
  const { fetchCapturedPayment } = await import("../../src/lib/razorpay");
  const fake = (payment: Row, captureResult?: Row | Error) => {
    let current = { ...payment };
    return {
      payments: {
        fetch: async () => current,
        capture: async () => {
          if (captureResult instanceof Error) throw captureResult;
          current = { ...current, ...(captureResult || { status: "captured" }) };
          return current;
        },
      },
    };
  };
  const base = { id: "pay_1", order_id: "order_A", amount: 49900, currency: "INR" };
  assert.deepEqual(await fetchCapturedPayment(fake({ ...base, status: "captured" }), "pay_1", "order_A"), { state: "captured", amount: 49900 });
  assert.deepEqual(await fetchCapturedPayment(fake({ ...base, status: "captured" }), "pay_1", "order_B"), { state: "mismatch" }, "a payment for another order");
  assert.deepEqual(await fetchCapturedPayment(fake({ ...base, status: "authorized" }), "pay_1", "order_A"), { state: "captured", amount: 49900 }, "authorized → captured by us");
  assert.deepEqual(await fetchCapturedPayment(fake({ ...base, status: "authorized" }, new Error("bank busy")), "pay_1", "order_A"), { state: "pending" });
  assert.deepEqual(await fetchCapturedPayment(fake({ ...base, status: "failed" }), "pay_1", "order_A"), { state: "pending" });
});

test("pricing - repeating the same product/size/colour as many lines can't dodge the 10-per-line cap", async () => {
  db.product = {
    findMany: async () => [
      {
        id: "p1", name: "Tee", subtitle: "", basePrice: 49900, originalPrice: null, category: "OVERSIZED", description: "", details: [], fabric: "", careInstructions: "",
        images: [], videos: [], archived: false, featured: false, isNew: false, isBestSeller: false, tags: [],
        variants: [{ id: "v1", size: "M", colorName: "Black", colorHex: "#000", priceAdjustment: 0, inventory: { quantity: 99, reservedQty: 0 } }],
        reviews: [],
      },
    ],
  };
  const { priceOrder, OrderInputError } = await import("../../src/lib/orders");
  const line = { productId: "p1", size: "M", color: "Black", quantity: 6 };
  await assert.rejects(() => priceOrder([line, line], null, "standard"), OrderInputError);
  const ok = await priceOrder([{ ...line, quantity: 4 }, { ...line, quantity: 5 }], null, "standard");
  assert.equal(ok.lines.length, 1);
  assert.equal(ok.lines[0].quantity, 9);
  assert.equal(ok.pricing.subtotalMinor, 9 * 49900, "price comes from the catalogue, not the request");
});

