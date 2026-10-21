import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { adminOrderInclude, STATUS_TO_DB, STATUS_TO_UI, toAdminOrder } from "@/lib/admin-orders";
import type { OrderStatus } from "@/types/store";

export const dynamic = "force-dynamic";

/** Update an order's status and/or courier tracking number. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const nextStatus = body?.status as OrderStatus | undefined;
    const tracking = typeof body?.trackingNumber === "string" ? body.trackingNumber.trim().slice(0, 80) : undefined;

    if (nextStatus !== undefined && !(nextStatus in STATUS_TO_DB)) {
      return NextResponse.json({ error: "Unknown order status." }, { status: 400 });
    }

    const before = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
    if (!before) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const dbStatus = nextStatus ? STATUS_TO_DB[nextStatus] : undefined;
    const cancelling = dbStatus === "CANCELLED" && before.status !== "CANCELLED";
    const reopening = before.status === "CANCELLED" && dbStatus !== undefined && dbStatus !== "CANCELLED";

    const updated = await prisma.$transaction(async (tx) => {
      // Cancelling returns units to stock; re-opening a cancelled order takes them again.
      if (cancelling || reopening) {
        for (const item of before.items) {
          await tx.inventory.update({
            where: { variantId: item.variantId },
            data: { quantity: cancelling ? { increment: item.quantity } : { decrement: item.quantity } },
          });
        }
      }
      return tx.order.update({
        where: { id: params.id },
        data: { ...(dbStatus ? { status: dbStatus } : {}), ...(tracking !== undefined ? { trackingNumber: tracking || null } : {}) },
        include: adminOrderInclude,
      });
    });

    if (dbStatus && dbStatus !== before.status) {
      await writeAudit(req, {
        action: "ORDER_STATUS_UPDATE",
        entityType: "Order",
        entityId: before.id,
        metadata: { orderNumber: before.orderNumber, from: STATUS_TO_UI[before.status], to: nextStatus },
      });
    }
    if (tracking !== undefined && tracking !== (before.trackingNumber ?? "")) {
      await writeAudit(req, {
        action: "ORDER_TRACKING_UPDATE",
        entityType: "Order",
        entityId: before.id,
        metadata: { orderNumber: before.orderNumber, from: before.trackingNumber, to: tracking },
      });
    }

    return NextResponse.json({ order: toAdminOrder(updated) });
  } catch (err) {
    console.error("[Admin order update]:", err);
    return NextResponse.json({ error: "Could not update the order." }, { status: 503 });
  }
}
