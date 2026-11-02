import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkPincodeServiceability } from "@/lib/pincode";
import { OrderInputError, placeOrder, sendOrderEmailFromDb, DeliveryMethod } from "@/lib/orders";

export const dynamic = "force-dynamic";

const DELIVERY_METHODS: DeliveryMethod[] = ["standard", "express", "vip_courier"];

/** Places a Cash-on-Delivery order in the database. */
export async function POST(req: NextRequest) {
  const limit = checkRateLimit(`cod:${getClientIp(req.headers)}`, { windowMs: 10 * 60 * 1000, maxRequests: 5 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many orders from this connection. Please try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const deliveryMethod: DeliveryMethod = DELIVERY_METHODS.includes(body?.deliveryMethod) ? body.deliveryMethod : "standard";

    const pin = checkPincodeServiceability(String(body?.customer?.postalCode ?? ""));
    if (!pin.codAvailable) {
      return NextResponse.json({ error: "Cash on delivery isn't available for this PIN code. Please pay online." }, { status: 400 });
    }

    const order = await placeOrder({
      items: body?.items,
      customer: body?.customer,
      promoCode: body?.promoCode,
      deliveryMethod,
      payment: { provider: "CASH_ON_DELIVERY" },
    });

    void sendOrderEmailFromDb(order.id, "Cash on Delivery");

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
