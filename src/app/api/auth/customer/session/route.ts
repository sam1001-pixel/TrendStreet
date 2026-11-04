import { NextRequest, NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE, getValidCustomerSession, shouldRotateCustomerSession, signCustomerToken } from "@/lib/customer-auth";
import { clearCustomerSessionCookie, setCustomerSessionCookie } from "@/lib/customer-session-cookie";

export const dynamic = "force-dynamic";

/**
 * Who is signed in. Also rotates the session: a session older than a day is re-issued with a
 * fresh expiry (keeping the original sign-in time, so the 90-day absolute limit still applies).
 */
export async function GET(req: NextRequest) {
  try {
    const valid = await getValidCustomerSession(req.cookies.get(CUSTOMER_SESSION_COOKIE)?.value);
    if (!valid) {
      const res = NextResponse.json({ authenticated: false, user: null }, { status: 200 });
      if (req.cookies.get(CUSTOMER_SESSION_COOKIE)) clearCustomerSessionCookie(res, req);
      return res;
    }

    const { session, user } = valid;
    const res = NextResponse.json(
      {
        authenticated: true,
        user: { id: user.id, email: user.email, name: user.name || session.name, phone: user.phone || undefined, role: "CUSTOMER" },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
    if (shouldRotateCustomerSession(session)) {
      const fresh = await signCustomerToken(
        { id: user.id, email: user.email, name: user.name || session.name, sessionVersion: user.sessionVersion },
        session.authAt ?? session.issuedAt
      );
      setCustomerSessionCookie(res, req, fresh);
    }
    return res;
  } catch (error) {
    console.error("[Customer Auth] Session verification error:", (error as Error).message);
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}
