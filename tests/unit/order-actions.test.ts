import test from "node:test";
import assert from "node:assert/strict";
import { canCancel, canRequestReturn, needsSupportToCancel, returnDeadline } from "../../src/lib/order-actions";
import { parseAddress } from "../../src/lib/account";

const cod = [{ provider: "CASH_ON_DELIVERY" }] as never;
const online = [{ provider: "RAZORPAY" }] as never;
const DAY = 864e5;

test("order actions - COD orders can be cancelled only before dispatch", () => {
  assert.equal(canCancel({ status: "PENDING", trackingNumber: null, payments: cod }), true);
  assert.equal(canCancel({ status: "CONFIRMED", trackingNumber: null, payments: cod }), true);
  assert.equal(canCancel({ status: "CONFIRMED", trackingNumber: "BD123", payments: cod }), false, "has an AWB → already handed over");
  assert.equal(canCancel({ status: "SHIPPED", trackingNumber: null, payments: cod }), false);
  assert.equal(canCancel({ status: "CANCELLED", trackingNumber: null, payments: cod }), false);
});

test("order actions - paid online orders go through support (refund needed)", () => {
  assert.equal(canCancel({ status: "CONFIRMED", trackingNumber: null, payments: online }), false);
  assert.equal(needsSupportToCancel({ status: "CONFIRMED", trackingNumber: null, payments: online }), true);
  assert.equal(needsSupportToCancel({ status: "DELIVERED", trackingNumber: "X", payments: online }), false);
});

test("order actions - exchanges open for 30 days after delivery, one open request at a time", () => {
  const now = Date.now();
  const delivered = { status: "DELIVERED" as const, deliveredAt: new Date(now - 5 * DAY), updatedAt: new Date(now), returnRequests: [] as { status: string }[] };
  assert.equal(canRequestReturn(delivered as never, now), true);
  assert.equal(returnDeadline(delivered as never)?.getTime(), delivered.deliveredAt.getTime() + 30 * DAY);

  assert.equal(canRequestReturn({ ...delivered, deliveredAt: new Date(now - 31 * DAY) } as never, now), false, "window closed");
  assert.equal(canRequestReturn({ ...delivered, status: "SHIPPED" } as never, now), false, "not delivered yet");
  assert.equal(canRequestReturn({ ...delivered, returnRequests: [{ status: "REQUESTED" }] } as never, now), false, "already open");
  assert.equal(canRequestReturn({ ...delivered, returnRequests: [{ status: "REJECTED" }] } as never, now), true, "can ask again after a rejection");
  // Orders delivered before this feature have no deliveredAt: fall back to the last update.
  assert.equal(canRequestReturn({ ...delivered, deliveredAt: null, updatedAt: new Date(now - 2 * DAY) } as never, now), true);
});

test("account - addresses are validated and cleaned", () => {
  const ok = parseAddress({ fullName: "  Riya  Sharma ", phone: "+91 98765 43210", address: "12 MG Road", city: "Jaipur", state: "Rajasthan", postalCode: "302001", label: "" });
  assert.ok("data" in ok);
  if ("data" in ok) {
    assert.equal(ok.data.fullName, "Riya Sharma");
    assert.equal(ok.data.phone, "9876543210");
    assert.equal(ok.data.label, "Home");
  }
  assert.ok("error" in parseAddress({ fullName: "Riya", address: "12 MG Road", city: "Jaipur", postalCode: "002001" }), "bad PIN");
  assert.ok("error" in parseAddress({ fullName: "Riya", address: "12 MG Road", city: "Jaipur", state: "Atlantis", postalCode: "302001" }), "unknown state");
  assert.ok("error" in parseAddress({ fullName: "Riya", phone: "12345", address: "12 MG Road", city: "Jaipur", postalCode: "302001" }), "bad phone");
  const xss = parseAddress({ fullName: "<script>x</script>Riya", address: "12 MG Road", city: "Jaipur", postalCode: "302001" });
  assert.ok("data" in xss && !xss.data.fullName.includes("<"));
});
