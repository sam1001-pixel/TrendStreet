import { NextRequest, NextResponse } from "next/server";
import { hashToken, peekAuthToken, redeemAuthToken } from "@/lib/auth-tokens";
import { hashPasswordAsync, passwordProblem } from "@/lib/customer-auth";
import { checkDistributedRateLimit, getClientIp, resetRateLimit, RATE_LIMIT_CONFIG } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const EXPIRED = "This reset link has expired or was already used. Please ask for a new one.";

/** GET ?token=… — lets the reset page say up front whether the link still works (doesn't use it up). */
export async function GET(req: NextRequest) {
  const limit = await checkDistributedRateLimit(`token-redeem:${getClientIp(req.headers)}`, RATE_LIMIT_CONFIG.TOKEN_REDEEM);
  if (!limit.allowed) return NextResponse.json({ valid: false }, { status: 429 });
  const valid = await peekAuthToken(req.nextUrl.searchParams.get("token"), "PASSWORD_RESET").catch(() => false);
  return NextResponse.json({ valid }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * Step 2 of "Forgot password": sets the new password. Uses the link up, proves the customer owns
 * the email (marks it confirmed), and ends every existing session for the account.
 */
export async function POST(req: NextRequest) {
  const limit = await checkDistributedRateLimit(`token-redeem:${getClientIp(req.headers)}`, RATE_LIMIT_CONFIG.TOKEN_REDEEM);
  if (!limit.allowed) return NextResponse.json({ success: false, message: "Too many attempts. Please try again in a few minutes." }, { status: 429 });

  try {
    const body = await req.json().catch(() => ({}));
    const raw = body?.token;
    if (typeof raw !== "string" || !(await peekAuthToken(raw, "PASSWORD_RESET"))) {
      return NextResponse.json({ success: false, message: EXPIRED }, { status: 400 });
    }

    // Check the new password before using the link up, so a rejected password doesn't burn it.
    const row = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(raw) }, select: { user: { select: { email: true } } } });
    const problem = passwordProblem(body?.password, row?.user.email);
    if (problem) return NextResponse.json({ success: false, message: problem }, { status: 400 });

    const token = await redeemAuthToken(raw, "PASSWORD_RESET");
    if (!token) return NextResponse.json({ success: false, message: EXPIRED }, { status: 400 });

    const passwordHash = await hashPasswordAsync(body.password as string);
    const user = await prisma.user.update({
      where: { id: token.userId },
      data: { passwordHash, sessionVersion: { increment: 1 }, emailVerifiedAt: new Date() },
      select: { id: true, email: true },
    });
    // Any other reset links for this account stop working too.
    await prisma.authToken.updateMany({ where: { userId: user.id, purpose: "PASSWORD_RESET", usedAt: null }, data: { usedAt: new Date() } });
    await resetRateLimit(`cust-login-fail:${user.email}`);
    await writeAudit(req, { action: "CUSTOMER_PASSWORD_RESET", entityType: "User", entityId: user.id, userId: user.id });

    return NextResponse.json({ success: true, message: "Your password has been changed and you've been signed out everywhere. Please sign in with the new password." });
  } catch (err) {
    console.error("[Password reset] confirm failed:", (err as Error).message);
    return NextResponse.json({ success: false, message: "We couldn't change your password right now. Please try again." }, { status: 503 });
  }
}
