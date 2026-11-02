import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

/** Only the httpOnly session cookie is accepted — never a header a script could set. */
function extractAdminToken(req: NextRequest): string | undefined {
  return req.cookies.get(SESSION_COOKIE_NAME)?.value || undefined;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cleanPath = pathname.replace(/\/+$/, "") || "/";

  // Administrative API routes
  if (cleanPath.startsWith("/api/admin")) {
    const session = await verifySessionToken(extractAdminToken(req));
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: Valid administrative session token required." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Administrative UI paths
  if (cleanPath.startsWith("/admin")) {
    const session = await verifySessionToken(extractAdminToken(req));

    if (cleanPath === "/admin/login") {
      if (session) return NextResponse.redirect(new URL("/admin", req.url));
      return NextResponse.next();
    }

    if (!session) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
