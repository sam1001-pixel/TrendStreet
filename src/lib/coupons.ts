/**
 * Server-side coupon lookup. The `coupons` table (managed in /admin/discounts) is the only
 * source of truth: a code that's inactive, expired or used up simply doesn't resolve.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ResolvedCoupon } from "@/lib/pricing";

/**
 * Extra rules that the coupons table has no column for.
 * BUNDLE* codes are advertised as "complete outfit" discounts, so they need 2+ different products.
 */
function extraRules(code: string): Pick<ResolvedCoupon, "minDistinctProducts"> {
  return code.startsWith("BUNDLE") ? { minDistinctProducts: 2 } : {};
}

export function normalizeCouponCode(code: unknown): string | null {
  if (typeof code !== "string") return null;
  const clean = code.trim().toUpperCase();
  return /^[A-Z0-9_-]{3,32}$/.test(clean) ? clean : null;
}

/** Returns the coupon if it can be used right now, else null. */
export async function resolveCoupon(
  code: unknown,
  db: Prisma.TransactionClient | typeof prisma = prisma
): Promise<ResolvedCoupon | null> {
  const clean = normalizeCouponCode(code);
  if (!clean) return null;

  const row = await db.coupon.findUnique({ where: { code: clean } });
  if (!row || !row.active) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;
  if (row.maxUses !== null && row.usedCount >= row.maxUses) return null;

  return {
    code: row.code,
    percent: row.discountPercent,
    minSpendMinor: row.minSpend,
    // A 0% coupon (e.g. FREESHIP) means free shipping.
    freeShipping: row.discountPercent === 0,
    description: row.description,
    ...extraRules(row.code),
  };
}

/**
 * Records one use of a coupon inside the order transaction.
 * Returns false if the coupon ran out between pricing and placing the order.
 */
export async function consumeCoupon(code: string, tx: Prisma.TransactionClient): Promise<boolean> {
  const row = await tx.coupon.findUnique({ where: { code }, select: { maxUses: true } });
  if (!row) return false;
  const res = await tx.coupon.updateMany({
    where: { code, active: true, ...(row.maxUses !== null ? { usedCount: { lt: row.maxUses } } : {}) },
    data: { usedCount: { increment: 1 } },
  });
  return res.count === 1;
}
