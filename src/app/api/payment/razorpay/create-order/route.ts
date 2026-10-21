import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { OrderInputError, priceOrder, DeliveryMethod } from "@/lib/orders";

export const dynamic = "force-dynamic";

const DELIVERY_METHODS: DeliveryMethod[] = ["standard", "express", "vip_courier"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deliveryMethod: DeliveryMethod = DELIVERY_METHODS.includes(body?.deliveryMethod) ? body.deliveryMethod : "standard";

    // The amount charged is computed from the database catalog. Client-sent prices are ignored.
    const { pricing } = await priceOrder(
      (body?.items || []).map((it: any) => ({
        productId: it.productId || it.id,
        size: it.selectedSize ?? it.size,
        color: it.selectedColor ?? it.color,
        quantity: it.quantity,
      })),
      body?.promoCode,
      deliveryMethod
    );

    if (pricing.totalMinor <= 0) {
      return NextResponse.json({ error: "Calculated order total must be greater than zero." }, { status: 400 });
    }

    const receipt = `TS-${Date.now()}`;
    const { order, keyId, isTestMode } = await createRazorpayOrder({
      amountMinor: pricing.totalMinor,
      currency: "INR",
      receipt,
      notes: {
        receiptNumber: receipt,
        subtotal: String(pricing.subtotalMinor),
        promoCode: pricing.promoCodeApplied || "none",
        discount: String(pricing.discountMinor),
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt,
      keyId,
      isTestMode,
      pricing: {
        subtotalMinor: pricing.subtotalMinor,
        discountMinor: pricing.discountMinor,
        shippingMinor: pricing.shippingMinor,
        taxMinor: pricing.taxMinor,
        totalMinor: pricing.totalMinor,
        isFreeShipping: pricing.isFreeShipping,
      },
    });
  } catch (error: any) {
    if (error instanceof OrderInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[Razorpay Order Creation Error]:", error);
    return NextResponse.json({ error: "Failed to initialize payment. Please try again." }, { status: 500 });
  }
}
