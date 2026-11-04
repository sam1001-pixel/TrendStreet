import { NextRequest, NextResponse, after } from "next/server";
import {
  CustomerStoreUnavailableError,
  createCustomerUser,
  emailAccountState,
  hashPasswordAsync,
  passwordProblem,
  signCustomerToken,
} from "@/lib/customer-auth";
import { checkDistributedRateLimit, getClientIp, RATE_LIMIT_CONFIG } from "@/lib/rate-limit";
import { EMAIL_REGEX, normalizeEmail, setCustomerSessionCookie } from "@/lib/customer-session-cookie";
import { isEmailDeliveryConfigured, sendAccountExistsEmail, sendEmailConfirmation } from "@/lib/security-email";
import { EMAIL_VERIFY_TTL_MS, issueAuthToken } from "@/lib/auth-tokens";

export const dynamic = "force-dynamic";

const cleanName = (v: unknown) => (typeof v === "string" ? v.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) : "");
const cleanPhone = (v: unknown) => {
  if (typeof v !== "string") return null;
  const digits = v.replace(/\D/g, "").replace(/^(91|0)(?=[6-9]\d{9}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};

/**
 * Customer sign-up.
 *
 * With email delivery configured (RESEND_API_KEY), sign-up always needs the confirmation link:
 * - the answer is the same whether or not the email already has an account (no enumeration),
 * - nothing on an existing record changes until the inbox owner opens the link,
 * - someone who types another person's email can't take over that person's guest orders or phone.
 *
 * Without email delivery, brand-new emails get an account straight away (as before), and emails
 * that already exist are refused — claiming a guest-checkout record needs the confirmation link.
 */
export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req.headers);
    const rateLimit = await checkDistributedRateLimit(`cust-register:${clientIp}`, { windowMs: 15 * 60 * 1000, maxRequests: 10 });
    if (!rateLimit.allowed) {
      const retryAfterSec = Math.ceil(rateLimit.resetMs / 1000);
      return NextResponse.json(
        { success: false, message: `Too many registration attempts. Please retry in ${retryAfterSec} seconds.` },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const name = cleanName(body?.name);
    const email = normalizeEmail(body?.email);
    const password = body?.password;
    const phone = cleanPhone(body?.phone);

    if (name.length < 2) {
      return NextResponse.json({ success: false, message: "Please provide your full name (minimum 2 characters)." }, { status: 400 });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, message: "Please provide a valid email address." }, { status: 400 });
    }
    const problem = passwordProblem(password, email);
    if (problem) return NextResponse.json({ success: false, message: problem }, { status: 400 });

    // ---------------------------------------------------------------
    // Email confirmation flow
    // ---------------------------------------------------------------
    if (isEmailDeliveryConfigured()) {
      // Hash first in every branch so the response time doesn't reveal whether the email exists.
      const passwordHash = await hashPasswordAsync(password as string);
      const state = await emailAccountState(email);
      const sendLimit = await checkDistributedRateLimit(`email-confirm-send:${email}`, RATE_LIMIT_CONFIG.EMAIL_CONFIRM_SEND);

      if (sendLimit.allowed && state !== "staff") {
        after(async () => {
          try {
            if (state === "account") {
              await sendAccountExistsEmail(email);
              return;
            }
            const { prisma } = await import("@/lib/prisma");
            // A placeholder record (no password) for brand-new emails; guests already have one.
            const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email, role: "CUSTOMER" }, select: { id: true } });
            const token = await issueAuthToken(user.id, "EMAIL_VERIFY", EMAIL_VERIFY_TTL_MS, { name, phone, passwordHash });
            await sendEmailConfirmation(email, token);
          } catch (e) {
            console.error("[Customer Auth] Confirmation email failed:", (e as Error).message);
          }
        });
      }

      return NextResponse.json(
        {
          success: true,
          pendingConfirmation: true,
          message: `We've sent a link to ${email}. Open it within 24 hours to finish creating your account. (Check spam if it isn't there in a minute.)`,
        },
        { status: 202 }
      );
    }

    // ---------------------------------------------------------------
    // No email delivery: immediate accounts for brand-new emails only
    // ---------------------------------------------------------------
    const newUser = await createCustomerUser({ name, email, phone: phone ?? undefined, password: password as string });
    const token = await signCustomerToken({ id: newUser.id, email: newUser.email, name: newUser.name, sessionVersion: 0 });
    const response = NextResponse.json(
      { success: true, message: "Your Atelier Account has been successfully created.", user: newUser },
      { status: 201 }
    );
    setCustomerSessionCookie(response, req, token);
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "ACCOUNT_EXISTS") {
      return NextResponse.json(
        { success: false, message: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === "GUEST_EXISTS") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This email already has orders with us. To keep them safe we need to confirm the email is yours, which isn't available online yet — please contact us and we'll set up your account.",
        },
        { status: 409 }
      );
    }
    if (error instanceof CustomerStoreUnavailableError) {
      console.error("[Customer Auth] Store unavailable:", error.message);
      return NextResponse.json({ success: false, message: "Registration is temporarily unavailable. Please try again shortly." }, { status: 503 });
    }
    console.error("[Customer Auth] Register error:", (error as Error).message);
    return NextResponse.json({ success: false, message: "Unable to complete account registration. Please try again." }, { status: 500 });
  }
}
