import { NextRequest, NextResponse } from "next/server";
import {
  findCustomerByEmail,
  verifyPassword,
  signCustomerToken,
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE,
} from "@/lib/customer-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Sliding-window rate limit (10 attempts per 15 minutes per IP)
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

    const isPasswordValid = verifyPassword(password, customer.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await signCustomerToken({
      id: customer.id,
      email: customer.email,
      name: customer.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Welcome back to Trend Street.",
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
      secure: process.env.NODE_ENV === "production",
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
