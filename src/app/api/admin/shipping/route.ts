import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { getShippingProvider } from "@/lib/shipping";
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

    const isLive = Boolean(
      process.env.SHIPROCKET_EMAIL &&
      process.env.SHIPROCKET_PASSWORD &&
      process.env.NODE_ENV === "production"
    );

    return NextResponse.json({
      environment: {
        provider: provider.providerName,
        isLive,
        mode: isLive ? "Production (Live API)" : "Sandbox / Resilient Mock",
        defaultCouriers: ["Delhivery Air", "Blue Dart Apex", "DTDC Express"],
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
    });
  } catch (err) {
    console.error("[Admin Shipping GET]:", err);
    return NextResponse.json({ error: "Could not load logistics data." }, { status: 503 });
  }
}

/**
 * Check Indian PIN code serviceability or book test AWB
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const action = body?.action; // "serviceability" | "track"

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
