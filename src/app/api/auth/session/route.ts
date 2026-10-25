import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token =
    req.cookies.get(SESSION_COOKIE_NAME)?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    req.headers.get("x-admin-token") ||
    undefined;
  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json(
      { authenticated: false, email: null },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { authenticated: true, email: session.email },
    { status: 200 }
  );
}
