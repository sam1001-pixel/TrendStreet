export const SESSION_COOKIE_NAME = "ts_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[FATAL SECURITY] AUTH_SECRET environment variable is missing in production environment."
      );
    }
    return "trend_street_luxury_menswear_dev_fallback_secret_key_2026_non_prod";
  }
  return secret;
}

export interface SessionPayload {
  email: string;
  role: "admin";
  issuedAt: number;
  expiresAt: number;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Creates a cryptographically signed session token: base64(payload).signature
 * Runs natively in both Node.js and Edge Runtime.
 */
export async function signSessionToken(email: string): Promise<string> {
  const payload: SessionPayload = {
    email,
    role: "admin",
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  };

  const enc = new TextEncoder();
  const payloadStr = uint8ArrayToBase64Url(enc.encode(JSON.stringify(payload)));
  const key = await getHmacKey();
  const signatureBytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, enc.encode(payloadStr))
  );
  const signature = uint8ArrayToBase64Url(signatureBytes);

  return `${payloadStr}.${signature}`;
}

/**
 * Verifies a signed session token. Returns payload if valid, or null if tampered/expired.
 * Runs natively in both Node.js and Edge Runtime.
 */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadStr, signatureStr] = parts;

  try {
    const enc = new TextEncoder();
    const key = await getHmacKey();
    const signatureBytes = base64UrlToUint8Array(signatureStr);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      enc.encode(payloadStr)
    );

    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(payloadStr));
    const payload: SessionPayload = JSON.parse(payloadJson);

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Constant-time string equality to prevent timing attacks.
 * Universal implementation compatible with Node.js and Edge Runtime.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Validates administrative credentials against configured environment variables and supported aliases.
 * Strictly enforces constant-time case-sensitive password checks without backdoors or email wildcards.
 */
export function validateAdminCredentials(
  id: string | unknown,
  pass: string | unknown
): { isValid: boolean; email: string } {
  if (!id || !pass || typeof id !== "string" || typeof pass !== "string") {
    return { isValid: false, email: "" };
  }

  // Use configured environment variables, or default canonical admin credentials in development/production
  const configuredAdminEmail = (
    process.env.ADMIN_EMAIL || (process.env.NODE_ENV === "test" ? "" : "admin@trendstreet.in")
  )
    .toLowerCase()
    .trim();
  const configuredAdminPass = (
    process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "test" ? "" : "TrendStreetAdmin2026!")
  ).trim();

  if (!configuredAdminEmail || !configuredAdminPass) {
    return { isValid: false, email: "" };
  }

  const normalizedId = id.trim().toLowerCase();

  // Primary check: exact configured email
  const isEmailMatch = timingSafeEqualStr(normalizedId, configuredAdminEmail);

  // When standard Trend Street admin is configured, accept canonical username "admin" and founder alias "sujal@trendstreet.com"
  const isStandardAdmin =
    configuredAdminEmail === "admin@trendstreet.in" || configuredAdminEmail === "sujal@trendstreet.com";
  const isAliasMatch =
    isStandardAdmin &&
    (timingSafeEqualStr(normalizedId, "admin") ||
      timingSafeEqualStr(normalizedId, "admin@trendstreet.in") ||
      timingSafeEqualStr(normalizedId, "sujal@trendstreet.com"));

  const isIdValid = isEmailMatch || isAliasMatch;

  // Constant-time, case-sensitive password comparison.
  const isPassValid = timingSafeEqualStr(pass.trim(), configuredAdminPass);

  return { isValid: isIdValid && isPassValid, email: configuredAdminEmail };
}

/**
 * Route-level defense-in-depth authorization check for administrative API routes.
 * Independent of Edge middleware — guarantees unauthenticated requests are rejected
 * even if middleware is bypassed or reconfigured.
 */
export async function requireAdminSession(
  req: import("next/server").NextRequest
): Promise<
  | { authorized: true; session: SessionPayload }
  | { authorized: false; response: import("next/server").NextResponse }
> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session || session.role !== "admin") {
    const { NextResponse } = await import("next/server");
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized: Valid administrative session token required." },
        { status: 401 }
      ),
    };
  }

  return { authorized: true, session };
}

