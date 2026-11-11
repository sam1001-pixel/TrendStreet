import { NextRequest, NextResponse } from "next/server";
import { getRazorpayClient } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

/**
 * Standard Razorpay Order Creation Endpoint
 * POST /api/create-order
 * 
 * Request body: { amount (in paise, >= 100), currency (default "INR"), receipt }
 * Returns: { success: true, order_id, amount, currency, key_id }
 */
export async function POST(req: NextRequest) {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { amount, currency = "INR", receipt = `receipt_${Date.now()}` } = body;

    const amountInPaise = Number(amount);
    if (!amount || isNaN(amountInPaise) || amountInPaise < 100) {
      return NextResponse.json(
        { error: "Invalid amount. Minimum amount is 100 paise (₹1)." },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayClient();

    const order = await razorpay.orders.create({
      amount: Math.round(amountInPaise),
      currency: currency.toUpperCase(),
      receipt: String(receipt).slice(0, 40),
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id,
    });
  } catch (error: any) {
    console.error("[Razorpay Create Order Error]:", error);
    const statusCode = error?.statusCode || error?.status || 500;
    return NextResponse.json(
      { error: error?.error?.description || error?.message || "Failed to create Razorpay order." },
      { status: statusCode === 401 ? 401 : 500 }
    );
  }
}
