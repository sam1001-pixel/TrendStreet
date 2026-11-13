import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { adminOrderInclude, checkOrderTransition, STATUS_TO_DB, STATUS_TO_UI, toAdminOrder } from "@/lib/admin-orders";
import { requireAdminSession } from "@/lib/admin-guard";
import { releaseOrderResources } from "@/lib/orders";
import { sendAdminOrderCancelledNotification, sendCustomerOrderCancelledEmail } from "@/lib/email";
import { cancelOrderShipment } from "@/lib/shipping";
import type { OrderStatus } from "@/types/store";

export const dynamic = "force-dynamic";

/** Update an order's status and/or courier tracking number. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;
  const params = await ctx.params;

  try {
    const body = await req.json();
    const nextStatus = body?.status as OrderStatus | undefined;
    const tracking = typeof body?.trackingNumber === "string" ? body.trackingNumber.trim().slice(0, 80) : undefined;

    if (nextStatus !== undefined && !(nextStatus in STATUS_TO_DB)) {
      return NextResponse.json({ error: "Unknown order status." }, { status: 400 });
    }

    const before = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true, payments: true } });
    if (!before) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const dbStatus = nextStatus ? STATUS_TO_DB[nextStatus] : undefined;
    const transitionError = dbStatus && dbStatus !== before.status ? checkOrderTransition(before, dbStatus) : null;
    if (transitionError) return NextResponse.json({ error: transitionError }, { status: 409 });
    const cancelling = dbStatus === "CANCELLED" && before.status !== "CANCELLED";
    const reopening = before.status === "CANCELLED" && dbStatus !== undefined && dbStatus !== "CANCELLED";

    const updated = await prisma.$transaction(
      async (tx) => {
        // Cancelling returns units to stock (and the coupon use); re-opening a cancelled order takes them again.
        if (cancelling) {
          await releaseOrderResources(tx, before);
        } else if (reopening) {
          for (const item of before.items) {
            const taken = await tx.inventory.updateMany({
              where: { variantId: item.variantId, quantity: { gte: item.quantity } },
              data: { quantity: { decrement: item.quantity } },
            });
            if (taken.count === 0) throw new Error("NOT_ENOUGH_STOCK");
          }
        }
        return tx.order.update({
          where: { id: params.id },
          data: {
            ...(dbStatus ? { status: dbStatus } : {}),
            ...(tracking !== undefined ? { trackingNumber: tracking || null } : {}),
            // Starts the 30-day exchange window; cleared if the status is moved back.
            ...(dbStatus && dbStatus !== before.status ? { deliveredAt: dbStatus === "DELIVERED" ? new Date() : null } : {}),
            ...(cancelling ? { cancelledAt: new Date(), cancelReason: "Cancelled by the store" } : reopening ? { cancelledAt: null, cancelReason: null } : {}),
          },
          include: adminOrderInclude,
        });
      },
      { maxWait: 10000, timeout: 20000 }
    );

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

    if (cancelling) {
      const cancelPayload = {
        orderNumber: updated.orderNumber,
        orderId: updated.id,
        customerName: updated.shippingAddress.fullName || updated.user?.name || "Customer",
        customerEmail: updated.user?.email || "",
        customerPhone: updated.shippingAddress.phone || undefined,
        reason: "Cancelled by store administrator",
        totalAmount: updated.totalAmount / 100,
        paymentMethod: updated.payments[0]?.provider === "CASH_ON_DELIVERY" ? "Cash on Delivery" : "Online / Razorpay",
        cancelledAt: updated.cancelledAt || new Date(),
        cancelledBy: "Admin / Store" as const,
        items: updated.items.map((it) => ({
          productName: it.variant.product.name,
          size: it.variant.size,
          color: it.variant.colorName,
          quantity: it.quantity,
          unitPrice: it.unitPrice / 100,
        })),
      };
      try {
        after(() =>
          Promise.allSettled([
            sendAdminOrderCancelledNotification(cancelPayload),
            sendCustomerOrderCancelledEmail(cancelPayload),
            cancelOrderShipment(updated.id),
          ]).then(() => undefined)
        );
      } catch {
        void Promise.allSettled([
          sendAdminOrderCancelledNotification(cancelPayload),
          sendCustomerOrderCancelledEmail(cancelPayload),
          cancelOrderShipment(updated.id),
        ]).catch((err) => console.warn("[Cancel side effects error]:", err?.message || err));
      }
    }

    return NextResponse.json({ order: toAdminOrder(updated) });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_ENOUGH_STOCK") {
      return NextResponse.json({ error: "Not enough stock left to re-open this order." }, { status: 409 });
    }
    console.error("[Admin order update]:", err);
    return NextResponse.json({ error: "Could not update the order." }, { status: 503 });
  }
}
