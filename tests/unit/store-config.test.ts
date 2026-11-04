import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STORE_CONFIG, sanitizeStoreConfig, shippingRulesFromConfig, fillText } from "../../src/lib/store-config";
import { calculateOrderPricing } from "../../src/lib/pricing";

test("sanitizeStoreConfig - empty or junk falls back to safe defaults", () => {
  assert.deepEqual(sanitizeStoreConfig(null), DEFAULT_STORE_CONFIG);
  assert.deepEqual(sanitizeStoreConfig("nonsense"), DEFAULT_STORE_CONFIG);
  assert.deepEqual(sanitizeStoreConfig({ shipping: "x", trust: 5 }), DEFAULT_STORE_CONFIG);
});

test("sanitizeStoreConfig - clamps money, drops bad links and codes", () => {
  const c = sanitizeStoreConfig({
    shipping: { freeOver: -50, standard: 999999, express: "99", expressEnabled: "yes" },
    cod: { maxPieces: 0, maxOpenPerCustomer: 1000 },
    social: { instagram: "javascript:alert(1)", facebook: "https://facebook.com/offvybe", whatsapp: "+91 98765 43210" },
    offer: { code: "bad code!", bagCodes: ["trend10", "<x>", "street20"] },
    hacker: { evil: true },
  });
  assert.equal(c.shipping.freeOver, 0);
  assert.equal(c.shipping.standard, 5000);
  assert.equal(c.shipping.express, 99);
  assert.equal(c.shipping.expressEnabled, true); // non-boolean ignored → default
  assert.equal(c.cod.maxPieces, 1);
  assert.equal(c.cod.maxOpenPerCustomer, 20);
  assert.equal(c.social.instagram, "");
  assert.equal(c.social.facebook, "https://facebook.com/offvybe");
  assert.equal(c.social.whatsapp, "9876543210");
  assert.equal(c.offer.code, DEFAULT_STORE_CONFIG.offer.code);
  assert.deepEqual(c.offer.bagCodes, ["TREND10", "STREET20"]);
  assert.equal((c as unknown as Record<string, unknown>).hacker, undefined);
});

test("pricing uses the admin's delivery charges", () => {
  const cfg = sanitizeStoreConfig({ shipping: { freeOver: 900, standard: 49, express: 99 } });
  const rules = shippingRulesFromConfig(cfg);
  const one = [{ id: "a", name: "Tee", unitPriceMinor: 49900, quantity: 1, size: "M", color: "Black" }];
  const two = [{ ...one[0], quantity: 2 }];
  assert.equal(calculateOrderPricing(one, { shipping: rules }).totalMinor, 49900 + 4900);
  assert.equal(calculateOrderPricing(one, { shipping: rules, deliveryMethod: "express" }).totalMinor, 49900 + 9900);
  assert.equal(calculateOrderPricing(two, { shipping: rules }).totalMinor, 99800); // ₹998 ≥ ₹900 → free
  // Without rules the old defaults still apply.
  assert.equal(calculateOrderPricing(one).shippingMinor, 15000);
});

test("fillText - placeholders", () => {
  assert.equal(fillText("Free over {freeOver} · {count} styles", DEFAULT_STORE_CONFIG, { count: 24 }), "Free over ₹1,999 · 24 styles");
});
