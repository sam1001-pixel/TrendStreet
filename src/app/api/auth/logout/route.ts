import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE, isRequestSecure, verifySessionToken } from "@/lib/auth";
import { adminSessionRevocationKey } from "@/lib/admin-guard";
import { claimOnce } from "@/lib/security-marker";

export const dynamic = "force-dynamic";

/** Admin sign-out. Also revokes the session on the server, so a copied cookie stops working too. */
export async function POST(req: NextRequest) {
  await writeAudit(req, { action: "ADMIN_LOGOUT", entityType: "Session" });
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (session?.sid) {
    await claimOnce(adminSessionRevocationKey(session.sid), SESSION_MAX_AGE * 1000).catch((e) =>
      console.error("[Admin logout] Could not revoke session:", (e as Error).message)
    );
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully." }, { status: 200 });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: isRequestSecure(req),
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
