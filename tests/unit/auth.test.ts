import test from "node:test";
import assert from "node:assert/strict";
import { signSessionToken, verifySessionToken } from "../../src/lib/auth";
import { validateAdminCredentials } from "../../src/lib/admin-credentials";

test("auth - signs and verifies valid session tokens", async () => {
  const email = "concierge@offvybe.com";
  const token = await signSessionToken(email);

  assert.equal(typeof token, "string");
  assert.equal(token.includes("."), true);

  const session = await verifySessionToken(token);
  assert.notEqual(session, null);
  assert.equal(session?.email, email);
  assert.equal(session?.role, "admin");
});

test("auth - rejects tampered tokens", async () => {
  const token = await signSessionToken("admin@offvybe.com");
  const [b64Payload, signature] = token.split(".");

  // Modify payload
  const tamperedPayload = Buffer.from(
    JSON.stringify({ email: "hacker@evil.com", role: "SUPERADMIN", exp: Date.now() + 100000 })
  ).toString("base64url");

  const tamperedToken = `${tamperedPayload}.${signature}`;

  const session = await verifySessionToken(tamperedToken);
  assert.equal(session, null);
});

test("auth - rejects null or empty tokens gracefully without throwing", async () => {
  const emptyResult = await verifySessionToken("");
  assert.equal(emptyResult, null);

  const undefinedResult = await verifySessionToken(undefined);
  assert.equal(undefinedResult, null);

  const garbageResult = await verifySessionToken("not-a-valid-token-format");
  assert.equal(garbageResult, null);
});

const TEST_EMAIL = "owner@example.test";
const TEST_PASS = "Test-Only-Passw0rd!";
process.env.ADMIN_EMAIL = TEST_EMAIL;
process.env.ADMIN_PASSWORD = TEST_PASS;

test("auth - validateAdminCredentials accepts only the configured admin email", () => {
  assert.equal(validateAdminCredentials(TEST_EMAIL, TEST_PASS).isValid, true);
  assert.equal(validateAdminCredentials("  Owner@Example.TEST ", TEST_PASS).isValid, true, "email match is case-insensitive");
  for (const guess of ["admin", "sujal", "sujal@.com", "owner", "administrator"]) {
    assert.equal(validateAdminCredentials(guess, TEST_PASS).isValid, false, `alias "${guess}" must be rejected`);
  }
});

test("auth - validateAdminCredentials enforces strict case-sensitivity on passwords", () => {
  assert.equal(validateAdminCredentials(TEST_EMAIL, TEST_PASS.toLowerCase()).isValid, false);
  assert.equal(validateAdminCredentials(TEST_EMAIL, TEST_PASS + "x").isValid, false);
});

test("auth - validateAdminCredentials has no built-in usernames or passwords", () => {
  for (const [id, pass] of [
    ["admin", "admin"],
    ["admin@offvybe.in", "TrendStreetAdmin2026!"],
    ["root", "password"],
    ["demo", "123456"],
    [TEST_EMAIL, "admin"],
    [TEST_EMAIL, "[REDACTED-rotate-this-password]"],
  ]) {
    assert.equal(validateAdminCredentials(id, pass).isValid, false, `${id} / ${pass} must be rejected`);
  }
});

test("auth - validateAdminCredentials refuses a configured password that is too short", () => {
  const saved = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = "admin";
  assert.equal(validateAdminCredentials(TEST_EMAIL, "admin").isValid, false);
  process.env.ADMIN_PASSWORD = saved;
});

test("auth - admin and customer tokens are not interchangeable", async () => {
  const { signCustomerToken, verifyCustomerToken } = await import("../../src/lib/customer-auth");
  const adminToken = await signSessionToken("owner@example.test");
  assert.equal(await verifyCustomerToken(adminToken), null);
  const customerToken = await signCustomerToken({ id: "u1", email: "a@b.test", name: "A" });
  assert.equal(await verifySessionToken(customerToken), null);
});

test("auth - production without AUTH_SECRET rejects every token and refuses to sign", async () => {
  const token = await signSessionToken("owner@example.test");
  const env = process.env as Record<string, string | undefined>;
  const savedEnv = env.NODE_ENV;
  const savedSecret = env.AUTH_SECRET;
  env.NODE_ENV = "production";
  delete env.AUTH_SECRET;
  try {
    assert.equal(await verifySessionToken(token), null);
    await assert.rejects(() => signSessionToken("owner@example.test"));
  } finally {
    env.NODE_ENV = savedEnv;
    if (savedSecret !== undefined) env.AUTH_SECRET = savedSecret;
  }
});

test("auth - validateAdminCredentials rejects everything when credentials are not configured", () => {
  const saved = process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_PASSWORD;
  assert.equal(validateAdminCredentials(TEST_EMAIL, TEST_PASS).isValid, false);
  process.env.ADMIN_PASSWORD = saved;
  assert.equal(validateAdminCredentials("admin@attacker.com", TEST_PASS).isValid, false);
  assert.equal(validateAdminCredentials(TEST_EMAIL, "").isValid, false);
});

test("auth - ADMIN_PASSWORD_HASH is used when set, and a malformed hash disables login", async () => {
  const { hashPassword } = await import("../../src/lib/customer-auth");
  const env = process.env as Record<string, string | undefined>;
  env.ADMIN_PASSWORD_HASH = hashPassword("Hashed-Admin-Passw0rd").combined;
  try {
    assert.equal(validateAdminCredentials(TEST_EMAIL, "Hashed-Admin-Passw0rd").isValid, true);
    assert.equal(validateAdminCredentials(TEST_EMAIL, TEST_PASS).isValid, false, "hash takes priority over ADMIN_PASSWORD");
    env.ADMIN_PASSWORD_HASH = "$2b$10$notOurFormat";
    assert.equal(validateAdminCredentials(TEST_EMAIL, "Hashed-Admin-Passw0rd").isValid, false);
  } finally {
    delete env.ADMIN_PASSWORD_HASH;
  }
});
