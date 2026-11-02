import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  signCustomerToken,
  verifyCustomerToken,
  findCustomerByEmail,
  createCustomerUser,
} from "../../src/lib/customer-auth";

test("customer-auth - hashes password and verifies correctly", () => {
  const password = "LuxuryStreetwear2026!";
  const { hash, salt, combined } = hashPassword(password);

  assert.equal(typeof hash, "string");
  assert.equal(typeof salt, "string");
  assert.equal(combined.startsWith("pbkdf2."), true);

  // Correct password verification via combined string
  assert.equal(verifyPassword(password, combined), true);

  // Correct password verification via explicit salt
  assert.equal(verifyPassword(password, hash, salt), true);

  // Incorrect password rejection
  assert.equal(verifyPassword("WrongPassword123!", combined), false);
  assert.equal(verifyPassword(password.toLowerCase(), combined), false, "Password must be case-sensitive");
  assert.equal(verifyPassword("", combined), false);
  assert.equal(verifyPassword(password, ""), false);
});

test("customer-auth - signs and verifies valid customer session tokens", async () => {
  const customer = {
    id: "cust_test_123",
    email: "shopper@trendstreet.in",
    name: "Kabir Malhotra",
  };

  const token = await signCustomerToken(customer);
  assert.equal(typeof token, "string");
  assert.equal(token.includes("."), true);

  const session = await verifyCustomerToken(token);
  assert.notEqual(session, null);
  assert.equal(session?.userId, customer.id);
  assert.equal(session?.email, customer.email);
  assert.equal(session?.name, customer.name);
  assert.equal(session?.role, "CUSTOMER");
});

test("customer-auth - rejects tampered customer session tokens", async () => {
  const customer = {
    id: "cust_test_456",
    email: "victim@trendstreet.in",
    name: "Victim User",
  };

  const token = await signCustomerToken(customer);
  const [payloadStr, signature] = token.split(".");

  // Attempt to elevate privileges or tamper email
  const tamperedPayload = Buffer.from(
    JSON.stringify({
      userId: customer.id,
      email: "attacker@evil.com",
      name: "Attacker",
      role: "ADMIN",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 100000,
    })
  ).toString("base64url");

  const tamperedToken = `${tamperedPayload}.${signature}`;
  const verified = await verifyCustomerToken(tamperedToken);
  assert.equal(verified, null);
});

test("customer-auth - rejects empty and malformed tokens gracefully", async () => {
  assert.equal(await verifyCustomerToken(""), null);
  assert.equal(await verifyCustomerToken(undefined), null);
  assert.equal(await verifyCustomerToken("invalid.format.with.extra.dots"), null);
  assert.equal(await verifyCustomerToken("singleparttoken"), null);
});

test("customer-auth - demo accounts and demo passwords are gone", async () => {
  const { verifyCustomerPassword } = await import("../../src/lib/customer-auth");
  const { combined } = hashPassword("A-Real-Password-2026");
  for (const demo of ["password", "customer", "customer123", "demo123", "TrendStreet2026!"]) {
    assert.equal(verifyCustomerPassword(demo, combined), false);
  }
});

test("customer-auth - still verifies hashes made by the previous 100k-iteration format", async () => {
  const crypto = await import("crypto");
  const salt = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
  const legacy = `${salt}:${crypto.pbkdf2Sync("OldPassword!", salt, 100000, 64, "sha512").toString("hex")}`;
  assert.equal(verifyPassword("OldPassword!", legacy), true);
  assert.equal(verifyPassword("oldpassword!", legacy), false);
});

test("customer-auth - account lookups fail loudly without a database instead of using a file", async () => {
  const saved = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    await assert.rejects(() => findCustomerByEmail("customer@trendstreet.in"));
    await assert.rejects(() =>
      createCustomerUser({ email: "x@trendstreet.test", name: "X", password: "CustomPassword2026!" })
    );
  } finally {
    if (saved !== undefined) process.env.DATABASE_URL = saved;
  }
});
