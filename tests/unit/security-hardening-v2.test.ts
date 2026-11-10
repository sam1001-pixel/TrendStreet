/**
 * Automated test suite for 2026-11 security hardening:
 * - __Host- cookie prefix enforcement and backward-compatible fallback
 * - Secure multi-cookie revocation on sign-out
 * - Production-mode plain-text admin password rejection
 * - DPDP Act 2023 / GDPR Right to Erasure account deletion endpoint
 */
import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// 1. __Host- Cookie Prefix & Multi-Cookie Lifecycle
// ---------------------------------------------------------------------------

test("cookie hardening - setCustomerSessionCookie uses __Host- prefix on HTTPS", async () => {
  const { setCustomerSessionCookie } = await import("../../src/lib/customer-session-cookie");
  const { SECURE_CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_COOKIE } = await import("../../src/lib/customer-auth");

  const req = new NextRequest("https://offvybe.test/api/auth/customer/login", {
    headers: { "x-forwarded-proto": "https" },
  });
  const res = NextResponse.json({ ok: true });
  setCustomerSessionCookie(res, req, "sample-token-12345");

  const secureCookie = res.cookies.get(SECURE_CUSTOMER_SESSION_COOKIE);
  const plainCookie = res.cookies.get(CUSTOMER_SESSION_COOKIE);

  assert.ok(secureCookie, "Should set __Host- cookie on secure request");
  assert.equal(secureCookie?.value, "sample-token-12345");
  assert.equal(secureCookie?.httpOnly, true);
  assert.equal(secureCookie?.secure, true);
  assert.equal(secureCookie?.sameSite, "lax");
  assert.equal(secureCookie?.path, "/");

  // Legacy/insecure cookie should be invalidated/cleared
  assert.equal(plainCookie?.maxAge, 0, "Should clear insecure cookie to prevent cookie shadow");
});

test("cookie hardening - clearCustomerSessionCookie clears both secure and legacy cookies", async () => {
  const { clearCustomerSessionCookie } = await import("../../src/lib/customer-session-cookie");
  const { SECURE_CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_COOKIE } = await import("../../src/lib/customer-auth");

  const req = new NextRequest("https://offvybe.test/api/auth/customer/logout");
  const res = NextResponse.json({ ok: true });
  clearCustomerSessionCookie(res, req);

  const secureCookie = res.cookies.get(SECURE_CUSTOMER_SESSION_COOKIE);
  const plainCookie = res.cookies.get(CUSTOMER_SESSION_COOKIE);

  assert.equal(secureCookie?.maxAge, 0);
  assert.equal(plainCookie?.maxAge, 0);
});

test("cookie hardening - extractCustomerToken prefers __Host- cookie over legacy cookie", async () => {
  const { extractCustomerToken, CUSTOMER_SESSION_COOKIE, SECURE_CUSTOMER_SESSION_COOKIE } = await import("../../src/lib/customer-auth");

  // When only legacy cookie is present
  const req1 = {
    cookies: {
      get: (name: string) => (name === CUSTOMER_SESSION_COOKIE ? { value: "legacy-token" } : undefined),
    },
  };
  assert.equal(extractCustomerToken(req1), "legacy-token");

  // When both are present, __Host- takes priority
  const req2 = {
    cookies: {
      get: (name: string) => {
        if (name === SECURE_CUSTOMER_SESSION_COOKIE) return { value: "secure-token" };
        if (name === CUSTOMER_SESSION_COOKIE) return { value: "legacy-token" };
        return undefined;
      },
    },
  };
  assert.equal(extractCustomerToken(req2), "secure-token");
});

test("cookie hardening - admin session cookie supports __Host- and extractAdminToken", async () => {
  const { extractAdminToken, SESSION_COOKIE_NAME, SECURE_SESSION_COOKIE_NAME, clearAdminSessionCookie, setAdminSessionCookie } = await import("../../src/lib/auth");

  // Test extraction precedence
  const reqBoth = {
    cookies: {
      get: (name: string) => {
        if (name === SECURE_SESSION_COOKIE_NAME) return { value: "secure-admin-token" };
        if (name === SESSION_COOKIE_NAME) return { value: "plain-admin-token" };
        return undefined;
      },
    },
  };
  assert.equal(extractAdminToken(reqBoth), "secure-admin-token");

  // Test setAdminSessionCookie over HTTPS
  const nextReq = new NextRequest("https://offvybe.test/api/auth/login", {
    headers: { "x-forwarded-proto": "https" },
  });
  const res = NextResponse.json({ ok: true });
  setAdminSessionCookie(res, nextReq, "admin-session-xyz");

  const secCookie = res.cookies.get(SECURE_SESSION_COOKIE_NAME);
  assert.equal(secCookie?.value, "admin-session-xyz");
  assert.equal(secCookie?.httpOnly, true);
  assert.equal(secCookie?.secure, true);
  assert.equal(secCookie?.sameSite, "strict");

  // Test clearAdminSessionCookie clears both
  const clearRes = NextResponse.json({ ok: true });
  clearAdminSessionCookie(clearRes, nextReq);
  assert.equal(clearRes.cookies.get(SECURE_SESSION_COOKIE_NAME)?.maxAge, 0);
  assert.equal(clearRes.cookies.get(SESSION_COOKIE_NAME)?.maxAge, 0);
});

// ---------------------------------------------------------------------------
// 2. Admin Credentials Production Defense-in-Depth
// ---------------------------------------------------------------------------

test("admin credentials - refuses plain-text ADMIN_PASSWORD in production mode", async () => {
  const { validateAdminCredentials } = await import("../../src/lib/admin-credentials");

  const origEnv = process.env.NODE_ENV;
  const origEmail = process.env.ADMIN_EMAIL;
  const origPass = process.env.ADMIN_PASSWORD;
  const origHash = process.env.ADMIN_PASSWORD_HASH;

  try {
    (process.env as any).NODE_ENV = "production";
    process.env.ADMIN_EMAIL = "admin@offvybe.test";
    process.env.ADMIN_PASSWORD = "VerySecurePassword123!";
    delete process.env.ADMIN_PASSWORD_HASH;

    const result = validateAdminCredentials("admin@offvybe.test", "VerySecurePassword123!");
    assert.equal(result.isValid, false, "Plain-text ADMIN_PASSWORD must be rejected in production");
  } finally {
    (process.env as any).NODE_ENV = origEnv;
    process.env.ADMIN_EMAIL = origEmail;
    process.env.ADMIN_PASSWORD = origPass;
    if (origHash) process.env.ADMIN_PASSWORD_HASH = origHash;
    else delete process.env.ADMIN_PASSWORD_HASH;
  }
});

// ---------------------------------------------------------------------------
// 3. Customer Account Deletion (DPDP Act 2023 / Right to Erasure)
// ---------------------------------------------------------------------------

test("account deletion - requires authenticated customer session", async () => {
  const { DELETE } = await import("../../src/app/api/account/route");

  const req = new NextRequest("https://offvybe.test/api/account", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "my-password" }),
  });

  const res = await DELETE(req);
  assert.equal(res.status, 401);
});
