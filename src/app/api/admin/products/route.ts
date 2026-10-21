import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCatalog } from "@/lib/catalog";
import { writeAudit } from "@/lib/audit";
import { ProductInputError, saveProduct, validateProduct } from "@/lib/admin-products";

export const dynamic = "force-dynamic";

export async function GET() {
  const { products, source } = await getCatalog();
  if (source !== "database") {
    return NextResponse.json({ error: "Database unavailable — catalog is read-only right now." }, { status: 503 });
  }
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  try {
    const clean = validateProduct(await req.json());
    const id = `ts-${Date.now().toString(36)}`;
    await prisma.$transaction((tx) => saveProduct(tx, id, clean, true));
    await writeAudit(req, { action: "PRODUCT_CREATE", entityType: "Product", entityId: id, metadata: { name: clean.name, price: clean.price } });
    const { products } = await getCatalog();
    return NextResponse.json({ product: products.find((p) => p.id === id) });
  } catch (err) {
    if (err instanceof ProductInputError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[Admin product create]:", err);
    return NextResponse.json({ error: "Could not create the product." }, { status: 503 });
  }
}
