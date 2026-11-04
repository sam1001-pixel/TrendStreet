/**
 * Time-based one-time codes (RFC 6238) for admin two-step login — the 6-digit codes from
 * Google Authenticator, Microsoft Authenticator, Authy, 1Password, etc. Node runtime only.
 */
import crypto from "crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error("Invalid base32 secret");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** A new random secret (160 bits), as base32 for authenticator apps. */
export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

export function totpCode(secret: string, timeMs = Date.now(), stepSec = 30): string {
  const counter = Math.floor(timeMs / 1000 / stepSec);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", base32Decode(secret)).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const bin = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(bin % 1_000_000).padStart(6, "0");
}

/** Accepts the current code and one step either side (phone clocks drift a little). */
export function verifyTotp(secret: string, code: unknown, timeMs = Date.now()): boolean {
  if (typeof code !== "string" || !/^\d{6}$/.test(code.trim())) return false;
  const c = code.trim();
  let ok = false;
  for (const drift of [-1, 0, 1]) {
    const expected = totpCode(secret, timeMs + drift * 30_000);
    // Compare every candidate (no early exit) in constant time.
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(c))) ok = true;
  }
  return ok;
}

export function otpauthUrl(secret: string, account: string, issuer = "OFFVYBE Admin") {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
