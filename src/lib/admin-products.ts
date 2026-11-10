/** Writes an admin-edited storefront `Product` into the database (product, images, variants, stock). */
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/types/store";
import { CATEGORY_TO_DB } from "@/lib/catalog";

export class ProductInputError extends Error {}

const clean = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v: unknown, max = 30) =>
  Array.isArray(v) ? v.map((x) => clean(x, 300)).filter(Boolean).slice(0, max) : [];

export function slugify(s: string) {
  return s.toLowerCase().replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Validates admin input; throws ProductInputError with a readable message. */
export function validateProduct(p: Partial<Product>) {
  const name = clean(p.name, 200);
  if (name.length < 3) throw new ProductInputError("Product name is required.");
  if (!p.category || !(p.category in CATEGORY_TO_DB)) throw new ProductInputError("Choose one of the four silhouettes.");
  const price = Number(p.price);
  if (!(price > 0 && price < 1_000_000)) throw new ProductInputError("Enter a price in rupees.");
  const originalPrice = p.originalPrice ? Number(p.originalPrice) : undefined;
  if (originalPrice !== undefined && !(originalPrice >= price)) throw new ProductInputError("Original price must be at least the selling price.");
  const rawImages = Array.isArray(p.images) ? p.images.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean) : [];
  const images = rawImages.filter((u) => /^(https:\/\/|\/(?![\/\\])|data:image\/)/.test(u)).slice(0, 12);
  if (!images.length) throw new ProductInputError("Add at least one photo.");
  const videos = (Array.isArray(p.videos) ? p.videos : [])
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((u) => /^(https:\/\/|\/(?![\/\\]))/.test(u))
    .slice(0, 6);
  const sizes = Array.from(new Set(list(p.sizes, 12)));
  if (!sizes.length) throw new ProductInputError("Add at least one size.");
  const colors = (Array.isArray(p.colors) ? p.colors : [])
    .map((c) => ({ name: clean(c?.name, 60), hex: /^#[0-9a-f]{6}$/i.test(c?.hex ?? "") ? c!.hex : "#1A1A1A" }))
    .filter((c) => c.name);
  if (!colors.length) throw new ProductInputError("Add at least one colour.");
  const stockCount = Math.max(0, Math.min(100_000, Math.floor(Number(p.stockCount) || 0)));

  return {
    name,
    subtitle: clean(p.subtitle, 300),
    category: p.category,
    description: clean(p.description, 5000),
    details: list(p.details),
    fabric: clean(p.fabric, 300),
    careInstructions: list(p.careInstructions),
    price,
    originalPrice,
    images,
    videos,
    archived: !!p.archived,
    sizes,
    colors,
    featured: !!p.featured,
    isNew: !!p.isNew,
    isBestSeller: !!p.isBestSeller,
    inStock: p.inStock !== false,
    stockCount,
  };
}

export type CleanProduct = ReturnType<typeof validateProduct>;

export async function saveProduct(
  tx: Prisma.TransactionClient | PrismaClient,
  id: string,
  p: CleanProduct,
  isNew: boolean
) {
  const data = {
    name: p.name,
    subtitle: p.subtitle || null,
    category: CATEGORY_TO_DB[p.category],
    description: p.description,
    details: p.details,
    fabric: p.fabric,
    careInstructions: p.careInstructions,
    basePrice: Math.round(p.price * 100),
    originalPrice: p.originalPrice ? Math.round(p.originalPrice * 100) : null,
    featured: p.featured,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    videos: p.videos,
    archived: p.archived,
  };

  if (isNew) {
    await tx.product.create({ data: { id, slug: `${slugify(p.name)}-${id.slice(-5)}`, ...data } });
  } else {
    await tx.product.update({ where: { id }, data });
  }

  await tx.productImage.deleteMany({ where: { productId: id } });
  if (p.images.length > 0) {
    await tx.productImage.createMany({
      data: p.images.map((url, i) => ({ productId: id, url, sortOrder: i, alt: `${p.name} - View ${i + 1}` })),
    });
  }

  // Pre-fetch all existing variants and their inventory in ONE single roundtrip
  const existingVariants = await tx.productVariant.findMany({
    where: { productId: id },
    include: { inventory: true },
  });
  const existingMap = new Map(existingVariants.map((v) => [`${v.size}::${v.colorName}`, v]));

  // Every offered size × colour gets a share of the stock; combos no longer offered drop to 0
  const combos = p.sizes.flatMap((size) => p.colors.map((color) => ({ size, color })));
  const total = p.inStock ? p.stockCount : 0;
  const offeredIds: string[] = [];

  for (let i = 0; i < combos.length; i++) {
    const { size, color } = combos[i];
    const qty = Math.floor(total / combos.length) + (i < total % combos.length ? 1 : 0);
    const existing = existingMap.get(`${size}::${color.name}`);

    if (existing) {
      offeredIds.push(existing.id);
      if (existing.colorHex !== color.hex) {
        await tx.productVariant.update({
          where: { id: existing.id },
          data: { colorHex: color.hex },
        });
      }
      if (!existing.inventory) {
        await tx.inventory.create({
          data: { variantId: existing.id, quantity: qty },
        });
      } else if (existing.inventory.quantity !== qty) {
        await tx.inventory.update({
          where: { id: existing.inventory.id },
          data: { quantity: qty },
        });
      }
    } else {
      const variant = await tx.productVariant.create({
        data: {
          productId: id,
          size,
          colorName: color.name,
          colorHex: color.hex,
          sku: `${id}-${size}-${color.name.toUpperCase().replace(/\s+/g, "_")}`,
          inventory: {
            create: { quantity: qty },
          },
        },
      });
      offeredIds.push(variant.id);
    }
  }

  // Combos no longer offered drop to 0 units
  await tx.inventory.updateMany({
    where: { variant: { productId: id }, variantId: { notIn: offeredIds } },
    data: { quantity: 0 },
  });
}

/**
 * Saves a product with automatic retry for write conflicts / transaction timeouts,
 * and a guaranteed fallback to direct atomic client operations if an interactive transaction fails.
 */
export async function saveProductWithResilience(
  id: string,
  p: CleanProduct,
  isNew: boolean
): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await prisma.$transaction(
        (tx) => saveProduct(tx, id, p, isNew),
        { maxWait: 15000, timeout: 30000 }
      );
      return;
    } catch (err: unknown) {
      lastErr = err;
      const prismaErr = err as { code?: string; message?: string };
      const code = prismaErr?.code;
      const isRetryable =
        code === "P2034" ||
        code === "P2028" ||
        prismaErr?.message?.includes("Transaction already closed") ||
        prismaErr?.message?.includes("Transaction failed due to a write conflict");

      if (isRetryable && attempt < 3) {
        console.warn(`[admin-products] Attempt ${attempt} failed (${code ?? prismaErr?.message}). Retrying in ${attempt * 250}ms...`);
        await new Promise((r) => setTimeout(r, attempt * 250));
        continue;
      }
      break;
    }
  }

  // Final fallback: execute sequentially on prisma client directly outside an interactive transaction
  console.warn("[admin-products] Interactive transaction could not complete; executing direct client save fallback.");
  try {
    await saveProduct(prisma, id, p, isNew);
  } catch (fallbackErr) {
    console.error("[admin-products] Fallback direct save also failed:", fallbackErr);
    throw lastErr ?? fallbackErr;
  }
}

