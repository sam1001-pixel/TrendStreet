/**
 * Puts every product in the live database on the store-wide flat price
 * (FLAT_PRICE / FLAT_MRP in src/data/products.ts — ₹499, MRP ₹999 by default).
 *
 * - Updates every product (archived ones too) and clears per-variant price add-ons,
 *   so every size and colour also costs exactly the flat price.
 * - Touches nothing else: stock, photos, copy and reviews stay as they are.
 *
 * Run once after changing the prices:  npm run prices:flat
 * (reads DATABASE_URL from .env.local / .env, the same way Next.js does)
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { FLAT_PRICE, FLAT_MRP } from "../src/data/products";

loadEnvConfig(process.cwd());

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to .env.local (the same value your site uses) and run again.");
    process.exit(1);
  }
  const prisma = new PrismaClient();
  const basePrice = Math.round(FLAT_PRICE * 100);
  const originalPrice = FLAT_MRP > FLAT_PRICE ? Math.round(FLAT_MRP * 100) : null;

  try {
    const [products, variants] = await prisma.$transaction([
      prisma.product.updateMany({ data: { basePrice, originalPrice } }),
      prisma.productVariant.updateMany({ where: { priceDelta: { not: 0 } }, data: { priceDelta: 0 } }),
    ]);
    console.log(
      `✓ ${products.count} products now ₹${FLAT_PRICE}` +
        (originalPrice ? ` (MRP ₹${FLAT_MRP})` : " (no MRP strike-through)") +
        `; ${variants.count} variant price add-ons cleared.`
    );
    console.log("  The storefront picks this up within a minute (or straight away after any save in /admin).");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Could not update prices:", e);
  process.exit(1);
});
