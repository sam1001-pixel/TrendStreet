/**
 * OFFVYBE — Server-Authoritative Pricing & Checkout Calculation Engine
 * All monetary calculations are performed in integer minor units (paise)
 * to prevent floating-point rounding errors.
 *
 * This module is pure and shared with the browser: it holds no coupon codes.
 * Coupons live in the database (`coupons` table, managed in /admin/discounts) and are
 * resolved on the server (src/lib/coupons.ts) before being passed in here.
 */

export interface PricingItem {
  id: string;
  name: string;
  unitPriceMinor: number; // e.g. 249900 for ₹2,499
  quantity: number;
  size: string;
  color: string;
}

/** A coupon already looked up and checked (active, not expired, uses left) on the server. */
export interface ResolvedCoupon {
  code: string;
  percent: number; // 0 = no percentage discount
  minSpendMinor: number;
  freeShipping: boolean;
  /** Minimum number of different products in the bag (bundle codes). */
  minDistinctProducts?: number;
  description?: string | null;
}

export interface PricingOptions {
  coupon?: ResolvedCoupon | null;
  deliveryMethod?: "standard" | "express" | "vip_courier";
  currency?: "USD" | "INR";
}

export interface PricingSummary {
  currency: "USD" | "INR";
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  /** GST already contained in the (tax-inclusive) prices — informational, never added on top. */
  taxMinor: number;
  totalMinor: number;
  promoCodeApplied: string | null;
  discountPercent: number;
  isFreeShipping: boolean;
}

// Shipping rules: Orders >= ₹1,999 (199,900 paise) receive complimentary courier across India
export const FREE_SHIPPING_THRESHOLD_MINOR = 199900;
export const SHIPPING_RATES_MINOR: Record<"standard" | "express" | "vip_courier", number> = {
  standard: 15000, // ₹150.00
  express: 25000, // ₹250.00
  vip_courier: 35000, // ₹350.00
};

/**
 * GST on readymade garments (Notification 9/2025-Central Tax (Rate), effective 22 Sep 2025):
 * 5% when the sale value of a piece is up to ₹2,500, 18% above that.
 * The test is per piece, on the price after discount. Confirm against your HSN codes with your CA.
 */
export const GST_PIECE_THRESHOLD_MINOR = 250000;
export const GST_LOW_RATE_BPS = 500;
export const GST_HIGH_RATE_BPS = 1800;

export function gstRateBpsForPiece(pieceSaleValueMinor: number): number {
  return pieceSaleValueMinor <= GST_PIECE_THRESHOLD_MINOR ? GST_LOW_RATE_BPS : GST_HIGH_RATE_BPS;
}

/** Why a coupon doesn't apply to these items, or null if it does. */
export function couponIneligibilityReason(items: PricingItem[], coupon: ResolvedCoupon, subtotalMinor: number): string | null {
  if (subtotalMinor < coupon.minSpendMinor) {
    return `${coupon.code} needs a bag of ₹${(coupon.minSpendMinor / 100).toLocaleString("en-IN")} or more.`;
  }
  const distinct = new Set(items.map((i) => i.id)).size;
  if (coupon.minDistinctProducts && distinct < coupon.minDistinctProducts) {
    return `${coupon.code} needs at least ${coupon.minDistinctProducts} different pieces in your bag.`;
  }
  return null;
}

/**
 * Calculates complete order pricing breakdown.
 */
export function calculateOrderPricing(items: PricingItem[], options: PricingOptions = {}): PricingSummary {
  const currency = options.currency || "INR";
  const deliveryMethod = options.deliveryMethod || "standard";

  if (!items || items.length === 0) {
    return {
      currency,
      subtotalMinor: 0,
      discountMinor: 0,
      shippingMinor: 0,
      taxMinor: 0,
      totalMinor: 0,
      promoCodeApplied: null,
      discountPercent: 0,
      isFreeShipping: false,
    };
  }

  const lines = items.map((item) => ({
    qty: Math.max(1, Math.floor(item.quantity)),
    price: Math.max(0, Math.floor(item.unitPriceMinor)),
  }));

  // 1. Subtotal
  const subtotalMinor = lines.reduce((acc, l) => acc + l.price * l.qty, 0);

  // 2. Coupon
  const coupon = options.coupon ?? null;
  const couponApplies = !!coupon && couponIneligibilityReason(items, coupon, subtotalMinor) === null;
  const discountPercent = couponApplies ? Math.max(0, Math.min(90, coupon!.percent)) : 0;
  const discountMinor = Math.round((subtotalMinor * discountPercent) / 100);
  const discountedSubtotalMinor = Math.max(0, subtotalMinor - discountMinor);

  // 3. Shipping (threshold met OR a free-shipping coupon applies)
  const isFreeShipping =
    discountedSubtotalMinor >= FREE_SHIPPING_THRESHOLD_MINOR || (couponApplies && coupon!.freeShipping);
  const baseShipping = SHIPPING_RATES_MINOR[deliveryMethod] || SHIPPING_RATES_MINOR.standard;
  const shippingMinor = isFreeShipping ? 0 : baseShipping;

  // 4. GST is included in listed prices. Extract the embedded component per piece:
  //    tax = piece value * rate / (1 + rate), with the rate chosen from the piece's discounted value.
  const taxMinor = lines.reduce((acc, l) => {
    const pieceValue = (l.price * (100 - discountPercent)) / 100;
    const bps = gstRateBpsForPiece(pieceValue);
    return acc + Math.round((pieceValue * l.qty * bps) / (10000 + bps));
  }, 0);

  // 5. Total — the customer pays the displayed prices, less discount, plus shipping
  const totalMinor = discountedSubtotalMinor + shippingMinor;

  return {
    currency,
    subtotalMinor,
    discountMinor,
    shippingMinor,
    taxMinor,
    totalMinor,
    promoCodeApplied: couponApplies ? coupon!.code : null,
    discountPercent,
    isFreeShipping,
  };
}

/**
 * Formats minor units for display (e.g., 249900 -> "₹2,499")
 */
export function formatMinorUnits(amountMinor: number, currency: "USD" | "INR" = "INR"): string {
  const major = amountMinor / 100;

  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(major);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}

/**
 * Formats major units for display (e.g., 2499 -> "₹2,499")
 */
export function formatPrice(amountMajor: number, currency: "USD" | "INR" = "INR"): string {
  return formatMinorUnits(Math.round(amountMajor * 100), currency);
}
