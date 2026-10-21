/**
 * Trend Street — server catalog.
 * The database is the source of truth for product copy, prices, images, variants and stock
 * (all editable in /admin). Ratings and reviews still come from the code catalog by id.
 * If the database is unreachable, the code catalog is served so the shop stays browsable.
 */
import { ProductCategory as DbCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { INITIAL_PRODUCTS } from "@/data/products";
import type { Product, ProductCategory } from "@/types/store";

export const DB_TO_CATEGORY: Record<DbCategory, ProductCategory> = {
  OVERSIZED: "Oversized",
  JEANS: "Jeans",
  BOXY_FIT: "Boxy Fit",
  JACKETS: "Jackets",
};

export const CATEGORY_TO_DB: Record<ProductCategory, DbCategory> = {
  Oversized: "OVERSIZED",
  Jeans: "JEANS",
  "Boxy Fit": "BOXY_FIT",
  Jackets: "JACKETS",
};

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const sizeRank = (s: string) => {
  const i = SIZE_ORDER.indexOf(s);
  return i >= 0 ? i : 100 + (parseInt(s, 10) || 0);
};

const productInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: { include: { inventory: true } },
};

type DbProduct = Awaited<ReturnType<typeof fetchDbProducts>>[number];

function fetchDbProducts() {
  return prisma.product.findMany({ include: productInclude, orderBy: { createdAt: "asc" } });
}

/** Converts a database product into the storefront `Product` shape. */
export function toStoreProduct(p: DbProduct): Product {
  const fallback = INITIAL_PRODUCTS.find((x) => x.id === p.id);
  const sizes = Array.from(new Set(p.variants.map((v) => v.size))).sort((a, b) => sizeRank(a) - sizeRank(b));
  const colors: Product["colors"] = [];
  for (const v of p.variants) {
    if (!colors.some((c) => c.name === v.colorName)) colors.push({ name: v.colorName, hex: v.colorHex });
  }
  const stockCount = p.variants.reduce((n, v) => n + Math.max(0, (v.inventory?.quantity ?? 0) - (v.inventory?.reservedQty ?? 0)), 0);

  return {
    id: p.id,
    name: p.name,
    subtitle: p.subtitle ?? "",
    price: p.basePrice / 100,
    originalPrice: p.originalPrice ? p.originalPrice / 100 : undefined,
    category: DB_TO_CATEGORY[p.category],
    description: p.description,
    details: p.details,
    fabric: p.fabric,
    careInstructions: p.careInstructions,
    images: p.images.length ? p.images.map((i) => i.url) : fallback?.images ?? [],
    sizes,
    colors,
    featured: p.featured,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    inStock: stockCount > 0,
    stockCount,
    rating: fallback?.rating ?? 5,
    reviewsCount: fallback?.reviewsCount ?? 0,
    reviews: fallback?.reviews ?? [],
    tags: fallback?.tags ?? [],
  };
}

/** All products for the storefront. Never throws. */
export async function getCatalog(): Promise<{ products: Product[]; source: "database" | "fallback" }> {
  try {
    const rows = await fetchDbProducts();
    if (rows.length === 0) return { products: INITIAL_PRODUCTS, source: "fallback" };
    return { products: rows.map(toStoreProduct), source: "database" };
  } catch (err) {
    console.error("[Catalog] Database unavailable, serving code catalog:", (err as Error).message);
    return { products: INITIAL_PRODUCTS, source: "fallback" };
  }
}

/** Products for pricing an order. Throws if the database is down — never price money off a stale copy. */
export async function getCatalogForPricing(ids: string[]): Promise<Product[]> {
  const rows = await prisma.product.findMany({ where: { id: { in: ids } }, include: productInclude });
  return rows.map(toStoreProduct);
}
