import { NextRequest, NextResponse } from "next/server";
import {
  CustomerStoreUnavailableError,
  findCustomerByEmail,
  verifyPasswordAsync,
  spendPasswordCheckTimeAsync,
  passwordNeedsRehash,
  hashPasswordAsync,
  signCustomerToken,
  MAX_PASSWORD_LENGTH,
} from "@/lib/customer-auth";
import { checkDistributedRateLimit, getClientIp, peekRateLimit, recordFailure, resetRateLimit, RATE_LIMIT_CONFIG } from "@/lib/rate-limit";
import { normalizeEmail, setCustomerSessionCookie } from "@/lib/customer-session-cookie";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const INVALID = "Invalid email or password.";

/**
 * Customer sign-in.
 * - Per-IP limit (25 per 15 min) and a per-account limit on *failed* attempts from any IP
 *   (10 per 15 min) against credential stuffing. Both answer the same way whether or not the
 *   account exists, so neither reveals which emails have accounts.
 * - "No such account" spends the same hashing time as "wrong password".
 */
export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req.headers);
    const ipLimit = await checkDistributedRateLimit(`cust-login:${clientIp}`, { windowMs: 15 * 60 * 1000, maxRequests: 25 });
    if (!ipLimit.allowed) {
      const retryAfterSec = Math.ceil(ipLimit.resetMs / 1000);
      return NextResponse.json(
        { success: false, message: `Too many sign-in attempts. Please retry in ${retryAfterSec} seconds.` },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const password = body?.password;
    if (!email || typeof password !== "string" || !password || password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json({ success: false, message: "Please enter your email and password." }, { status: 400 });
    }

    const accountKey = `cust-login-fail:${email}`;
    const accountLimit = await peekRateLimit(accountKey, RATE_LIMIT_CONFIG.CUSTOMER_LOGIN_ACCOUNT);
    if (accountLimit.blocked) {
      await spendPasswordCheckTimeAsync(password);
      const retryAfterSec = Math.max(60, Math.ceil(accountLimit.resetMs / 1000));
      return NextResponse.json(
        { success: false, message: "Too many attempts for this account. Please wait 15 minutes or reset your password." },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    const customer = await findCustomerByEmail(email);
    const ok = customer ? await verifyPasswordAsync(password, customer.passwordHash) : (await spendPasswordCheckTimeAsync(password), false);

    if (!customer || !ok) {
      await recordFailure(accountKey, RATE_LIMIT_CONFIG.CUSTOMER_LOGIN_ACCOUNT);
      const after = await peekRateLimit(accountKey, RATE_LIMIT_CONFIG.CUSTOMER_LOGIN_ACCOUNT);
      if (after.blocked && customer) {
        await writeAudit(req, { action: "CUSTOMER_LOGIN_LOCKED", entityType: "User", entityId: customer.id, userId: customer.id });
      }
      return NextResponse.json({ success: false, message: INVALID }, { status: 401 });
    }

    await Promise.all([resetRateLimit(`cust-login:${clientIp}`), resetRateLimit(accountKey)]);

    // Quietly upgrade old (100k-iteration) hashes now that we have the plain password.
    if (passwordNeedsRehash(customer.passwordHash)) {
      try {
        const { prisma } = await import("@/lib/prisma");
        await prisma.user.update({ where: { id: customer.id }, data: { passwordHash: await hashPasswordAsync(password) } });
      } catch (e) {
        console.warn("[Customer Auth] Hash upgrade skipped:", (e as Error).message);
      }
    }

    const token = await signCustomerToken({ id: customer.id, email: customer.email, name: customer.name, sessionVersion: customer.sessionVersion });
    const response = NextResponse.json({
      success: true,
      message: "Welcome back to OFFVYBE.",
      user: { id: customer.id, email: customer.email, name: customer.name, phone: customer.phone, role: "CUSTOMER" },
    });
    setCustomerSessionCookie(response, req, token);
    return response;
  } catch (error) {
    if (error instanceof CustomerStoreUnavailableError) {
      console.error("[Customer Auth] Store unavailable:", error.message);
      return NextResponse.json({ success: false, message: "Sign-in is temporarily unavailable. Please try again shortly." }, { status: 503 });
    }
    console.error("[Customer Auth] Login error:", (error as Error).message);
    return NextResponse.json({ success: false, message: "Authentication service error. Please try again." }, { status: 500 });
  }
}
