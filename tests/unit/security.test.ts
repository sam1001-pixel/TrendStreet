import test from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit } from "../../src/lib/rate-limit";
import { timingSafeEqualStr, signSessionToken, verifySessionToken } from "../../src/lib/auth";
import { calculateOrderPricing } from "../../src/lib/pricing";
import { maskEmailForLogs } from "../../src/lib/email";

test("Negative Security - checkRateLimit enforces sliding-window threshold and rejects brute force", () => {
  const testKey = `test-ip-${Date.now()}`;
  const options = { windowMs: 1000, maxRequests: 3 };

  // 1st request -> allowed
  const r1 = checkRateLimit(testKey, options);
  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 2);

  // 2nd request -> allowed
  const r2 = checkRateLimit(testKey, options);
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 1);

  // 3rd request -> allowed (limit reached)
  const r3 = checkRateLimit(testKey, options);
  assert.equal(r3.allowed, true);
  assert.equal(r3.remaining, 0);

  // 4th request -> BLOCKED (HTTP 429 scenario)
  const r4 = checkRateLimit(testKey, options);
  assert.equal(r4.allowed, false, "4th request must be blocked");
  assert.equal(r4.remaining, 0);
  assert.ok(r4.resetMs > 0, "Must return positive resetMs for Retry-After header");
});

test("Negative Security - timingSafeEqualStr resists timing discrepancies", () => {
  assert.equal(timingSafeEqualStr("admin_password_123", "admin_password_123"), true);
  assert.equal(timingSafeEqualStr("admin_password_123", "admin_password_124"), false);
  assert.equal(timingSafeEqualStr("admin_password_123", "short"), false);
  assert.equal(timingSafeEqualStr("", ""), true);
  assert.equal(timingSafeEqualStr("secret", ""), false);
  assert.equal(timingSafeEqualStr(null as any, "secret"), false);
});

test("Negative Security - tampered session token fails verification", async () => {
  const validToken = await signSessionToken("admin@trendstreet.in");
  const [payload, sig] = validToken.split(".");

  // Tamper signature by flipping characters
  const tamperedSig = sig.slice(0, -2) + "xx";
  const tamperedToken = `${payload}.${tamperedSig}`;

  const verified = await verifySessionToken(tamperedToken);
  assert.equal(verified, null, "Tampered cryptographic signature must be rejected");
});

test("Negative Security - coupon min spend cannot be bypassed", () => {
  // TREND10 requires minimum spend of ₹1,999 (199900 paise)
  const itemsBelowMin = [
    {
      id: "item-1",
      name: "Tee",
      unitPriceMinor: 149900, // ₹1,499
      quantity: 1,
      size: "M",
      color: "Black",
    },
  ];

  const result = calculateOrderPricing(itemsBelowMin, { promoCode: "TREND10" });
  assert.equal(result.promoCodeApplied, null, "Promo code must NOT be applied below min spend");
  assert.equal(result.discountMinor, 0);
});

test("Negative Security - PII email masking prevents sensitive leak in logs", () => {
  assert.equal(maskEmailForLogs("rohan.kulkarni@mumbai.in"), "r***i@mumbai.in");
  assert.equal(maskEmailForLogs("customer@trendstreet.in"), "c***r@trendstreet.in");
  assert.equal(maskEmailForLogs("ab@xyz.com"), "a***@xyz.com");
  assert.equal(maskEmailForLogs(""), "***@***");
});

test("Negative Security - negative or malformed quantities in pricing are sanitized", () => {
  const malformedItems = [
    {
      id: "item-1",
      name: "Hoodie",
      unitPriceMinor: 499900,
      quantity: -5, // Negative quantity attack
      size: "L",
      color: "Burgundy",
    },
  ];

  const pricing = calculateOrderPricing(malformedItems as any);
  // Math.max(1, Math.floor(quantity)) sanitizes negative values to 1
  assert.equal(pricing.subtotalMinor, 499900, "Negative quantity must be clamped to minimum 1");
});
