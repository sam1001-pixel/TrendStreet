import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

/** Only the httpOnly session cookie is accepted — never a header a script could set. */
function extractAdminToken(req: NextRequest): string | undefined {
  return req.cookies.get(SESSION_COOKIE_NAME)?.value || undefined;
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Blocks cross-site form/fetch submissions to our API (CSRF), on top of the SameSite cookies:
 * a browser always sends Origin (or Sec-Fetch-Site) on cross-site POSTs, so another website
 * can't make a signed-in shopper or admin's browser change anything here.
 * Webhooks and cron are server-to-server and verified by their own signatures/secrets.
 */
function isCrossSiteWrite(req: NextRequest, pathname: string): boolean {
  if (!UNSAFE_METHODS.has(req.method)) return false;
  if (pathname.startsWith("/api/webhooks/") || pathname.startsWith("/api/cron/")) return false;
  const origin = req.headers.get("origin");
  if (origin) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    try {
      return new URL(origin).host !== host;
    } catch {
      return true;
    }
  }
  return req.headers.get("sec-fetch-site") === "cross-site";
}

/** Endpoints that legitimately receive non-JSON or large bodies. */
const MULTIPART_ROUTES = new Set(["/api/admin/upload"]);
const PUBLIC_BODY_LIMIT = 64 * 1024; // 64 KB: a full bag + address is a few KB
const ADMIN_BODY_LIMIT = 1024 * 1024; // 1 MB: product and settings editors

/**
 * Cheap checks before any API code runs:
 * - JSON endpoints only accept `Content-Type: application/json` (form/text posts from other
 *   sites — a CSRF trick — and odd parsers never reach the handlers);
 * - bodies over the size limit are refused (Content-Length), instead of being parsed.
 * File uploads have their own type/size checks in the route.
 */
function badBody(req: NextRequest, pathname: string): NextResponse | null {
  if (!UNSAFE_METHODS.has(req.method)) return null;
  if (MULTIPART_ROUTES.has(pathname)) return null;
  const length = Number(req.headers.get("content-length") || 0);
  const limit = pathname.startsWith("/api/admin/") ? ADMIN_BODY_LIMIT : PUBLIC_BODY_LIMIT;
  if (length > limit) return NextResponse.json({ error: "Request too large." }, { status: 413 });
  const hasBody = length > 0 || req.headers.has("transfer-encoding");
  const type = (req.headers.get("content-type") || "").toLowerCase();
  if (hasBody && !type.startsWith("application/json")) {
    return NextResponse.json({ error: "Send the request as JSON." }, { status: 415 });
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cleanPath = pathname.replace(/\/+$/, "") || "/";

  if (cleanPath.startsWith("/api/") && isCrossSiteWrite(req, cleanPath)) {
    return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
  }

  if (cleanPath.startsWith("/api/")) {
    const rejected = badBody(req, cleanPath);
    if (rejected) return rejected;
  }

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
  matcher: ["/admin/:path*", "/api/:path*"],
};
