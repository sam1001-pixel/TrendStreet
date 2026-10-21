import { NextRequest, NextResponse } from "next/server";
import { formatMinorUnits } from "@/lib/pricing";
import { OrderInputError, priceOrder, DeliveryMethod } from "@/lib/orders";

export const dynamic = "force-dynamic";

const DELIVERY_METHODS: DeliveryMethod[] = ["standard", "express", "vip_courier"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deliveryMethod: DeliveryMethod = DELIVERY_METHODS.includes(body?.deliveryMethod) ? body.deliveryMethod : "standard";

    // Prices come from the database catalog — never from the client.
    const { lines, pricing: summary } = await priceOrder(body?.items, body?.promoCode, deliveryMethod);

    return NextResponse.json({
      success: true,
      summary: {
        ...summary,
        formattedSubtotal: formatMinorUnits(summary.subtotalMinor, summary.currency),
        formattedDiscount: formatMinorUnits(summary.discountMinor, summary.currency),
        formattedShipping: formatMinorUnits(summary.shippingMinor, summary.currency),
        formattedTax: formatMinorUnits(summary.taxMinor, summary.currency),
        formattedTotal: formatMinorUnits(summary.totalMinor, summary.currency),
      },
      verifiedItems: lines.map((item) => ({
        id: item.id,
        name: item.name,
        unitPriceMinor: item.unitPriceMinor,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        itemTotalMinor: item.unitPriceMinor * item.quantity,
      })),
      unavailableItems: [],
    });
  } catch (err) {
    if (err instanceof OrderInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Checkout validation error:", err);
    return NextResponse.json({ error: "Unable to calculate checkout summary." }, { status: 503 });
  }
}
