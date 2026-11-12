import { getCustomerSession } from "@/lib/order-actions";
import { NextRequest, NextResponse, after } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import {
  OrderInputError,
  priceOrder,
  placeOrder,
  validateCustomer,
  generateOrderNumber,
  releaseStaleRazorpayOrders,
  DeliveryMethod,
} from "@/lib/orders";
import { checkDistributedRateLimit, getClientIp, RATE_LIMIT_CONFIG } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const DELIVERY_METHODS: DeliveryMethod[] = ["standard", "express", "vip_courier"];

/**
 * Starts an online payment:
 * 1. prices the bag on the server,
 * 2. creates the Razorpay order for exactly that amount,
 * 3. saves our order as PENDING (stock reserved) linked to the Razorpay order id.
 * After payment, /verify and the webhook only confirm this saved order.
 */
export async function POST(req: NextRequest) {
  const limit = await checkDistributedRateLimit(`pay-create:${getClientIp(req.headers)}`, RATE_LIMIT_CONFIG.PAYMENT_CREATE);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many payment attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const deliveryMethod: DeliveryMethod = DELIVERY_METHODS.includes(body?.deliveryMethod) ? body.deliveryMethod : "standard";
    const items = (Array.isArray(body?.items) ? body.items : []).map((it: Record<string, unknown>) => ({
      productId: String(it.productId ?? it.id ?? ""),
      size: String(it.selectedSize ?? it.size ?? ""),
      color: String(it.selectedColor ?? it.color ?? ""),
      quantity: Number(it.quantity),
    }));

    // Fail fast on bad input before talking to Razorpay.
    validateCustomer(body?.customer);
    const { pricing } = await priceOrder(items, body?.promoCode, deliveryMethod);
    if (pricing.totalMinor <= 0) {
      return NextResponse.json({ error: "Calculated order total must be greater than zero." }, { status: 400 });
    }

    // Opportunistically free stock held by abandoned payments (also runs from the daily cron).
    try {
      after(() => releaseStaleRazorpayOrders(10).then(() => undefined).catch((e) => console.warn("[Release stale orders]:", e?.message || e)));
    } catch {
      void releaseStaleRazorpayOrders(10).catch(() => undefined);
    }

    const orderNumber = generateOrderNumber();
    const { order: rzpOrder, keyId, isTestMode } = await createRazorpayOrder({
      amountMinor: pricing.totalMinor,
      currency: "INR",
      receipt: orderNumber,
      notes: { orderNumber, promoCode: pricing.promoCodeApplied || "none" },
    });

    const placed = await placeOrder({
      items,
      customer: body?.customer,
      promoCode: body?.promoCode,
      deliveryMethod,
      orderNumber,
      accountUserId: (await getCustomerSession(req))?.userId ?? null,
      payment: { provider: "RAZORPAY", gatewayOrderId: rzpOrder.id },
    });

    // Prices can't realistically change between the two calls above, but never open checkout for an
    // amount different from the order we saved. The unpaid order is released automatically later.
    if (placed.pricing.totalMinor !== Number(rzpOrder.amount)) {
      console.error(`[Create order] Price changed during checkout for ${orderNumber}`);
      return NextResponse.json({ error: "Prices were just updated. Please review your bag and try again." }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      orderId: rzpOrder.id,
      orderNumber: placed.orderNumber,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId,
      isTestMode,
      pricing: {
        subtotalMinor: placed.pricing.subtotalMinor,
        discountMinor: placed.pricing.discountMinor,
        shippingMinor: placed.pricing.shippingMinor,
        taxMinor: placed.pricing.taxMinor,
        totalMinor: placed.pricing.totalMinor,
        isFreeShipping: placed.pricing.isFreeShipping,
      },
    });
  } catch (error: unknown) {
    if (error instanceof OrderInputError || (error as any)?.name === "OrderInputError") {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
    console.error("[Razorpay Order Creation Error]:", error);
    const rawMessage =
      (error as any)?.error?.description ||
      (error as any)?.message ||
      (error instanceof Error ? error.message : "") ||
      (typeof error === "string" ? error : "");

    const isInternalError =
      rawMessage.includes("prisma") ||
      rawMessage.includes("resolv.conf") ||
      rawMessage.includes("connector") ||
      rawMessage.includes("database");
    const clientMessage = isInternalError || !rawMessage
      ? "Unable to initialize payment at this moment. Please try again in a few moments."
      : rawMessage;
    const statusCode = (error as any)?.statusCode === 401 ? 401 : 500;
    return NextResponse.json({ error: clientMessage }, { status: statusCode });
  }
}
