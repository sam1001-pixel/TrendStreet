/**
 * Money-path tests for Razorpay confirmation and stale-order release, against an in-memory
 * stand-in for Prisma (installed on globalThis before src/lib/prisma loads).
 */
import test from "node:test";
import assert from "node:assert/strict";

type Row = Record<string, any>;

function makeDb() {
  const state = {
    payments: [] as Row[],
    orders: [] as Row[],
    inventory: [] as Row[],
    coupons: [] as Row[],
    audit: [] as Row[],
  };

  const matches = (row: Row, where: Row): boolean =>
    Object.entries(where).every(([k, v]) => {
      if (v && typeof v === "object" && !(v instanceof Date)) {
        if ("in" in v) return v.in.includes(row[k]);
        if ("not" in v) return row[k] !== v.not;
        if ("gte" in v) return row[k] >= v.gte;
        if ("gt" in v) return row[k] > v.gt;
        if ("lt" in v) return row[k] < v.lt;
      }
      return row[k] === v;
    });

  const apply = (row: Row, data: Row) => {
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === "object" && "increment" in v) row[k] += v.increment;
      else if (v && typeof v === "object" && "decrement" in v) row[k] -= v.decrement;
      else row[k] = v;
    }
  };

  const withOrder = (p: Row) => ({
    ...p,
    order: { ...state.orders.find((o) => o.id === p.orderId)!, items: state.orders.find((o) => o.id === p.orderId)!.items },
  });

  const db: any = {
    payment: {
      findUnique: async ({ where }: Row) => {
        const p = state.payments.find((x) => matches(x, where));
        return p ? withOrder(p) : null;
      },
      findMany: async ({ where }: Row) => state.payments.filter((x) => matches(x, where)).map(withOrder),
      updateMany: async ({ where, data }: Row) => {
        const rows = state.payments.filter((x) => matches(x, where));
        rows.forEach((r) => apply(r, data));
        return { count: rows.length };
      },
      update: async ({ where, data }: Row) => {
        const r = state.payments.find((x) => x.id === where.id)!;
        apply(r, data);
        return r;
      },
    },
    order: {
      update: async ({ where, data }: Row) => {
        const r = state.orders.find((x) => x.id === where.id)!;
        apply(r, data);
        return r;
      },
    },
    inventory: {
      updateMany: async ({ where, data }: Row) => {
        const rows = state.inventory.filter((x) => matches(x, where));
        rows.forEach((r) => apply(r, data));
        return { count: rows.length };
      },
    },
    coupon: {
      updateMany: async ({ where, data }: Row) => {
        const rows = state.coupons.filter((x) => matches(x, where));
        rows.forEach((r) => apply(r, data));
        return { count: rows.length };
      },
    },
    auditLog: { create: async ({ data }: Row) => state.audit.push(data) },
    $transaction: async (arg: any) => {
      if (typeof arg !== "function") return Promise.all(arg);
      // Snapshot so a thrown error rolls back, like a real transaction.
      const snap = JSON.parse(JSON.stringify(state));
      try {
        return await arg(db);
      } catch (e) {
        Object.assign(state, snap);
        throw e;
      }
    },
  };

  return { db, state };
}

const { db, state } = makeDb();
(globalThis as any).prisma = db;

function seed({ status = "PENDING", paymentStatus = "PENDING", amount = 249900, stock = 0, promo = null as string | null } = {}) {
  state.payments.length = state.orders.length = state.inventory.length = state.coupons.length = state.audit.length = 0;
  state.orders.push({ id: "o1", orderNumber: "TS-261103-AAAAA", status, promoCode: promo, items: [{ variantId: "v1", quantity: 1 }] });
  state.payments.push({
    id: "p1",
    orderId: "o1",
    provider: "RAZORPAY",
    gatewayOrderId: "order_X",
    gatewayPaymentId: null,
    status: paymentStatus,
    amount,
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
  });
  state.inventory.push({ variantId: "v1", quantity: stock });
  if (promo) state.coupons.push({ code: promo, usedCount: 1 });
}

test("orders - confirms a saved pending order exactly once", async () => {
  const { confirmRazorpayPayment } = await import("../../src/lib/orders");
  seed();
  const first = await confirmRazorpayPayment({ gatewayOrderId: "order_X", gatewayPaymentId: "pay_1", paidAmountMinor: 249900, source: "verify" });
  assert.equal(first.outcome, "confirmed");
  assert.equal(first.outcome === "confirmed" && first.newlyConfirmed, true);
  assert.equal(state.orders[0].status, "CONFIRMED");
  assert.equal(state.payments[0].status, "CAPTURED");

  // The webhook arriving afterwards changes nothing and sends no second email.
  const again = await confirmRazorpayPayment({ gatewayOrderId: "order_X", gatewayPaymentId: "pay_1", paidAmountMinor: 249900, source: "webhook" });
  assert.equal(again.outcome === "confirmed" && again.newlyConfirmed, false);
});

test("orders - a different paid amount is held for review, not confirmed", async () => {
  const { confirmRazorpayPayment } = await import("../../src/lib/orders");
  seed();
  const res = await confirmRazorpayPayment({ gatewayOrderId: "order_X", gatewayPaymentId: "pay_2", paidAmountMinor: 100, source: "verify" });
  assert.equal(res.outcome, "needs_review");
  assert.equal(state.orders[0].status, "PENDING");
  assert.ok(state.audit.some((a) => a.action === "PAYMENT_NEEDS_REVIEW"));
});

test("orders - unknown Razorpay order ids are reported, not invented", async () => {
  const { confirmRazorpayPayment } = await import("../../src/lib/orders");
  seed();
  const res = await confirmRazorpayPayment({ gatewayOrderId: "order_UNKNOWN", gatewayPaymentId: "pay_3", paidAmountMinor: 249900, source: "verify" });
  assert.equal(res.outcome, "not_found");
});

test("orders - a late payment on a released order takes the stock back and confirms", async () => {
  const { confirmRazorpayPayment } = await import("../../src/lib/orders");
  seed({ status: "CANCELLED", paymentStatus: "FAILED", stock: 3 });
  const res = await confirmRazorpayPayment({ gatewayOrderId: "order_X", gatewayPaymentId: "pay_4", paidAmountMinor: 249900, source: "webhook" });
  assert.equal(res.outcome, "confirmed");
  assert.equal(state.orders[0].status, "CONFIRMED");
  assert.equal(state.inventory[0].quantity, 2);
});

test("orders - abandoned payments are released: stock and coupon use come back", async () => {
  const { releaseStaleRazorpayOrders } = await import("../../src/lib/orders");
  seed({ stock: 0, promo: "TREND10" });
  state.payments[0].gatewayOrderId = null; // skip the Razorpay status check
  const res = await releaseStaleRazorpayOrders();
  assert.deepEqual(res, { released: 1, confirmed: 0, errors: 0 });
  assert.equal(state.orders[0].status, "CANCELLED");
  assert.equal(state.payments[0].status, "FAILED");
  assert.equal(state.inventory[0].quantity, 1);
  assert.equal(state.coupons[0].usedCount, 0);

  // Running again does nothing.
  assert.deepEqual(await releaseStaleRazorpayOrders(), { released: 0, confirmed: 0, errors: 0 });
});
