import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateOrderPricing,
  formatMinorUnits,
  formatPrice,
  FREE_SHIPPING_THRESHOLD_MINOR,
  SHIPPING_RATES_MINOR,
  PricingItem,
  ResolvedCoupon,
} from "../../src/lib/pricing";

// Coupons as the server resolves them from the database (prisma/seed.ts).
const TREND10: ResolvedCoupon = { code: "TREND10", percent: 10, minSpendMinor: 199900, freeShipping: false };
const STREET20: ResolvedCoupon = { code: "STREET20", percent: 20, minSpendMinor: 399900, freeShipping: false };
const FREESHIP: ResolvedCoupon = { code: "FREESHIP", percent: 0, minSpendMinor: 0, freeShipping: true };
const BUNDLE15: ResolvedCoupon = { code: "BUNDLE15", percent: 15, minSpendMinor: 0, freeShipping: false, minDistinctProducts: 2 };

test("calculateOrderPricing - calculates subtotal in integer minor units (paise) with zero floating drift", () => {
  const items: PricingItem[] = [
    { id: "ts-001", name: "Mayfair Oversized Tee", unitPriceMinor: 249900, quantity: 2, size: "L", color: "Deep Burgundy" },
    { id: "ts-002", name: "Tokyo Oversized Hoodie", unitPriceMinor: 499900, quantity: 1, size: "M", color: "Warm Ivory" },
  ];

  // 249900 * 2 + 499900 = 999700 paise (₹9,997)
  const result = calculateOrderPricing(items);

  assert.equal(result.subtotalMinor, 999700);
  assert.equal(Number.isInteger(result.subtotalMinor), true);
  // Above ₹1,999 (199,900 paise) threshold, shipping must be free
  assert.equal(result.isFreeShipping, true);
  assert.equal(result.shippingMinor, 0);
  // Default currency is INR
  assert.equal(result.currency, "INR");
});

test("calculateOrderPricing - applies shipping fee when subtotal is below ₹1,999 threshold", () => {
  const items: PricingItem[] = [
    { id: "ts-sample", name: "Textile Swatch", unitPriceMinor: 150000, quantity: 1, size: "One Size", color: "Black" },
  ];

  // 150000 paise (₹1,500) < 199900 paise (₹1,999)
  const result = calculateOrderPricing(items, { deliveryMethod: "standard" });

  assert.equal(result.subtotalMinor, 150000);
  assert.equal(result.isFreeShipping, false);
  // Standard courier rate: 15000 paise (₹150.00)
  assert.equal(result.shippingMinor, SHIPPING_RATES_MINOR.standard);
  assert.equal(result.shippingMinor, 15000);
});

test("calculateOrderPricing - validates and applies promo codes accurately", () => {
  const items: PricingItem[] = [
    { id: "ts-002", name: "Tokyo Oversized Hoodie", unitPriceMinor: 499900, quantity: 1, size: "L", color: "Deep Burgundy" },
  ];

  // 10% promo code: TREND10 (minSpend: ₹1,999 = 199900 paise)
  const result = calculateOrderPricing(items, { coupon: TREND10 });

  assert.equal(result.promoCodeApplied, "TREND10");
  assert.equal(result.discountPercent, 10);
  assert.equal(result.discountMinor, 49990); // 10% of 499900 is 49990 paise (₹499.90 rounded)
  // Discounted subtotal = 499900 - 49990 = 449910 paise (₹4,499.10)
  // Free shipping still applies (449910 >= 199900)
  assert.equal(result.isFreeShipping, true);
  assert.equal(result.shippingMinor, 0);
});

test("calculateOrderPricing - rejects promo code when minimum spend is not met", () => {
  const items: PricingItem[] = [
    { id: "ts-001", name: "Mayfair Oversized Tee", unitPriceMinor: 249900, quantity: 1, size: "M", color: "Deep Burgundy" },
  ];

  // STREET20 requires minSpend 399900 paise (₹3,999)
  const result = calculateOrderPricing(items, { coupon: STREET20 });

  assert.equal(result.promoCodeApplied, null);
  assert.equal(result.discountMinor, 0);
});

test("calculateOrderPricing - FREESHIP promo code waives shipping fee on orders below ₹1,999 threshold", () => {
  const items: PricingItem[] = [
    { id: "ts-sample", name: "Textile Swatch", unitPriceMinor: 99900, quantity: 1, size: "One Size", color: "Black" },
  ];

  // 99900 paise (₹999) is below ₹1,999 threshold
  const result = calculateOrderPricing(items, { coupon: FREESHIP, deliveryMethod: "express" });

  assert.equal(result.promoCodeApplied, "FREESHIP");
  assert.equal(result.isFreeShipping, true);
  assert.equal(result.shippingMinor, 0);
});

test("formatMinorUnits & formatPrice - correctly formats INR with en-IN numbering", () => {
  const formattedInr = formatMinorUnits(249900, "INR");
  // Formats correctly to ₹2,499
  assert.match(formattedInr, /₹|INR/);
  assert.match(formattedInr, /2,499/);

  const formattedMajor = formatPrice(4999, "INR");
  assert.match(formattedMajor, /₹|INR/);
  assert.match(formattedMajor, /4,999/);

  // Large amounts with lakhs comma formatting
  const formattedLakh = formatMinorUnits(12500000, "INR"); // ₹1,25,000
  assert.match(formattedLakh, /1,25,000/);
});

test("calculateOrderPricing - GST is included in the price, never added on top", () => {
  const items: PricingItem[] = [
    { id: "ts-001", name: "Mayfair Oversized Tee", unitPriceMinor: 249900, quantity: 1, size: "M", color: "Deep Burgundy" },
  ];
  const result = calculateOrderPricing(items);
  // ₹2,499 tee with free shipping costs exactly ₹2,499
  assert.equal(result.totalMinor, 249900);
  // ₹2,499 is at or below ₹2,500 → 5% GST embedded: 249900 * 500 / 10500 = 11900 paise
  assert.equal(result.taxMinor, 11900);
});

