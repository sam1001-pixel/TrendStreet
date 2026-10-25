import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

function extractAdminToken(req: NextRequest): string | undefined {
  return (
    req.cookies.get(SESSION_COOKIE_NAME)?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    req.headers.get("x-admin-token") ||
    undefined
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cleanPath = pathname.replace(/\/+$/, "") || "/";

  // Intercept administrative API routes
  if (cleanPath.startsWith("/api/admin")) {
    const token = extractAdminToken(req);
    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: Valid administrative session token required." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Intercept administrative UI paths
  if (cleanPath.startsWith("/admin")) {
    // Permit access to the login page itself
    if (cleanPath === "/admin/login") {
      // If already authenticated, redirect to /admin dashboard
      const token = extractAdminToken(req);
      const session = await verifySessionToken(token);
      if (session) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    // Verify cryptographic session cookie at Edge
    const token = extractAdminToken(req);
    const session = await verifySessionToken(token);

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
