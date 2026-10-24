import { NextRequest, NextResponse } from "next/server";
import {
  findCustomerByEmail,
  createCustomerUser,
  signCustomerToken,
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE,
} from "@/lib/customer-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    // 1. Sliding-window rate limit (5 registration attempts per 15 minutes per IP)
    const clientIp = getClientIp(req.headers);
    const rateLimit = checkRateLimit(`cust-register:${clientIp}`, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 20,
    });

    if (!rateLimit.allowed) {
      const retryAfterSec = Math.ceil(rateLimit.resetMs / 1000);
      return NextResponse.json(
        {
          success: false,
          message: `Too many registration attempts. Please retry in ${retryAfterSec} seconds.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, password, phone } = body;

    // Validate inputs
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Please provide your full name (minimum 2 characters)." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existing = await findCustomerByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, message: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Create customer record
    const newUser = await createCustomerUser({
      name: name.trim(),
      email: normalizedEmail,
      phone: typeof phone === "string" ? phone.trim() : undefined,
      password,
    });

    // Generate signed session token
    const token = await signCustomerToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Your Atelier Account has been successfully created.",
        user: newUser,
      },
      { status: 201 }
    );

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
    console.error("[Customer Auth] Register error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to complete account registration. Please try again." },
      { status: 500 }
    );
  }
}
