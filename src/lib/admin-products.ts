/** Writes an admin-edited storefront `Product` into the database (product, images, variants, stock). */
import { Prisma } from "@prisma/client";
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
  const images = list(p.images, 12).filter((u) => /^(https:\/\/|\/)/.test(u));
  if (!images.length) throw new ProductInputError("Add at least one image URL (https://…).");
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
    sizes,
    colors,
    featured: !!p.featured,
    isNew: !!p.isNew,
    isBestSeller: !!p.isBestSeller,
    inStock: p.inStock !== false,
    stockCount,
  };
}

type Clean = ReturnType<typeof validateProduct>;

export async function saveProduct(tx: Prisma.TransactionClient, id: string, p: Clean, isNew: boolean) {
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
  };

  if (isNew) {
    await tx.product.create({ data: { id, slug: `${slugify(p.name)}-${id.slice(-5)}`, ...data } });
  } else {
    await tx.product.update({ where: { id }, data });
  }

  await tx.productImage.deleteMany({ where: { productId: id } });
  await tx.productImage.createMany({
    data: p.images.map((url, i) => ({ productId: id, url, sortOrder: i, alt: `${p.name} - View ${i + 1}` })),
  });

  // Every offered size × colour gets a share of the stock; combos no longer offered drop to 0 (kept for order history).
  const combos = p.sizes.flatMap((size) => p.colors.map((color) => ({ size, color })));
  const total = p.inStock ? p.stockCount : 0;
  const offeredIds: string[] = [];
  for (let i = 0; i < combos.length; i++) {
    const { size, color } = combos[i];
    const qty = Math.floor(total / combos.length) + (i < total % combos.length ? 1 : 0);
    const variant = await tx.productVariant.upsert({
      where: { productId_size_colorName: { productId: id, size, colorName: color.name } },
      update: { colorHex: color.hex },
      create: { productId: id, size, colorName: color.name, colorHex: color.hex, sku: `${id}-${size}-${color.name.toUpperCase().replace(/\s+/g, "_")}` },
    });
    offeredIds.push(variant.id);
    await tx.inventory.upsert({
      where: { variantId: variant.id },
      update: { quantity: qty },
      create: { variantId: variant.id, quantity: qty },
    });
  }
  await tx.inventory.updateMany({
    where: { variant: { productId: id }, variantId: { notIn: offeredIds } },
    data: { quantity: 0 },
  });
}
