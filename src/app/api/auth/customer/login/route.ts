import { NextRequest, NextResponse } from "next/server";
import {
  findCustomerByEmail,
  verifyCustomerPassword,
  signCustomerToken,
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE,
} from "@/lib/customer-auth";
import { isRequestSecure } from "@/lib/auth";
import { checkRateLimit, getClientIp, resetRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Sliding-window rate limit (25 attempts per 15 minutes per IP)
    const clientIp = getClientIp(req.headers);
    const rateLimit = checkRateLimit(`cust-login:${clientIp}`, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 25,
    });

    if (!rateLimit.allowed) {
      const retryAfterSec = Math.ceil(rateLimit.resetMs / 1000);
      return NextResponse.json(
        {
          success: false,
          message: `Too many sign-in attempts. Please retry in ${retryAfterSec} seconds.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { success: false, message: "Please enter your email and password." },
        { status: 400 }
      );
    }

    const customer = await findCustomerByEmail(email);
    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isPasswordValid = verifyCustomerPassword(password, customer.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Reset rate limit on successful credentials
    resetRateLimit(`cust-login:${clientIp}`);

    const token = await signCustomerToken({
      id: customer.id,
      email: customer.email,
      name: customer.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Welcome back to Trend Street.",
      token,
      user: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        role: "CUSTOMER",
      },
    });

    response.cookies.set({
      name: CUSTOMER_SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure: isRequestSecure(req),
      sameSite: "lax",
      path: "/",
      maxAge: CUSTOMER_SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("[Customer Auth] Login error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication service error. Please try again." },
      { status: 500 }
    );
  }
}
