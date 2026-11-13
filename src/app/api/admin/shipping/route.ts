import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { getShippingProvider, syncOrderToShiprocket } from "@/lib/shipping";
import { checkPincodeServiceability } from "@/lib/pincode";

export const dynamic = "force-dynamic";

/**
 * Admin Shipping & Logistics API
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const provider = getShippingProvider();

    // Fetch dispatched orders with tracking numbers or in-transit status
    const shippedOrders = await prisma.order.findMany({
      where: {
        OR: [
          { status: "IN_TRANSIT" },
          { status: "SHIPPED" },
          { status: "DELIVERED" },
          { trackingNumber: { not: null } },
        ],
      },
      include: {
        shippingAddress: true,
        user: { select: { email: true, name: true } },
        items: { include: { variant: { select: { size: true, product: { select: { name: true } } } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    // Fetch pending / unfulfilled orders waiting for AWB dispatch
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] },
        trackingNumber: null,
      },
      include: {
        shippingAddress: true,
        user: { select: { email: true, name: true } },
        items: { include: { variant: { select: { size: true, product: { select: { name: true } } } } } },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const isConfigured = provider.isConfigured;
    const isLive = isConfigured;

    return NextResponse.json({
      environment: {
        provider: provider.providerName,
        isConfigured,
        isLive,
        mode: isLive ? "Production (Live Shiprocket API)" : "Sandbox / Resilient Mock",
        defaultCouriers: ["Delhivery Air", "Blue Dart Apex", "DTDC Express"],
        pickupOrigin: {
          city: "Jodhpur",
          state: "Rajasthan",
          pincode: process.env.SHIPROCKET_PICKUP_PINCODE || "342008",
          location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
        },
      },
      shipments: shippedOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.shippingAddress?.fullName || o.user?.name || "Customer",
        destinationCity: o.shippingAddress?.city || "—",
        destinationState: o.shippingAddress?.state || "—",
        postalCode: o.shippingAddress?.postalCode || "—",
        trackingNumber: o.trackingNumber || "Pending Booking",
        courier: o.deliveryCourier || (o.trackingNumber?.startsWith("TS-BLU") ? "Blue Dart Apex" : "Delhivery Air"),
        status: o.status,
        itemCount: o.items.reduce((acc, it) => acc + it.quantity, 0),
        dispatchedAt: o.updatedAt.toISOString(),
      })),
      pendingDispatch: pendingOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.shippingAddress?.fullName || o.user?.name || "Customer",
        destinationCity: o.shippingAddress?.city || "—",
        destinationState: o.shippingAddress?.state || "—",
        postalCode: o.shippingAddress?.postalCode || "—",
        paymentMethod: o.payments.some((p) => p.provider === "CASH_ON_DELIVERY") ? "COD" : "Prepaid",
        itemCount: o.items.reduce((acc, it) => acc + it.quantity, 0),
        totalAmount: o.totalAmount / 100,
        createdAt: o.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[Admin Shipping GET]:", err);
    return NextResponse.json({ error: "Could not load logistics data." }, { status: 503 });
  }
}

/**
 * Logistics Actions: PIN Serviceability, Tracking, Shiprocket Connection Test, and 1-Click Shipment Booking
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const action = body?.action; // "serviceability" | "track" | "test_connection" | "create_shipment" | "generate_label"

    if (action === "test_connection") {
      const provider = getShippingProvider();
      if (provider.checkConnectionAndPickups) {
        const result = await provider.checkConnectionAndPickups();
        return NextResponse.json(result);
      }
      return NextResponse.json({
        success: true,
        isLive: false,
        locations: [],
        message: "Active provider does not expose pickup endpoint.",
      });
    }

    if (action === "create_shipment") {
      const orderId = String(body?.orderId || "").trim();
      const orderNumber = String(body?.orderNumber || "").trim();

      let target = null;
      if (orderId) {
        target = await prisma.order.findUnique({ where: { id: orderId } });
      } else if (orderNumber) {
        target = await prisma.order.findUnique({ where: { orderNumber } });
      }

      if (!target) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }

      const result = await syncOrderToShiprocket(target.id, { advanceStatus: true, req });
      if (!result || !result.success) {
        return NextResponse.json(
          { error: result?.message || "Failed to create shipment in Shiprocket." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        orderId: target.id,
        orderNumber: target.orderNumber,
        awbCode: result.awbCode,
        courierName: result.courierName,
        shipmentId: result.shipmentId,
        labelUrl: result.labelUrl,
        isMock: result.isMock,
      });
    }

    if (action === "generate_label") {
      const shipmentId = String(body?.shipmentId || "").trim();
      if (!shipmentId) return NextResponse.json({ error: "Missing shipmentId parameter." }, { status: 400 });

      const provider = getShippingProvider();
      const labelUrl = provider.generateLabel ? await provider.generateLabel(shipmentId) : null;
      return NextResponse.json({ success: Boolean(labelUrl), labelUrl });
    }

    if (action === "serviceability") {
      const pincode = String(body?.pincode || "").trim();
      const serviceability = checkPincodeServiceability(pincode);
      return NextResponse.json({ success: true, serviceability });
    }

    if (action === "track") {
      const trackingNumber = String(body?.trackingNumber || "").trim();
      const provider = getShippingProvider();
      const tracking = await provider.trackShipment(trackingNumber);
      return NextResponse.json({ success: true, tracking });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    console.error("[Admin Shipping POST]:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
