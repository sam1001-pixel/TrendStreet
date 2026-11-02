import { NextRequest, NextResponse } from "next/server";
import { getRazorpayClient, verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { confirmRazorpayPayment, sendOrderEmailFromDb } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * Browser callback after Razorpay checkout. Confirms the order saved at create-order.
 * Only the three Razorpay fields are read — the cart, customer and prices are never taken from here.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {};

    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every((v) => typeof v === "string" && v.length > 0)) {
      return NextResponse.json({ error: "Missing required Razorpay payment signature parameters." }, { status: 400 });
    }

    const isValidSignature = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!isValidSignature) {
      console.warn(`[Razorpay Signature Verification Failed] Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`);
      return NextResponse.json({ error: "Payment verification failed: Invalid cryptographic signature." }, { status: 400 });
    }

    // What was actually charged, straight from Razorpay (not from the browser).
    const rzpOrder = await getRazorpayClient().orders.fetch(razorpay_order_id);
    const paidAmountMinor = Number(rzpOrder.amount_paid || rzpOrder.amount);

    const result = await confirmRazorpayPayment({
      gatewayOrderId: razorpay_order_id,
      gatewayPaymentId: razorpay_payment_id,
      gatewaySignature: razorpay_signature,
      paidAmountMinor,
      source: "verify",
    });

    if (result.outcome === "not_found") {
      console.error(`[ORDER NOT FOUND — ACTION REQUIRED] Verified payment ${razorpay_payment_id} for unknown Razorpay order ${razorpay_order_id}`);
      return NextResponse.json(
        {
          success: false,
          verified: true,
          error: `Your payment went through but we couldn't match it to an order. Please contact us with payment ID ${razorpay_payment_id}.`,
        },
        { status: 409 }
      );
    }

    if (result.outcome === "refunded") {
      return NextResponse.json(
        {
          success: false,
          verified: true,
          refunded: true,
          orderNumber: result.orderNumber,
          error: "Sorry — an item sold out while you were paying. Your payment has been refunded in full.",
        },
        { status: 409 }
      );
    }

    if (result.outcome === "confirmed" && result.newlyConfirmed) {
      void sendOrderEmailFromDb(result.orderId, "Razorpay (UPI / Card / Net Banking)", razorpay_payment_id);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      saved: true,
      needsReview: result.outcome === "needs_review",
      orderNumber: result.orderNumber,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (error: unknown) {
    console.error("[Razorpay Verify Error]:", error);
    return NextResponse.json(
      { error: "We received your payment but couldn't confirm it just now. It will be confirmed automatically shortly — please don't pay again." },
      { status: 500 }
    );
  }
}
