import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRecentAdminAuth } from "@/lib/admin-guard";
import { writeAudit } from "@/lib/audit";
import { refreshStorefront } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/**
 * Sets one price (and optional MRP) on every product — e.g. "everything ₹499".
 * Also clears per-size price add-ons so every variant costs exactly that price.
 * Body: { price: number (₹), mrp?: number (₹, 0 or below price = no MRP) }
 */
export async function POST(req: NextRequest) {
  // Re-prices every product: only within 30 minutes of signing in.
  const auth = await requireRecentAdminAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const price = Math.round(Number(body?.price));
    const mrpIn = Math.round(Number(body?.mrp) || 0);
    if (!Number.isFinite(price) || price < 1 || price > 100000) {
      return NextResponse.json({ error: "Enter a price between ₹1 and ₹1,00,000." }, { status: 400 });
    }
    if (!Number.isFinite(mrpIn) || mrpIn < 0 || mrpIn > 200000) {
      return NextResponse.json({ error: "MRP must be between ₹0 and ₹2,00,000." }, { status: 400 });
    }
    const mrp = mrpIn > price ? mrpIn : null;

    const [products] = await prisma.$transaction([
      prisma.product.updateMany({ data: { basePrice: price * 100, originalPrice: mrp ? mrp * 100 : null } }),
      prisma.productVariant.updateMany({ where: { priceDelta: { not: 0 } }, data: { priceDelta: 0 } }),
    ]);
    refreshStorefront();
    await writeAudit(req, { action: "PRODUCT_EDIT", entityType: "Product", entityId: "ALL", metadata: { bulkPrice: price, mrp, products: products.count } });
    return NextResponse.json({ success: true, updated: products.count, price, mrp });
  } catch (err) {
    console.error("[Admin bulk price]:", err);
    return NextResponse.json({ error: "Could not update prices. Please try again." }, { status: 503 });
  }
}
