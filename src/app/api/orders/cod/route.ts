import { getCustomerSession } from "@/lib/order-actions";
import { NextRequest, NextResponse, after } from "next/server";
import { checkDistributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { getStoreConfig } from "@/lib/store-config-server";
import { checkPincodeServiceability } from "@/lib/pincode";
import { OrderInputError, placeOrder, sendOrderEmailFromDb, DeliveryMethod } from "@/lib/orders";

export const dynamic = "force-dynamic";

const DELIVERY_METHODS: DeliveryMethod[] = ["standard", "express", "vip_courier"];

/**
 * Cash-on-delivery orders hold stock without any payment, so fake orders could empty the shop.
 * Limits (set in Admin → Settings → Delivery & COD): unconfirmed COD orders per customer
 * (email or phone) in 24 h, and pieces per COD order. COD can also be switched off entirely.
 */

/** Places a Cash-on-Delivery order in the database. */
export async function POST(req: NextRequest) {
  const limit = await checkDistributedRateLimit(`cod:${getClientIp(req.headers)}`, { windowMs: 10 * 60 * 1000, maxRequests: 5 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many orders from this connection. Please try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } }
    );
  }

  try {
    const session = await getCustomerSession(req);
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Please sign in to your OFFVYBE account to place an order.", requiresLogin: true },
        { status: 401 }
      );
    }

    const body = await req.json();
    const deliveryMethod: DeliveryMethod = DELIVERY_METHODS.includes(body?.deliveryMethod) ? body.deliveryMethod : "standard";

    const pin = checkPincodeServiceability(String(body?.customer?.postalCode ?? ""));
    if (!pin.codAvailable) {
      return NextResponse.json({ error: "Cash on delivery isn't available for this PIN code. Please pay online." }, { status: 400 });
    }

    const { cod } = await getStoreConfig();
    if (!cod.enabled) {
      return NextResponse.json({ error: "Cash on delivery is paused right now. Please pay online with UPI, card or net banking." }, { status: 400 });
    }
    const MAX_COD_PIECES = cod.maxPieces;
    const MAX_OPEN_COD_PER_CUSTOMER = cod.maxOpenPerCustomer;

    const pieces = (Array.isArray(body?.items) ? body.items : []).reduce((n: number, it: { quantity?: unknown }) => n + Math.max(0, Math.floor(Number(it?.quantity) || 0)), 0);
    if (pieces > MAX_COD_PIECES) {
      return NextResponse.json({ error: `Cash on delivery is available for up to ${MAX_COD_PIECES} pieces per order. Please pay online for bigger orders.` }, { status: 400 });
    }

    const email = String(body?.customer?.email ?? "").trim().toLowerCase();
    const phoneDigits = String(body?.customer?.phone ?? "").replace(/\D/g, "").slice(-10);
    if (email || phoneDigits.length === 10) {
      const open = await prisma.order.count({
        where: {
          status: "PENDING",
          createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
          payments: { some: { provider: "CASH_ON_DELIVERY" } },
          OR: [
            ...(email ? [{ user: { email } }] : []),
            ...(phoneDigits.length === 10 ? [{ shippingAddress: { phone: { contains: phoneDigits } } }] : []),
          ],
        },
      });
      if (open >= MAX_OPEN_COD_PER_CUSTOMER) {
        return NextResponse.json(
          { error: "You already have cash-on-delivery orders waiting for confirmation. Please pay online, or contact us to confirm them first." },
          { status: 429 }
        );
      }
    }

    const order = await placeOrder({
      items: body?.items,
      customer: body?.customer,
      promoCode: body?.promoCode,
      deliveryMethod,
      accountUserId: session.userId,
      payment: { provider: "CASH_ON_DELIVERY" },
    });

    const placedId = order.id;
    after(() => sendOrderEmailFromDb(placedId, "Cash on Delivery").then(() => undefined));

    return NextResponse.json({ success: true, orderNumber: order.orderNumber, pricing: order.pricing });
  } catch (err) {
    if (err instanceof OrderInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[COD order error]:", err);
    return NextResponse.json(
      { error: "We couldn't place your order right now. Nothing has been charged — please try again." },
      { status: 503 }
    );
  }
}
