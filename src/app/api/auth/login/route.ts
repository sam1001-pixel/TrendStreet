import { NextRequest, NextResponse, after } from "next/server";
import {
  signSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  isRequestSecure,
  ADMIN_DEVICE_COOKIE,
  ADMIN_DEVICE_MAX_AGE,
  signAdminDeviceToken,
  verifyAdminDeviceToken,
} from "@/lib/auth";
import { validateAdminCredentials } from "@/lib/admin-credentials";
import { checkDistributedRateLimit, getClientIp, peekRateLimit, recordFailure, resetRateLimit, RATE_LIMIT_CONFIG } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";
import { mfaRequiredButMissing, twoFactorEnabled, verifySecondFactor } from "@/lib/admin-mfa";
import { sendAdminNewDeviceAlert } from "@/lib/security-email";

export const dynamic = "force-dynamic";

/**
 * Failed admin sign-ins across all IPs. When this budget is used up, only browsers that have
 * signed in before (device cookie) may keep trying — so a distributed guessing attack is paused
 * without locking the real admin out of their usual browser.
 */
const ADMIN_FAILURES_GLOBAL = { windowMs: 60 * 60 * 1000, maxRequests: 30 };
const GLOBAL_FAIL_KEY = "admin-login-fail:all";

/** Tells the login page whether to ask for a 6-digit authenticator code. */
export async function GET() {
  return NextResponse.json({ twoFactor: twoFactorEnabled() });
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req.headers);
    const perIp = await checkDistributedRateLimit(`login:${clientIp}`, RATE_LIMIT_CONFIG.ADMIN_LOGIN);
    if (!perIp.allowed) {
      const retryAfterSec = Math.ceil(perIp.resetMs / 1000);
      return NextResponse.json(
        { success: false, message: `Too many login attempts. Please retry in ${retryAfterSec} seconds.` },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    const knownDevice = await verifyAdminDeviceToken(req.cookies.get(ADMIN_DEVICE_COOKIE)?.value);
    const globalFailures = await peekRateLimit(GLOBAL_FAIL_KEY, ADMIN_FAILURES_GLOBAL);
    if (globalFailures.blocked && !knownDevice) {
      console.warn(`[Admin login] Paused for unknown browsers: ${globalFailures.count} failed attempts in the last hour.`);
      return NextResponse.json(
        {
          success: false,
          message: "Admin sign-in is paused for new browsers after many failed attempts. Use a browser you've signed in with before, or try again in an hour.",
        },
        { status: 429, headers: { "Retry-After": String(Math.max(60, Math.ceil(globalFailures.resetMs / 1000))) } }
      );
    }

    if (mfaRequiredButMissing()) {
      console.error("[Admin login] ADMIN_REQUIRE_2FA=true but ADMIN_TOTP_SECRET is not set — admin sign-in is disabled.");
      return NextResponse.json(
        { success: false, message: "Two-step sign-in is required but not set up on the server. Set ADMIN_TOTP_SECRET in Vercel (npm run admin:2fa)." },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, password } = body ?? {};
    if (!email || !password || typeof email !== "string" || typeof password !== "string" || email.length > 254 || password.length > 200) {
      return NextResponse.json({ success: false, message: "Invalid email or password format." }, { status: 400 });
    }

    const creds = validateAdminCredentials(email, password);
    // The second factor is only checked (and used up) once the password is right.
    const second = creds.isValid && twoFactorEnabled() ? await verifySecondFactor(body?.code) : null;
    const isValid = creds.isValid && (second === null || second.ok);

    if (isValid) {
      await Promise.all([resetRateLimit(`login:${clientIp}`)]);
      const validatedEmail = creds.email;
      await writeAudit(req, {
        action: "ADMIN_LOGIN",
        entityType: "Session",
        actorEmail: validatedEmail,
        metadata: { secondFactor: second && second.ok ? second.method : "none", knownDevice },
      });
      if (second && second.ok && second.method === "recovery") {
        await writeAudit(req, { action: "ADMIN_RECOVERY_CODE_USED", entityType: "Session", actorEmail: validatedEmail });
      }
      if (!knownDevice) {
        await writeAudit(req, { action: "ADMIN_NEW_DEVICE_LOGIN", entityType: "Session", actorEmail: validatedEmail });
        const details = { ip: clientIp, userAgent: req.headers.get("user-agent") || "unknown", at: new Date() };
        after(() => sendAdminNewDeviceAlert(validatedEmail, details).then(() => undefined));
      }

      const token = await signSessionToken(validatedEmail);
      // The token lives only in the httpOnly cookie — never in the response body.
      const response = NextResponse.json({ success: true, email: validatedEmail, message: "Authentication successful." }, { status: 200 });
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: isRequestSecure(req),
        sameSite: "strict",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });
      if (!knownDevice) {
        response.cookies.set({
          name: ADMIN_DEVICE_COOKIE,
          value: await signAdminDeviceToken(validatedEmail),
          httpOnly: true,
          secure: isRequestSecure(req),
          sameSite: "strict",
          path: "/api/auth",
          maxAge: ADMIN_DEVICE_MAX_AGE,
        });
      }
      return response;
    }

    await recordFailure(GLOBAL_FAIL_KEY, ADMIN_FAILURES_GLOBAL);
    await writeAudit(req, {
      action: "ADMIN_LOGIN_FAILED",
      entityType: "Session",
      actorEmail: null,
      metadata: { attemptedEmail: email.trim().toLowerCase().slice(0, 120), knownDevice },
    });
    // Same answer whichever part was wrong, so a guesser learns nothing.
    return NextResponse.json(
      { success: false, message: twoFactorEnabled() ? "Wrong email, password or authenticator code." : "Invalid administrative credentials." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Auth login error:", (error as Error).message);
    return NextResponse.json({ success: false, message: "Authentication service error." }, { status: 500 });
  }
}
