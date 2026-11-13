import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { checkDistributedRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Shiprocket Live Tracking Webhook Receiver
 *
 * Configured in Shiprocket: Settings -> Webhooks -> Add Webhook
 * Event: Tracking Updates (Status changes, Out for Delivery, Delivered, RTO)
 */
export async function POST(req: NextRequest) {
  const limit = await checkDistributedRateLimit(`sr-webhook:${getClientIp(req.headers)}`, {
    windowMs: 60 * 1000,
    maxRequests: 100,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many webhook requests" }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const awb = String(body.awb || body.awb_code || "").trim();
    const orderNumber = String(body.order_id || body.orderNumber || "").trim();
    const rawStatus = String(body.current_status || body.status || "").toUpperCase();
    const courier = String(body.courier_name || body.courier || "").trim();

    if (!awb && !orderNumber) {
      return NextResponse.json({ error: "Missing AWB or Order Number in webhook payload" }, { status: 400 });
    }

    // Locate the matching order
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(awb ? [{ trackingNumber: awb }] : []),
          ...(orderNumber ? [{ orderNumber }] : []),
        ],
      },
    });

    if (!order) {
      console.warn(`[Shiprocket Webhook] No matching order found for AWB: "${awb}", Order: "${orderNumber}".`);
      return NextResponse.json({ success: true, matched: false });
    }

    // Map Shiprocket status to OFFVYBE OrderStatus
    let nextStatus: "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | null = null;
    let deliveredAt: Date | undefined = undefined;

    if (rawStatus.includes("DELIVERED") && !rawStatus.includes("UNDELIVERED")) {
      nextStatus = "DELIVERED";
      deliveredAt = new Date();
    } else if (rawStatus.includes("OUT") || rawStatus.includes("TRANSIT") || rawStatus.includes("REACHED")) {
      nextStatus = "IN_TRANSIT";
    } else if (rawStatus.includes("PICKED") || rawStatus.includes("MANIFEST")) {
      nextStatus = "SHIPPED";
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        ...(awb && !order.trackingNumber ? { trackingNumber: awb } : {}),
        ...(courier ? { deliveryCourier: courier } : {}),
        ...(nextStatus && order.status !== "DELIVERED" ? { status: nextStatus } : {}),
        ...(deliveredAt ? { deliveredAt } : {}),
      },
    });

    await writeAudit(req, {
      action: "ORDER_TRACKING_UPDATE",
      entityType: "Order",
      entityId: order.id,
      metadata: {
        source: "shiprocket_webhook",
        orderNumber: order.orderNumber,
        awb,
        rawStatus,
        nextStatus,
        courier,
      },
    });

    return NextResponse.json({ success: true, matched: true, orderNumber: order.orderNumber, updatedStatus: nextStatus });
  } catch (err) {
    console.error("[Shiprocket Webhook Error]:", err);
    return NextResponse.json({ error: "Internal webhook processing error" }, { status: 500 });
  }
}
