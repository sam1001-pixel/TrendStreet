import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCatalog } from "@/lib/catalog";
import { writeAudit } from "@/lib/audit";
import { ProductInputError, saveProduct, validateProduct } from "@/lib/admin-products";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const before = (await getCatalog()).products.find((p) => p.id === id);
    if (!before) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const clean = validateProduct(await req.json());
    await prisma.$transaction((tx) => saveProduct(tx, id, clean, false));

    // Record only what changed, so the audit trail stays readable.
    const changed: Record<string, { from: unknown; to: unknown }> = {};
    for (const key of ["name", "price", "originalPrice", "stockCount", "inStock", "featured", "sizes", "images"] as const) {
      const from = before[key];
      const to = clean[key];
      if (JSON.stringify(from) !== JSON.stringify(to)) changed[key] = { from, to };
    }
    await writeAudit(req, { action: "PRODUCT_EDIT", entityType: "Product", entityId: id, metadata: { name: clean.name, changed } });

    const { products } = await getCatalog();
    return NextResponse.json({ product: products.find((p) => p.id === id) });
  } catch (err) {
    if (err instanceof ProductInputError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[Admin product update]:", err);
    return NextResponse.json({ error: "Could not save the product." }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const product = await prisma.product.findUnique({ where: { id: id }, select: { name: true } });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const sold = await prisma.orderItem.count({ where: { variant: { productId: id } } });
    if (sold > 0) {
      return NextResponse.json(
        { error: "This product has been ordered before, so it can't be deleted. Mark it Out of Stock instead." },
        { status: 409 }
      );
    }

    await prisma.product.delete({ where: { id: id } });
    await writeAudit(req, { action: "PRODUCT_DELETE", entityType: "Product", entityId: id, metadata: { name: product.name } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin product delete]:", err);
    return NextResponse.json({ error: "Could not delete the product." }, { status: 503 });
  }
}
