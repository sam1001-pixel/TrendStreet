import type { NextRequest, NextResponse } from "next/server";
import { isRequestSecure } from "./auth";
import { CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_MAX_AGE } from "./customer-auth";

/** The customer session cookie: httpOnly (no JavaScript access), Secure on HTTPS, SameSite=Lax, whole site. */
export function setCustomerSessionCookie(res: NextResponse, req: NextRequest, token: string) {
  res.cookies.set({
    name: CUSTOMER_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: isRequestSecure(req),
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_SESSION_MAX_AGE,
  });
}

export function clearCustomerSessionCookie(res: NextResponse, req: NextRequest) {
  res.cookies.set({
    name: CUSTOMER_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: isRequestSecure(req),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Normalises an email for comparisons and per-account limits. */
export function normalizeEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase().slice(0, 254) : "";
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
