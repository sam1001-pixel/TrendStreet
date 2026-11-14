import { NextRequest, NextResponse, after } from "next/server";
import { issueAuthToken, PASSWORD_RESET_TTL_MS } from "@/lib/auth-tokens";
import { EMAIL_REGEX, normalizeEmail } from "@/lib/customer-session-cookie";
import { checkDistributedRateLimit, getClientIp, RATE_LIMIT_CONFIG } from "@/lib/rate-limit";
import { isEmailDeliveryConfigured, sendPasswordResetEmail } from "@/lib/security-email";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const SENT = "If there's an account for that email, we've sent a link to reset the password. It works once and expires in 30 minutes.";

/**
 * Step 1 of "Forgot password": emails a single-use, 30-minute reset link.
 * Always gives the same answer (and does the lookup after responding), so it can't be used to
 * find out which emails have accounts.
 */
export async function POST(req: NextRequest) {
  const ipLimit = await checkDistributedRateLimit(`pw-reset:${getClientIp(req.headers)}`, RATE_LIMIT_CONFIG.PASSWORD_RESET_IP);
  if (!ipLimit.allowed) {
    return NextResponse.json({ success: false, message: "Too many requests. Please try again in 15 minutes." }, { status: 429 });
  }
  if (!isEmailDeliveryConfigured()) {
    return NextResponse.json(
      { success: false, message: "Password reset by email isn't available yet. Please contact us and we'll help you sign in." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body?.email);
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ success: false, message: "Please enter a valid email address." }, { status: 400 });
  }

  after(async () => {
    try {
      const accountLimit = await checkDistributedRateLimit(`pw-reset-acct:${email}`, RATE_LIMIT_CONFIG.PASSWORD_RESET_ACCOUNT);
      if (!accountLimit.allowed) return;
      const { prisma } = await import("@/lib/prisma");
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, role: true },
      });
      if (!user || user.role !== "CUSTOMER") return;
      const token = await issueAuthToken(user.id, "PASSWORD_RESET", PASSWORD_RESET_TTL_MS);
      await sendPasswordResetEmail(user.email, token);
      await writeAudit(req, { action: "CUSTOMER_PASSWORD_RESET_REQUESTED", entityType: "User", entityId: user.id, userId: user.id });
    } catch (e) {
      console.error("[Password reset] request failed:", (e as Error).message);
    }
  });

  return NextResponse.json({ success: true, message: SENT });
}
