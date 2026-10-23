import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { adminOrderInclude, toAdminOrder } from "@/lib/admin-orders";

export const dynamic = "force-dynamic";

const NOT_FOUND = "We couldn't find an order with that number and email.";

/**
 * Customer order lookup without an account: the order number AND the checkout email must both match.
 * The same message is returned for "no such order" and "wrong email" so order numbers can't be probed.
 */
export async function POST(req: NextRequest) {
  const limit = checkRateLimit(`order-lookup:${getClientIp(req.headers)}`, { windowMs: 15 * 60 * 1000, maxRequests: 10 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const orderNumber = String(body?.orderNumber ?? "").trim().toUpperCase().slice(0, 40);
    const email = String(body?.email ?? "").trim().toLowerCase().slice(0, 200);
    if (!orderNumber || !email) {
      return NextResponse.json({ error: "Enter your order number and the email you used at checkout." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { orderNumber }, include: adminOrderInclude });
    if (!order || order.user?.email.toLowerCase() !== email) {
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    }

    const o = toAdminOrder(order);
    // Return only what the customer needs — not internal ids or payment gateway details.
    return NextResponse.json({
      order: {
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        status: o.status,
        items: o.items,
        subtotal: o.subtotal,
        discount: o.discount,
        shipping: o.shipping,
        tax: o.tax,
        total: o.total,
        trackingNumber: o.trackingNumber,
        courier: order.deliveryCourier,
        paymentMethod: o.paymentMethod,
        city: o.customer.city,
        postalCode: o.customer.postalCode,
      },
    });
  } catch (err) {
    console.error("[Order lookup]:", err);
    return NextResponse.json({ error: "Order lookup is unavailable right now. Please try again." }, { status: 503 });
  }
}
