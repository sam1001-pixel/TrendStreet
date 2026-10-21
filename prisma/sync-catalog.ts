/**
 * Upserts the storefront catalog (src/data/products.ts) into the database:
 * products, images, every size × colour variant, and inventory.
 *
 * Non-destructive: never deletes products or variants, and never overwrites
 * inventory that already exists (stock edited in /admin is preserved).
 * Product copy and prices ARE refreshed from code only when `refreshProducts` is true.
 *
 * One-time alignment: add --refresh --reset-stock (overwrites product copy and stock from code).
 * Run: node --env-file=.env.local node_modules/tsx/dist/cli.mjs prisma/sync-catalog.ts
 */
import { PrismaClient, ProductCategory } from "@prisma/client";
import { INITIAL_PRODUCTS } from "../src/data/products";

export const CATEGORY_TO_DB: Record<string, ProductCategory> = {
  Oversized: ProductCategory.OVERSIZED,
  Jeans: ProductCategory.JEANS,
  "Boxy Fit": ProductCategory.BOXY_FIT,
  Jackets: ProductCategory.JACKETS,
};

export const slugify = (s: string) =>
  s.toLowerCase().replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const variantSku = (productId: string, size: string, color: string) =>
  `${productId}-${size}-${color.toUpperCase().replace(/\s+/g, "_")}`;

export async function syncCatalog(prisma: PrismaClient, { refreshProducts = false, resetStock = false } = {}) {
  let createdVariants = 0;

  for (const p of INITIAL_PRODUCTS) {
    const data = {
      slug: slugify(p.name),
      name: p.name,
      subtitle: p.subtitle,
      category: CATEGORY_TO_DB[p.category],
      description: p.description,
      fabric: p.fabric,
      careInstructions: p.careInstructions,
      details: p.details,
      basePrice: Math.round(p.price * 100),
      originalPrice: p.originalPrice ? Math.round(p.originalPrice * 100) : null,
      featured: !!p.featured,
      isNew: !!p.isNew,
      isBestSeller: !!p.isBestSeller,
    };

    const existing = await prisma.product.findUnique({ where: { id: p.id } });
    if (!existing) {
      await prisma.product.create({ data: { id: p.id, ...data } });
    } else if (refreshProducts) {
      await prisma.product.update({ where: { id: p.id }, data });
    }

    if (!existing || refreshProducts) {
      await prisma.productImage.deleteMany({ where: { productId: p.id } });
      await prisma.productImage.createMany({
        data: p.images.map((url, i) => ({ productId: p.id, url, sortOrder: i, alt: `${p.name} - View ${i + 1}` })),
      });
    }

    // Spread the catalog's product-level stock across its variants (only for new inventory rows).
    const combos = p.sizes.flatMap((size) => p.colors.map((color) => ({ size, color })));
    const total = p.inStock ? p.stockCount : 0;
    for (let i = 0; i < combos.length; i++) {
      const { size, color } = combos[i];
      const variant = await prisma.productVariant.upsert({
        where: { productId_size_colorName: { productId: p.id, size, colorName: color.name } },
        update: { colorHex: color.hex },
        create: { productId: p.id, size, colorName: color.name, colorHex: color.hex, sku: variantSku(p.id, size, color.name) },
      });
      const inv = await prisma.inventory.findUnique({ where: { variantId: variant.id } });
      const qty = Math.floor(total / combos.length) + (i < total % combos.length ? 1 : 0);
      if (!inv) {
        await prisma.inventory.create({ data: { variantId: variant.id, quantity: qty, reservedQty: 0 } });
        createdVariants++;
      } else if (resetStock) {
        await prisma.inventory.update({ where: { variantId: variant.id }, data: { quantity: qty, reservedQty: 0 } });
      }
    }
  }

  return { products: INITIAL_PRODUCTS.length, newInventoryRows: createdVariants };
}

if (require.main === module) {
  const prisma = new PrismaClient();
  const refreshProducts = process.argv.includes("--refresh");
  const resetStock = process.argv.includes("--reset-stock");
  syncCatalog(prisma, { refreshProducts, resetStock })
    .then((r) => console.log("✓ Catalog synced:", r))
    .catch((e) => {
      console.error("Catalog sync failed:", e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
