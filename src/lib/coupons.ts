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

// ---------------------------------------------------------------------------
// Per-customer coupon rules (first-order-only, uses per customer)
// ---------------------------------------------------------------------------

/**
 * One identity for "the same customer": the email with Gmail's dots and +tags removed (they all
 * reach the same inbox), and the last 10 digits of the mobile number.
 */
export function customerIdentity(email: string, phone: string): { email: string; phoneDigits: string } {
  let e = email.trim().toLowerCase();
  const [local, domain] = e.split("@");
  if (domain === "gmail.com" || domain === "googlemail.com") e = `${local.split("+")[0].replace(/\./g, "")}@gmail.com`;
  else if (local && domain) e = `${local.split("+")[0]}@${domain}`;
  return { email: e, phoneDigits: phone.replace(/\D/g, "").slice(-10) };
}

/** Thrown inside the order transaction when a per-customer coupon rule isn't met. */
export class CouponRuleError extends Error {}

/**
 * Enforces firstOrderOnly / perCustomerLimit for `code` inside the order transaction.
 * Takes per-customer advisory locks first, so two checkouts at the same moment can't both pass.
 * Orders that count: anything not cancelled/refunded and not a failed online payment
 * (unpaid online orders still count until they're released).
 */
export async function enforceCustomerCouponRules(
  tx: Prisma.TransactionClient,
  code: string,
  customer: { email: string; phone: string }
): Promise<void> {
  const rule = await tx.coupon.findUnique({ where: { code }, select: { firstOrderOnly: true, perCustomerLimit: true } });
  if (!rule || (!rule.firstOrderOnly && rule.perCustomerLimit === null)) return;

  const id = customerIdentity(customer.email, customer.phone);
  const lockKeys = [`coupon-cust:e:${id.email}`, ...(id.phoneDigits.length === 10 ? [`coupon-cust:p:${id.phoneDigits}`] : [])].sort();
  for (const k of lockKeys) await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${k}))`;

  // Match the raw email as typed and its canonical form, case-insensitively.
  const emails = Array.from(new Set([customer.email.trim().toLowerCase(), id.email]));
  const sameCustomer: Prisma.OrderWhereInput = {
    OR: [
      ...emails.map((e) => ({ user: { email: { equals: e, mode: "insensitive" as const } } })),
      ...(id.phoneDigits.length === 10 ? [{ shippingAddress: { phone: { contains: id.phoneDigits } } }] : []),
    ],
  };
  const counts: Prisma.OrderWhereInput = {
    status: { notIn: ["CANCELLED", "REFUNDED"] },
    NOT: { payments: { some: { status: "FAILED" } } },
  };

  if (rule.firstOrderOnly) {
    const prior = await tx.order.count({ where: { AND: [sameCustomer, counts] } });
    if (prior > 0) throw new CouponRuleError(`The code ${code} is only for your first order.`);
  }
  if (rule.perCustomerLimit !== null) {
    const used = await tx.order.count({ where: { AND: [sameCustomer, counts, { promoCode: code }] } });
    if (used >= rule.perCustomerLimit) {
      throw new CouponRuleError(
        rule.perCustomerLimit === 1 ? `You've already used the code ${code}.` : `You've already used the code ${code} ${rule.perCustomerLimit} times.`
      );
    }
  }
}
