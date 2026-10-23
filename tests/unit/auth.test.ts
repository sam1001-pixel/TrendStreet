import test from "node:test";
import assert from "node:assert/strict";
import { signSessionToken, verifySessionToken, validateAdminCredentials } from "../../src/lib/auth";

test("auth - signs and verifies valid session tokens", async () => {
  const email = "concierge@trendstreet.com";
  const token = await signSessionToken(email);

  assert.equal(typeof token, "string");
  assert.equal(token.includes("."), true);

  const session = await verifySessionToken(token);
  assert.notEqual(session, null);
  assert.equal(session?.email, email);
  assert.equal(session?.role, "admin");
});

test("auth - rejects tampered tokens", async () => {
  const token = await signSessionToken("admin@trendstreet.com");
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

test("auth - validateAdminCredentials rejects everything when credentials are not configured", () => {
  const saved = process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_PASSWORD;
  assert.equal(validateAdminCredentials(TEST_EMAIL, TEST_PASS).isValid, false);
  process.env.ADMIN_PASSWORD = saved;
  assert.equal(validateAdminCredentials("admin@attacker.com", TEST_PASS).isValid, false);
  assert.equal(validateAdminCredentials(TEST_EMAIL, "").isValid, false);
});
