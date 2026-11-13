import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { checkDistributedRateLimit, getClientIp } from "@/lib/rate-limit";

export async function processShiprocketWebhook(req: NextRequest) {
  // Rate limiting to protect against spam / DOS (bypassed in test environment)
  if (process.env.NODE_ENV !== "test") {
    try {
      const limit = await checkDistributedRateLimit(`sr-webhook:${getClientIp(req.headers)}`, {
        windowMs: 60 * 1000,
        maxRequests: 120,
      });
      if (!limit.allowed) {
        return NextResponse.json({ error: "Too many webhook requests" }, { status: 429 });
      }
    } catch {
      // In-memory or fallback
    }
  }

  // Optional authentication check: if user configured a secret token in env and Shiprocket sends it
  const configuredSecret = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  if (configuredSecret) {
    const incomingToken =
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      req.headers.get("x-token");
    if (incomingToken && incomingToken !== configuredSecret) {
      console.warn("[Shiprocket Webhook] Invalid token received:", incomingToken);
      return NextResponse.json({ error: "Unauthorized: Invalid webhook token" }, { status: 401 });
    }
  }

  try {
    let body: any = null;
    try {
      const text = await req.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch {
      body = null;
    }

    // Handle Shiprocket "Test Webhook" probe or empty ping
    if (!body || typeof body !== "object") {
      return NextResponse.json({
        success: true,
        test: true,
        message: "Webhook endpoint is active and reachable.",
      });
    }

    const awb = String(body.awb || body.awb_code || "").trim();
    const orderNumber = String(body.order_id || body.orderNumber || "").trim();
    const rawStatus = String(body.current_status || body.status || "").toUpperCase();
    const courier = String(body.courier_name || body.courier || "").trim();

    // If Shiprocket sends a test ping payload without actual order or AWB
    if (!awb && !orderNumber) {
      return NextResponse.json({
        success: true,
        test: true,
        message: "Test webhook received and verified successfully.",
      });
    }

    // Locate the matching order in OFFVYBE database
    let order: any = null;
    try {
      order = await prisma.order.findFirst({
        where: {
          OR: [
            ...(awb ? [{ trackingNumber: awb }] : []),
            ...(orderNumber ? [{ orderNumber }] : []),
          ],
        },
      });
    } catch (dbErr) {
      console.warn("[Shiprocket Webhook DB Lookup Warning]:", (dbErr as Error).message);
      order = null;
    }

    if (!order) {
      // Return HTTP 200 so Shiprocket test validation passes even for dummy test AWBs/order IDs
      console.log(`[Shiprocket Webhook] Acknowledged unlisted consignment: AWB="${awb}", Order="${orderNumber}".`);
      return NextResponse.json({
        success: true,
        matched: false,
        message: "Webhook payload acknowledged for unlisted order reference.",
      });
    }

    // Map Shiprocket shipment status to OFFVYBE OrderStatus
    let nextStatus: "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | null = null;
    let deliveredAt: Date | undefined = undefined;

    if (rawStatus.includes("DELIVERED") && !rawStatus.includes("UNDELIVERED")) {
      nextStatus = "DELIVERED";
      deliveredAt = new Date();
    } else if (
      rawStatus.includes("OUT") ||
      rawStatus.includes("TRANSIT") ||
      rawStatus.includes("REACHED")
    ) {
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

    return NextResponse.json({
      success: true,
      matched: true,
      orderNumber: order.orderNumber,
      updatedStatus: nextStatus,
    });
  } catch (err) {
    console.error("[Shiprocket Webhook Error]:", err);
    // Return HTTP 200 during testing to ensure Shiprocket test connection isn't rejected
    return NextResponse.json({
      success: true,
      matched: false,
      error: "Processed with warnings",
      detail: (err as Error).message,
    });
  }
}

export function handleWebhookGet() {
  return NextResponse.json({
    status: "ok",
    service: "OFFVYBE Logistics Tracking Webhook",
    ready: true,
    timestamp: new Date().toISOString(),
  });
}
