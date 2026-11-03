import { NextRequest, NextResponse } from "next/server";
import { AlertInputError, createAlert } from "@/lib/stock-alerts";
import { checkDistributedRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Public sign-up for "Notify me when it's back" and "Remind me about the next drop". */
export async function POST(req: NextRequest) {
  const limit = await checkDistributedRateLimit(`alerts:${getClientIp(req.headers)}`, { windowMs: 10 * 60 * 1000, maxRequests: 12 });
  if (!limit.allowed) {
    return NextResponse.json({ success: false, message: "Too many requests. Please try again in a few minutes." }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    await createAlert({ kind: body?.kind, productId: body?.productId, size: body?.size, email: body?.email, phone: body?.phone });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AlertInputError) return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    console.error("[Alerts sign-up]:", err);
    return NextResponse.json({ success: false, message: "Couldn't save that right now. Please try again." }, { status: 503 });
  }
}
