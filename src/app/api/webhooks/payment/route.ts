import { NextRequest, NextResponse, after } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { confirmRazorpayPayment, sendOrderEmailFromDb } from "@/lib/orders";
import { claimOnce, isClaimed } from "@/lib/security-marker";
import { writeAudit } from "@/lib/audit";

/** Razorpay retries for up to ~24 h; keep processed event ids for a week. */
const EVENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_WEBHOOK_BYTES = 256 * 1024;

export const dynamic = "force-dynamic";

/**
 * Razorpay webhook. Configure in the Razorpay dashboard with events `payment.captured` and `order.paid`,
 * and set the same secret in RAZORPAY_WEBHOOK_SECRET.
 *
 * Any failure returns a 5xx so Razorpay retries; events are de-duplicated in the database by the
 * `x-razorpay-event-id` header.
 */
export async function POST(req: NextRequest) {
  if (Number(req.headers.get("content-length") || 0) > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }
  const rawBody = await req.text();
  if (rawBody.length > MAX_WEBHOOK_BYTES) return NextResponse.json({ error: "Payload too large." }, { status: 413 });
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
    await writeAudit(req, { action: "WEBHOOK_SIGNATURE_FAILED", entityType: "Payment", metadata: { bytes: rawBody.length } });
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
    // Replays of an event we already processed are acknowledged and ignored.
    // (Processing itself is idempotent: confirmRazorpayPayment flips an order at most once.)
    const markerKey = eventId ? `rzp-webhook:${String(eventId).slice(0, 200)}` : null;
    if (markerKey && (await isClaimed(markerKey))) return NextResponse.json({ success: true, duplicate: true });

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
        const orderId = result.orderId;
        const paymentId = String(paymentEntity.id);
        try {
          after(() => sendOrderEmailFromDb(orderId, "Razorpay (UPI / Card / Net Banking)", paymentId).then(() => undefined));
        } catch {
          // Fallback if after() is called outside an active request scope
          void sendOrderEmailFromDb(orderId, "Razorpay (UPI / Card / Net Banking)", paymentId).catch((err) =>
            console.error("[Webhook] Failed to send order email:", err)
          );
        }
      }
    }

    // Recorded only after processing succeeded, so a failed attempt is retried by Razorpay.
    if (markerKey) await claimOnce(markerKey, EVENT_TTL_MS);

    return NextResponse.json({ success: true });
  } catch (error) {
    // 5xx makes Razorpay retry the delivery.
    console.error("[Webhook] Processing failure:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
