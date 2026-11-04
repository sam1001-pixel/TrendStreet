import test from "node:test";
import assert from "node:assert/strict";
import { base32Encode, base32Decode, totpCode, verifyTotp, generateTotpSecret } from "../../src/lib/totp";

// RFC 6238 test secret "12345678901234567890" (SHA-1), 8-digit vectors truncated to 6 digits.
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890"));

test("totp - matches RFC 6238 test vectors", () => {
  assert.equal(totpCode(RFC_SECRET, 59 * 1000), "287082");
  assert.equal(totpCode(RFC_SECRET, 1111111109 * 1000), "081804");
  assert.equal(totpCode(RFC_SECRET, 1234567890 * 1000), "005924");
});

test("totp - accepts ±30s drift, rejects others", () => {
  const s = generateTotpSecret();
  const now = Date.now();
  assert.equal(verifyTotp(s, totpCode(s, now), now), true);
  assert.equal(verifyTotp(s, totpCode(s, now - 30_000), now), true);
  assert.equal(verifyTotp(s, totpCode(s, now - 120_000), now), false);
  assert.equal(verifyTotp(s, "12345", now), false);
  assert.equal(verifyTotp(s, undefined, now), false);
  assert.deepEqual(base32Decode(base32Encode(Buffer.from("hello"))), Buffer.from("hello"));
});
