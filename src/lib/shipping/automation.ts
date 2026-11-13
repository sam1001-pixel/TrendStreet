/**
 * OFFVYBE — SHIPROCKET AUTOMATION ENGINE
 *
 * Coordinates automated forward logistics, AWB generation, label fetching,
 * and order updates across the checkout and administrative dispatch flows.
 */

import { prisma } from "@/lib/prisma";
import { getShippingProvider } from "./index";
import { CreateShipmentParams, ShipmentResult } from "./types";
import { writeAudit } from "@/lib/audit";

export interface SyncOrderOptions {
  advanceStatus?: boolean; // Set true to mark order as SHIPPED/IN_TRANSIT
  req?: Request;          // Optional request for audit logging
}

/**
 * Automates booking an order in Shiprocket, obtaining the real AWB,
 * retrieving the printable label URL, and updating the database.
 */
export async function syncOrderToShiprocket(
  orderId: string,
  options: SyncOrderOptions = {}
): Promise<ShipmentResult | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shippingAddress: true,
        user: { select: { email: true, name: true } },
        items: {
          include: {
            variant: {
              include: {
                product: { select: { name: true } },
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!order || !order.shippingAddress) {
      console.warn(`[Shiprocket Sync] Order ${orderId} not found or missing address.`);
      return null;
    }

    // Determine payment type
    const isCod = order.payments.some((p) => p.provider === "CASH_ON_DELIVERY");
    const paymentMethod: "COD" | "PREPAID" = isCod ? "COD" : "PREPAID";

    // Calculate approximate package weight & volume based on garment categories
    const totalWeightKg = Math.max(
      0.5,
      Number(
        order.items
          .reduce((acc, it) => {
            const isHeavy = /jacket|coat|hoodie|bomber/i.test(it.variant?.product?.name || "");
            const pieceWeight = isHeavy ? 0.75 : 0.35;
            return acc + pieceWeight * it.quantity;
          }, 0)
          .toFixed(2)
      )
    );

    const totalUnits = order.items.reduce((acc, it) => acc + it.quantity, 0);
    const boxHeightCm = Math.min(25, Math.max(5, totalUnits * 4));

    const params: CreateShipmentParams = {
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      customerName: order.shippingAddress.fullName || order.user?.name || "Customer",
      customerEmail: order.user?.email || "care@offvybe.com",
      customerPhone: (order.shippingAddress.phone || "9079199951").replace(/\D/g, "").slice(-10),
      deliveryAddress: {
        street: order.shippingAddress.street,
        apartment: order.shippingAddress.apartment || undefined,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state || "Rajasthan",
        postalCode: order.shippingAddress.postalCode,
        country: "India",
      },
      pickupLocationId: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
      items: order.items.map((it) => ({
        name: it.variant?.product?.name || "OFFVYBE Luxury Garment",
        sku: it.variant?.sku || `OV-${it.variantId.slice(-6)}`,
        units: it.quantity,
        sellingPricePaise: it.unitPrice,
      })),
      dimensions: {
        lengthCm: 30,
        breadthCm: 25,
        heightCm: boxHeightCm,
        weightKg: totalWeightKg,
      },
      paymentMethod,
      totalAmountPaise: order.totalAmount,
    };

    const provider = getShippingProvider();
    const result = await provider.createShipment(params);

    if (result && result.success && result.awbCode) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          trackingNumber: result.awbCode,
          deliveryCourier: result.courierName,
          ...(options.advanceStatus && order.status !== "DELIVERED"
            ? { status: "SHIPPED" }
            : {}),
        },
      });

      if (options.req) {
        await writeAudit(options.req as any, {
          action: "ORDER_TRACKING_UPDATE",
          entityType: "Order",
          entityId: order.id,
          metadata: {
            orderNumber: order.orderNumber,
            awbCode: result.awbCode,
            courier: result.courierName,
            isMock: result.isMock,
            labelUrl: result.labelUrl,
          },
        });
      }
    }

    return result;
  } catch (err) {
    console.error(`[Shiprocket Sync Error for ${orderId}]:`, err);
    return null;
  }
}

/**
 * Cancels shipment in Shiprocket when an order is cancelled.
 */
export async function cancelOrderShipment(orderId: string): Promise<boolean> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, trackingNumber: true },
    });

    if (!order || !order.trackingNumber) return false;

    const provider = getShippingProvider();
    await provider.cancelShipment(order.orderNumber, order.trackingNumber);
    return true;
  } catch (err) {
    console.warn(`[Shiprocket Cancel Error for order ${orderId}]:`, err);
    return false;
  }
}