test("calculateOrderPricing - GST is 18% on pieces above ₹2,500, judged per piece", () => {
  const items: PricingItem[] = [
    { id: "ts-001", name: "Tee", unitPriceMinor: 249900, quantity: 2, size: "M", color: "Black" }, // 5% each
    { id: "ts-009", name: "Jacket", unitPriceMinor: 899900, quantity: 1, size: "L", color: "Tan" }, // 18%
  ];
  const result = calculateOrderPricing(items);
  // 2 × 11900 + round(899900 * 1800 / 11800 = 137273)
  assert.equal(result.taxMinor, 23800 + 137273);
  assert.equal(result.totalMinor, 249900 * 2 + 899900);
});

test("calculateOrderPricing - a discount can move a piece into the 5% slab", () => {
  const shirt: PricingItem = { id: "ts-003", name: "Shirt", unitPriceMinor: 279900, quantity: 1, size: "M", color: "Black" };
  const tee: PricingItem = { id: "ts-001", name: "Tee", unitPriceMinor: 189900, quantity: 1, size: "M", color: "Black" };
  // No coupon: shirt ₹2,799 → 18%, tee ₹1,899 → 5%
  const full = calculateOrderPricing([shirt, tee]);
  assert.equal(full.taxMinor, Math.round((279900 * 1800) / 11800) + Math.round((189900 * 500) / 10500));
  // BUNDLE15: shirt ₹2,379.15 → 5%, tee ₹1,614.15 → 5%
  const bundled = calculateOrderPricing([shirt, tee], { coupon: BUNDLE15 });
  assert.equal(bundled.discountPercent, 15);
  assert.equal(bundled.taxMinor, Math.round((237915 * 500) / 10500) + Math.round((161415 * 500) / 10500));
  // A bundle code needs two different products, so it doesn't apply to the shirt alone
  assert.equal(calculateOrderPricing([shirt], { coupon: BUNDLE15 }).discountMinor, 0);
});

test("formatMinorUnits & formatPrice - correctly formats INR with en-IN numbering", () => {
  const formattedInr = formatMinorUnits(249900, "INR");
  // Formats correctly to ₹2,499
  assert.match(formattedInr, /₹|INR/);
  assert.match(formattedInr, /2,499/);

  const formattedMajor = formatPrice(4999, "INR");
  assert.match(formattedMajor, /₹|INR/);
  assert.match(formattedMajor, /4,999/);

  // Large amounts with lakhs comma formatting
  const formattedLakh = formatMinorUnits(12500000, "INR"); // ₹1,25,000
  assert.match(formattedLakh, /1,25,000/);
});

test("calculateOrderPricing - GST is included in the price, never added on top", () => {
  const items: PricingItem[] = [
    { id: "ts-001", name: "Mayfair Oversized Tee", unitPriceMinor: 249900, quantity: 1, size: "M", color: "Deep Burgundy" },
  ];
  const result = calculateOrderPricing(items);
  // ₹2,499 tee with free shipping costs exactly ₹2,499
  assert.equal(result.totalMinor, 249900);
  // ₹2,499 is at or below ₹2,500 → 5% GST embedded: 249900 * 500 / 10500 = 11900 paise
  assert.equal(result.taxMinor, 11900);
});

test("calculateOrderPricing - GST is 18% on pieces above ₹2,500, judged per piece", () => {
  const items: PricingItem[] = [
    { id: "ts-001", name: "Tee", unitPriceMinor: 249900, quantity: 2, size: "M", color: "Black" }, // 5% each
    { id: "ts-009", name: "Jacket", unitPriceMinor: 899900, quantity: 1, size: "L", color: "Tan" }, // 18%
  ];
  const result = calculateOrderPricing(items);
  // 2 × 11900 + round(899900 * 1800 / 11800 = 137273)
  assert.equal(result.taxMinor, 23800 + 137273);
  assert.equal(result.totalMinor, 249900 * 2 + 899900);
});

test("calculateOrderPricing - a discount can move a piece into the 5% slab", () => {
  const items: PricingItem[] = [
    { id: "ts-003", name: "Shirt", unitPriceMinor: 279900, quantity: 1, size: "M", color: "Black" },
  ];
  // Without a coupon: ₹2,799 → 18%
  assert.equal(calculateOrderPricing(items).taxMinor, Math.round((279900 * 1800) / 11800));
  // 20% off isn't eligible below ₹3,999; TREND10 takes it to ₹2,519.10 → still 18%
  const ten = calculateOrderPricing(items, { coupon: TREND10 });
  assert.equal(ten.taxMinor, Math.round((251910 * 1800) / 11800));
  // A 15% bundle code needs two different products, so it doesn't apply to one shirt
  assert.equal(calculateOrderPricing(items, { coupon: BUNDLE15 }).discountMinor, 0);
});

test("calculateOrderPricing - BUNDLE15 applies to two different products", () => {
  const items: PricingItem[] = [
    { id: "ts-001", name: "Tee", unitPriceMinor: 249900, quantity: 1, size: "M", color: "Black" },
    { id: "ts-004", name: "Denim", unitPriceMinor: 549900, quantity: 1, size: "32", color: "Indigo" },
  ];
  const result = calculateOrderPricing(items, { coupon: BUNDLE15 });
  assert.equal(result.promoCodeApplied, "BUNDLE15");
  assert.equal(result.discountMinor, 119970);
  assert.equal(result.totalMinor, 799800 - 119970);
});
