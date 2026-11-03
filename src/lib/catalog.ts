/**
 * OFFVYBE — server catalog.
 * The database is the source of truth for product copy, prices, photos, videos, variants, stock and reviews
 * (all editable in /admin). If the database is unreachable, the code catalog is served so the shop stays browsable.
 */
import { ProductCategory as DbCategory } from "@prisma/client";
import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { INITIAL_PRODUCTS } from "@/data/products";
import type { Product, ProductCategory, Review } from "@/types/store";

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
  reviews: { where: { published: true }, orderBy: [{ sortOrder: "asc" as const }, { createdAt: "desc" as const }] },
};

type DbProduct = Awaited<ReturnType<typeof fetchDbProducts>>[number];
type DbReview = DbProduct["reviews"][number];

function fetchDbProducts(includeArchived = false) {
  return prisma.product.findMany({
    where: includeArchived ? undefined : { archived: false },
    include: productInclude,
    orderBy: { createdAt: "asc" },
  });
}

const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function toStoreReview(r: DbReview & { product?: { name: string } | null }): Review {
  return {
    id: r.id,
    author: r.author,
    city: r.city ?? undefined,
    rating: Math.max(1, Math.min(5, r.rating)),
    date: DATE_FMT.format(r.createdAt),
    title: r.title ?? "",
    comment: r.comment,
    verified: r.verified,
    videoUrl: r.videoUrl ?? undefined,
    posterUrl: r.posterUrl ?? undefined,
    productId: r.productId ?? undefined,
    productName: r.product?.name,
  };
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
  const reviews = p.reviews.map((r) => toStoreReview({ ...r, product: { name: p.name } }));
  const rating = reviews.length ? Math.round((reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) * 10) / 10 : 0;

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
    images: p.images.map((i) => i.url),
    videos: p.videos,
    archived: p.archived,
    sizes,
    colors,
    featured: p.featured,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    inStock: stockCount > 0,
    stockCount,
    rating,
    reviewsCount: reviews.length,
    reviews,
    tags: fallback?.tags ?? [],
  };
}

/**
 * All products for the storefront (archived ones only when `includeArchived`, for the admin). Never throws.
 * An empty database means an empty shop — the sample catalog is only a stand-in while the database is down,
 * so products deleted in the admin never come back.
 */
export async function getCatalog(
  { includeArchived = false }: { includeArchived?: boolean } = {}
): Promise<{ products: Product[]; source: "database" | "fallback" }> {
  try {
    const rows = await fetchDbProducts(includeArchived);
    return { products: rows.map(toStoreProduct), source: "database" };
  } catch (err) {
    console.error("[Catalog] Database unavailable, serving code catalog:", (err as Error).message);
    return { products: INITIAL_PRODUCTS, source: "fallback" };
  }
}

/** Products for pricing an order. Throws if the database is down — never price money off a stale copy. */
export async function getCatalogForPricing(ids: string[]): Promise<Product[]> {
  const rows = await prisma.product.findMany({ where: { id: { in: ids }, archived: false }, include: productInclude });
  return rows.map(toStoreProduct);
}

/** Published reviews that have a video, for the homepage reel (featured first). Never throws. */
export async function getVideoReviews(limit = 12): Promise<Review[]> {
  try {
    const rows = await prisma.review.findMany({
      where: { published: true, videoUrl: { not: null }, OR: [{ productId: null }, { product: { archived: false } }] },
      include: { product: { select: { name: true } } },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
    });
    return rows.map(toStoreReview);
  } catch {
    return [];
  }
}

/** Catalog + video reviews for server rendering, cached for a minute and refreshed instantly when the admin saves. */
export const getCachedStorefront = unstable_cache(
  async () => {
    const [{ products, source }, videoReviews] = await Promise.all([getCatalog(), getVideoReviews()]);
    return { products, source, videoReviews };
  },
  ["storefront-catalog"],
  { revalidate: 60, tags: ["catalog"] }
);

/** Call after any admin change to products or reviews. */
export function refreshStorefront() {
  try {
    revalidateTag("catalog");
  } catch {
    // Outside a request (scripts/tests) there is nothing to revalidate.
  }
}
