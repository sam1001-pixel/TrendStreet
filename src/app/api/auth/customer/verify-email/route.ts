import { NextRequest, NextResponse } from "next/server";
import { redeemAuthToken } from "@/lib/auth-tokens";
import { completeConfirmedSignup, signCustomerToken } from "@/lib/customer-auth";
import { setCustomerSessionCookie } from "@/lib/customer-session-cookie";
import { checkDistributedRateLimit, getClientIp, RATE_LIMIT_CONFIG } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Opens the confirmation link from the sign-up email: applies the sign-up and signs the customer in. */
export async function POST(req: NextRequest) {
  const limit = await checkDistributedRateLimit(`token-redeem:${getClientIp(req.headers)}`, RATE_LIMIT_CONFIG.TOKEN_REDEEM);
  if (!limit.allowed) return NextResponse.json({ success: false, message: "Too many attempts. Please try again in a few minutes." }, { status: 429 });

  try {
    const body = await req.json().catch(() => ({}));
    const token = await redeemAuthToken(body?.token, "EMAIL_VERIFY");
    if (!token) {
      return NextResponse.json(
        { success: false, message: "This link has expired or was already used. Sign up again to get a new one, or sign in if you already confirmed." },
        { status: 400 }
      );
    }

    const p = (token.payload ?? {}) as { name?: unknown; phone?: unknown; passwordHash?: unknown };
    if (typeof p.passwordHash !== "string" || !p.passwordHash.startsWith("pbkdf2.") || typeof p.name !== "string") {
      return NextResponse.json({ success: false, message: "This link isn't valid. Please sign up again." }, { status: 400 });
    }

    const user = await completeConfirmedSignup(token.userId, {
      name: p.name.slice(0, 80),
      phone: typeof p.phone === "string" ? p.phone : null,
      passwordHash: p.passwordHash,
    });
    if (!user) {
      return NextResponse.json({ success: false, message: "Your account is already set up. Please sign in." }, { status: 409 });
    }

    await writeAudit(req, { action: "CUSTOMER_EMAIL_CONFIRMED", entityType: "User", entityId: user.id, userId: user.id });
    const session = await signCustomerToken({ id: user.id, email: user.email, name: user.name || "Customer", sessionVersion: user.sessionVersion });
    const res = NextResponse.json({ success: true, message: "Email confirmed — welcome to Trend Street!" });
    setCustomerSessionCookie(res, req, session);
    return res;
  } catch (err) {
    console.error("[Verify email]:", (err as Error).message);
    return NextResponse.json({ success: false, message: "We couldn't confirm your email right now. Please try again." }, { status: 503 });
  }
}
