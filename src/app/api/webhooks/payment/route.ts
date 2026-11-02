import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { confirmRazorpayPayment, sendOrderEmailFromDb } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * Razorpay webhook. Configure in the Razorpay dashboard with events `payment.captured` and `order.paid`,
 * and set the same secret in RAZORPAY_WEBHOOK_SECRET.
 *
 * Any failure returns a 5xx so Razorpay retries; events are de-duplicated in the database by the
 * `x-razorpay-event-id` header.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing x-razorpay-signature header." }, { status: 400 });
  }
  if (!process.env.RAZORPAY_WEBHOOK_SECRET && !process.env.PAYMENT_WEBHOOK_SECRET) {
    console.error("[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 500 });
  }
  if (!verifyRazorpayWebhookSignature({ rawBody, signature })) {
    console.warn("[Webhook] Signature mismatch.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const eventType: string = payload?.event || "";
  const paymentEntity = payload?.payload?.payment?.entity;
  const eventId = req.headers.get("x-razorpay-event-id") || (paymentEntity?.id ? `${eventType}:${paymentEntity.id}` : null);

  try {
    if (eventId) {
      const seen = await prisma.auditLog.findFirst({
        where: { action: "PAYMENT_WEBHOOK_PROCESSED", entityId: eventId },
        select: { id: true },
      });
      if (seen) return NextResponse.json({ success: true, duplicate: true });
    }

    if ((eventType === "payment.captured" || eventType === "order.paid") && paymentEntity?.order_id && paymentEntity?.id) {
      const result = await confirmRazorpayPayment({
        gatewayOrderId: paymentEntity.order_id,
        gatewayPaymentId: paymentEntity.id,
        paidAmountMinor: Number(paymentEntity.amount),
        source: "webhook",
      });

      if (result.outcome === "not_found") {
        console.warn(`[Webhook] No saved order for Razorpay order ${paymentEntity.order_id} (payment ${paymentEntity.id}).`);
      } else if (result.outcome === "confirmed" && result.newlyConfirmed) {
        void sendOrderEmailFromDb(result.orderId, "Razorpay (UPI / Card / Net Banking)", paymentEntity.id);
      }
    }

    if (eventId) {
      await prisma.auditLog.create({
        data: {
          action: "PAYMENT_WEBHOOK_PROCESSED",
          entityType: "Payment",
          entityId: eventId,
          metadata: { eventType, gatewayOrderId: paymentEntity?.order_id ?? null, gatewayPaymentId: paymentEntity?.id ?? null },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // 5xx makes Razorpay retry the delivery.
    console.error("[Webhook] Processing failure:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
