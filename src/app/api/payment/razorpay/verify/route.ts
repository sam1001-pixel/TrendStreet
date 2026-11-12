import { NextRequest, NextResponse, after } from "next/server";
import { fetchCapturedPayment, getRazorpayClient, verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { confirmRazorpayPayment, sendOrderEmailFromDb } from "@/lib/orders";
import { checkDistributedRateLimit, getClientIp, RATE_LIMIT_CONFIG } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const limit = await checkDistributedRateLimit(`pay-verify:${getClientIp(req.headers)}`, RATE_LIMIT_CONFIG.PAYMENT_VERIFY);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment — your payment is safe." }, { status: 429 });
  }
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
      console.warn(`[Razorpay Signature Verification Failed] Order: ${razorpay_order_id.slice(0, 40)}`);
      await writeAudit(req, { action: "PAYMENT_VERIFY_REJECTED", entityType: "Payment", entityId: razorpay_order_id.slice(0, 64), metadata: { reason: "bad_signature" } });
      return NextResponse.json({ error: "Payment verification failed: Invalid cryptographic signature." }, { status: 400 });
    }

    // What was actually charged and whether it was captured — straight from Razorpay, never from the browser.
    // (Before: an order whose amount_paid was still 0 fell back to the order amount and counted as paid.)
    const captured = await fetchCapturedPayment(getRazorpayClient(), razorpay_payment_id, razorpay_order_id);
    if (captured.state === "mismatch") {
      await writeAudit(req, { action: "PAYMENT_VERIFY_REJECTED", entityType: "Payment", entityId: razorpay_order_id, metadata: { reason: "payment_order_mismatch", paymentId: razorpay_payment_id } });
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    }
    if (captured.state === "pending") {
      return NextResponse.json(
        {
          success: false,
          verified: true,
          pending: true,
          error: "Your bank is still confirming the payment. We'll email you as soon as it's through — please don't pay again.",
        },
        { status: 202 }
      );
    }
    const paidAmountMinor = captured.amount;

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
      const orderId = result.orderId;
      // after(): the email is sent once the response is out, and the serverless function waits for it.
      try {
        after(() => sendOrderEmailFromDb(orderId, "Razorpay (UPI / Card / Net Banking)", razorpay_payment_id).then(() => undefined));
      } catch {
        void sendOrderEmailFromDb(orderId, "Razorpay (UPI / Card / Net Banking)", razorpay_payment_id);
      }
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
    console.error("[Razorpay Verify Error]:", (error as Error).message);
    return NextResponse.json(
      { error: "We received your payment but couldn't confirm it just now. It will be confirmed automatically shortly — please don't pay again." },
      { status: 500 }
    );
  }
}
