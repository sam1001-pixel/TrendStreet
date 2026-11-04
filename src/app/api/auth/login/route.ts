import { NextRequest, NextResponse } from "next/server";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE, isRequestSecure } from "@/lib/auth";
import { validateAdminCredentials } from "@/lib/admin-credentials";
import { checkDistributedRateLimit, getClientIp, resetRateLimit, RATE_LIMIT_CONFIG } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";
import { verifyTotp } from "@/lib/totp";

export const dynamic = "force-dynamic";

// Across all IPs: caps slow, distributed guessing against the single admin account.
const ADMIN_LOGIN_GLOBAL = { windowMs: 60 * 60 * 1000, maxRequests: 30 };

/** Tells the login page whether to ask for a 6-digit authenticator code. */
export async function GET() {
  return NextResponse.json({ twoFactor: Boolean(process.env.ADMIN_TOTP_SECRET) });
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req.headers);
    const [perIp, global] = await Promise.all([
      checkDistributedRateLimit(`login:${clientIp}`, RATE_LIMIT_CONFIG.ADMIN_LOGIN),
      checkDistributedRateLimit("login:all", ADMIN_LOGIN_GLOBAL),
    ]);

    if (!perIp.allowed || !global.allowed) {
      const retryAfterSec = Math.ceil((perIp.allowed ? global.resetMs : perIp.resetMs) / 1000);
      return NextResponse.json(
        { success: false, message: `Too many login attempts. Please retry in ${retryAfterSec} seconds.` },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, password } = body ?? {};

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ success: false, message: "Invalid email or password format." }, { status: 400 });
    }

    const creds = validateAdminCredentials(email, password);
    const validatedEmail = creds.email;
    // Two-step login: when ADMIN_TOTP_SECRET is set, the 6-digit code from the authenticator app is required too.
    const totpSecret = process.env.ADMIN_TOTP_SECRET;
    const codeOk = !totpSecret || verifyTotp(totpSecret, typeof body?.code === "string" ? body.code : "");
    const isValid = creds.isValid && codeOk;

    if (isValid) {
      resetRateLimit(`login:${clientIp}`);
      await writeAudit(req, { action: "ADMIN_LOGIN", entityType: "Session", actorEmail: validatedEmail });
      const token = await signSessionToken(validatedEmail);

      // The token lives only in the httpOnly cookie — never in the response body.
      const response = NextResponse.json(
        { success: true, email: validatedEmail, message: "Authentication successful." },
        { status: 200 }
      );
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: isRequestSecure(req),
        sameSite: "strict",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });
      return response;
    }

    await writeAudit(req, {
      action: "ADMIN_LOGIN_FAILED",
      entityType: "Session",
      actorEmail: null,
      metadata: { attemptedEmail: email.trim().toLowerCase().slice(0, 120) },
    });
    // Same answer whichever part was wrong, so a guesser learns nothing.
    return NextResponse.json(
      { success: false, message: totpSecret ? "Wrong email, password or authenticator code." : "Invalid administrative credentials." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Auth login error:", error);
    return NextResponse.json({ success: false, message: "Authentication service error." }, { status: 500 });
  }
}
