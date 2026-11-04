/** Reads the admin's store settings from the database (server only). Never throws. */
import { prisma } from "@/lib/prisma";
import { DEFAULT_STORE_CONFIG, sanitizeStoreConfig, type StoreConfig } from "@/lib/store-config";

export async function getStoreConfig(): Promise<StoreConfig> {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: "global" }, select: { config: true } });
    return sanitizeStoreConfig(row?.config ?? null);
  } catch {
    return DEFAULT_STORE_CONFIG;
  }
}

/** The coupon advertised on product pages, read from Admin → Discounts (null if off, expired or used up). */
export async function getOfferCoupon(config: StoreConfig) {
  if (!config.offer.enabled || !config.offer.code) return null;
  try {
    const { resolveCoupon } = await import("@/lib/coupons");
    const c = await resolveCoupon(config.offer.code);
    return c ? { code: c.code, percent: c.percent, minSpend: c.minSpendMinor / 100, freeShipping: c.freeShipping } : null;
  } catch {
    return null;
  }
}
