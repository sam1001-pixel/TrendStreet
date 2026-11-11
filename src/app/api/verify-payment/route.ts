import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

/**
 * Standard Razorpay Signature Verification Endpoint
 * POST /api/verify-payment
 * 
 * Request body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Returns: { success: true, message: "Payment verified successfully" }
 */
export async function POST(req: NextRequest) {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return NextResponse.json(
        { success: false, error: "Razorpay secret key is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const order_id = body.razorpay_order_id || body.order_id;
    const payment_id = body.razorpay_payment_id || body.payment_id;
    const signature = body.razorpay_signature || body.signature;

    if (!order_id || !payment_id || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required payment parameters (order_id, payment_id, signature).",
        },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpayPaymentSignature({
      orderId: order_id,
      paymentId: payment_id,
      signature: signature,
      secret: key_secret,
    });

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed: Invalid signature.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      order_id,
      payment_id,
    });
  } catch (error: any) {
    console.error("[Razorpay Verify Payment Error]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error verifying payment." },
      { status: 500 }
    );
  }
}
