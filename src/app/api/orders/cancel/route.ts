import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDistributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { releaseOrderResources } from "@/lib/orders";
import { canCancel, customerOrderInclude, loadOwnOrder, toCustomerOrder } from "@/lib/order-actions";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const NOT_FOUND = "We couldn't find an order with that number and email.";

/**
 * Customer cancels their own cash-on-delivery order before it ships. Stock and any coupon use go back.
 * Prepaid orders are refunded by the team, so those get a message to contact support instead.
 */
export async function POST(req: NextRequest) {
  const limit = await checkDistributedRateLimit(`order-cancel:${getClientIp(req.headers)}`, { windowMs: 15 * 60 * 1000, maxRequests: 10 });
  if (!limit.allowed) return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });

  try {
    const body = await req.json().catch(() => ({}));
    const order = await loadOwnOrder(req, body?.orderNumber, body?.email);
    if (!order) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    if (!canCancel(order)) {
      return NextResponse.json(
        { error: order.status === "CANCELLED" ? "This order is already cancelled." : "This order can't be cancelled online any more. Please contact us and we'll help." },
        { status: 409 }
      );
    }
    const reason = typeof body?.reason === "string" ? body.reason.replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 120) : "";

    const updated = await prisma.$transaction(async (tx) => {
      // Conditional update: only one cancel can win, and never after the store has moved the order on.
      const won = await tx.order.updateMany({
        where: { id: order.id, status: { in: ["PENDING", "CONFIRMED"] }, trackingNumber: null },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason ? `Customer: ${reason}` : "Cancelled by customer" },
      });
      if (won.count === 0) return null;
      await releaseOrderResources(tx, order);
      return tx.order.findUnique({ where: { id: order.id }, include: customerOrderInclude });
    });
    if (!updated) return NextResponse.json({ error: "This order was just updated by our team. Please refresh." }, { status: 409 });

    await writeAudit(req, {
      action: "ORDER_CANCELLED_BY_CUSTOMER",
      entityType: "Order",
      entityId: order.id,
      metadata: { orderNumber: order.orderNumber, reason: reason || null },
    }).catch(() => {});

    return NextResponse.json({ success: true, order: toCustomerOrder(updated) });
  } catch (err) {
    console.error("[Order cancel]:", err);
    return NextResponse.json({ error: "We couldn't cancel the order right now. Please try again or contact us." }, { status: 503 });
  }
}
