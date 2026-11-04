import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

/** Whether this browser has a live admin session (signed, not expired, not signed out or revoked). */
export async function GET(req: NextRequest) {
  const guard = await requireAdminSession(req);
  if (!guard.authorized) {
    return NextResponse.json({ authenticated: false, email: null }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ authenticated: true, email: guard.session.email }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
