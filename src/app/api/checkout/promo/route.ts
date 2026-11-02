import { NextRequest, NextResponse } from "next/server";
import { resolveCoupon } from "@/lib/coupons";
import { checkDistributedRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const INVALID = "Invalid promo code. Please check your spelling or contact us.";

/** Looks up a promo code so the bag can show the discount. Checkout re-checks it on the server. */
export async function POST(req: NextRequest) {
  const limit = await checkDistributedRateLimit(`promo:${getClientIp(req.headers)}`, { windowMs: 10 * 60 * 1000, maxRequests: 20 });
  if (!limit.allowed) {
    return NextResponse.json({ success: false, message: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const coupon = await resolveCoupon(body?.code);
    if (!coupon) return NextResponse.json({ success: false, message: INVALID }, { status: 404 });
    return NextResponse.json({ success: true, coupon });
  } catch (err) {
    console.error("[Promo lookup]:", err);
    return NextResponse.json({ success: false, message: "Promo codes are unavailable right now. Please try again." }, { status: 503 });
  }
}
