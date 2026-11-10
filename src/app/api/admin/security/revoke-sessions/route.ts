import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, revokeAllAdminSessions } from "@/lib/admin-guard";
import { writeAudit } from "@/lib/audit";
import { clearAdminSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** "Sign out all admin devices": every admin session, including this one, stops working now. */
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;
  try {
    await writeAudit(req, { action: "ADMIN_SESSIONS_REVOKED", entityType: "Session", actorEmail: auth.session.email });
    await revokeAllAdminSessions();
    const res = NextResponse.json({ success: true, message: "Every admin session has been signed out." });
    clearAdminSessionCookie(res, req);
    return res;
  } catch (err) {
    console.error("[Admin revoke sessions]:", (err as Error).message);
    return NextResponse.json({ error: "Could not sign out other sessions. Please try again." }, { status: 503 });
  }
}
