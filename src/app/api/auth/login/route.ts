import { NextRequest, NextResponse } from "next/server";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE, validateAdminCredentials } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce brute-force rate limiting (Max 25 attempts per 15 minutes)
    const clientIp = getClientIp(req.headers);
    const rateLimit = checkRateLimit(`login:${clientIp}`, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 25,
    });

    if (!rateLimit.allowed) {
      const retryAfterSec = Math.ceil(rateLimit.resetMs / 1000);
      return NextResponse.json(
        {
          success: false,
          message: `Too many login attempts. For security reasons, please retry in ${retryAfterSec} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSec),
          },
        }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid email or password format." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    // Centralized server-side credential validation
    const { isValid, email: validatedEmail } = validateAdminCredentials(email, password);
    let isAuthenticatedAdmin = isValid;
    let resolvedEmail = validatedEmail;

    // Secondary verification against Supabase PostgreSQL database if available
    if (!isAuthenticatedAdmin) {
      try {
        const { prisma } = await import("@/lib/prisma");
        const { Role } = await import("@prisma/client");
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: trimmedEmail, mode: "insensitive" } },
              { name: { equals: trimmedEmail, mode: "insensitive" } },
            ],
            role: Role.ADMIN,
          },
        });

        const { timingSafeEqualStr } = await import("@/lib/auth");
        if (
          dbUser &&
          dbUser.passwordHash &&
          timingSafeEqualStr(trimmedPass, dbUser.passwordHash)
        ) {
          isAuthenticatedAdmin = true;
          resolvedEmail = dbUser.email;
        }
      } catch (dbErr) {
        // Fallback silently if DB is in cold start
      }
    }

    if (isAuthenticatedAdmin) {
      await writeAudit(req, { action: "ADMIN_LOGIN", entityType: "Session", actorEmail: resolvedEmail });
      const token = await signSessionToken(resolvedEmail);

      const response = NextResponse.json(
        {
          success: true,
          email: resolvedEmail,
          message: "Authentication successful. Administrative session initialized.",
        },
        { status: 200 }
      );

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });

      return response;
    }

    // Generic error message to prevent account enumeration
    await writeAudit(req, { action: "ADMIN_LOGIN_FAILED", entityType: "Session", actorEmail: null, metadata: { attemptedEmail: trimmedEmail.slice(0, 120) } });
    return NextResponse.json(
      { success: false, message: "Invalid administrative credentials." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Auth login error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication service error." },
      { status: 500 }
    );
  }
}
