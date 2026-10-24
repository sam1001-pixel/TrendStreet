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
  assert.equal(combined.includes(":"), true);

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

test("customer-auth - finds pre-seeded default customer user", async () => {
  const user = await findCustomerByEmail("customer@trendstreet.in");
  assert.notEqual(user, null);
  assert.equal(user?.email, "customer@trendstreet.in");
  assert.equal(user?.name, "Aryan Mehra");
  assert.equal(verifyPassword("TrendStreet2026!", user!.passwordHash), true);
});

test("customer-auth - creates new customer and prevents duplicate lookup mismatch", async () => {
  const uniqueEmail = `test_${Date.now()}@trendstreet.test`;
  const newUser = await createCustomerUser({
    email: uniqueEmail,
    name: "Test Customer",
    phone: "+91 99999 88888",
    password: "CustomPassword2026!",
  });

  assert.equal(newUser.email, uniqueEmail);
  assert.equal(newUser.name, "Test Customer");
  assert.equal(newUser.role, "CUSTOMER");

  const fetched = await findCustomerByEmail(uniqueEmail);
  assert.notEqual(fetched, null);
  assert.equal(fetched?.id, newUser.id);
  assert.equal(verifyPassword("CustomPassword2026!", fetched!.passwordHash), true);
  assert.equal(verifyPassword("WrongPassword", fetched!.passwordHash), false);
});
