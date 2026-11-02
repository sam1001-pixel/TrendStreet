import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqualStr } from "@/lib/auth";
import { releaseStaleRazorpayOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * Reconciles unpaid online orders: confirms any that Razorpay says were paid (missed webhook),
 * and releases stock for the rest after 30 minutes.
 * Called by Vercel Cron (see vercel.json), which sends `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  if (!secret || !timingSafeEqualStr(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await releaseStaleRazorpayOrders(100);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[Cron release-stale-orders]:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
