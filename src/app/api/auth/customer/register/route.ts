import { NextRequest, NextResponse } from "next/server";
import {
  CustomerStoreUnavailableError,
  createCustomerUser,
  emailAccountState,
  passwordProblem,
  signCustomerToken,
} from "@/lib/customer-auth";
import { checkDistributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { EMAIL_REGEX, normalizeEmail, setCustomerSessionCookie } from "@/lib/customer-session-cookie";

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
 * Accounts are created immediately upon registration without confirmation email.
 * Rejects attempts with duplicate email or duplicate mobile number.
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
    const rawPhone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const phone = rawPhone ? cleanPhone(rawPhone) : null;

    if (name.length < 2) {
      return NextResponse.json({ success: false, message: "Please provide your full name (minimum 2 characters)." }, { status: 400 });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, message: "Please provide a valid email address." }, { status: 400 });
    }
    const problem = passwordProblem(password, email);
    if (problem) return NextResponse.json({ success: false, message: problem }, { status: 400 });

    if (!rawPhone || !phone) {
      return NextResponse.json({ success: false, message: "Please provide a valid 10-digit mobile number." }, { status: 400 });
    }

    // Reject if account with same email already exists
    const emailState = await emailAccountState(email);
    if (emailState === "account" || emailState === "staff") {
      return NextResponse.json(
        { success: false, message: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }
    if (emailState === "guest") {
      return NextResponse.json(
        { success: false, message: "This email was used for guest orders. Please use 'Forgot password' to set your password and access your account." },
        { status: 409 }
      );
    }

    // Reject if account with same phone number already exists
    if (phone) {
      const { prisma } = await import("@/lib/prisma");
      const phoneDigits = phone.slice(-10);
      const existingPhone = await prisma.user.findFirst({
        where: {
          OR: [
            { phone },
            { phone: phoneDigits },
            { phone: `+91${phoneDigits}` },
            { phone: `91${phoneDigits}` },
            { phone: { contains: phoneDigits } },
          ],
        },
        select: { id: true },
      });
      if (existingPhone) {
        return NextResponse.json(
          { success: false, message: "An account with this mobile number already exists. Please sign in or use a different number." },
          { status: 409 }
        );
      }
    }

    // Immediate account creation without confirmation email
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
    if (error instanceof Error && error.message === "PHONE_EXISTS") {
      return NextResponse.json(
        { success: false, message: "An account with this mobile number already exists. Please sign in or use a different number." },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === "GUEST_EXISTS") {
      return NextResponse.json(
        { success: false, message: "This email was used for guest orders. Please use 'Forgot password' to set your password and access your account." },
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
