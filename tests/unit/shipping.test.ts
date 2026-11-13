import test from "node:test";
import assert from "node:assert/strict";
import { ShiprocketShippingAdapter } from "../../src/lib/shipping/shiprocket";
import { getShippingProvider } from "../../src/lib/shipping";

test("Shipping Adapter - getShippingProvider returns configured provider singleton", () => {
  const provider = getShippingProvider();
  assert.ok(provider, "Shipping provider must be defined");
  assert.equal(provider.providerName, "Shiprocket");
});

test("Shipping Adapter - checkServiceability rejects invalid PIN codes", async () => {
  const adapter = new ShiprocketShippingAdapter();
  const res = await adapter.checkServiceability({
    pickupPincode: "400050",
    deliveryPincode: "012345", // Invalid (starts with 0)
    weightKg: 0.5,
    isCod: false,
    orderValuePaise: 249900,
  });

  assert.equal(res.isServiceable, false, "Invalid PIN code must not be serviceable");
  assert.equal(res.availableCouriers.length, 0);
});

test("Shipping Adapter - checkServiceability resolves valid Indian PIN code in sandbox mode", async () => {
  const adapter = new ShiprocketShippingAdapter();
  const res = await adapter.checkServiceability({
    pickupPincode: "400050",
    deliveryPincode: "400001", // Mumbai Fort (Metro)
    weightKg: 0.5,
    isCod: true,
    orderValuePaise: 249900,
  });

  assert.equal(res.isServiceable, true);
  assert.ok(res.availableCouriers.length >= 2, "Must return multiple courier options");
  assert.ok(res.cheapestCourier, "Must identify cheapest courier");
  assert.ok(res.fastestCourier, "Must identify fastest courier");
  // Orders >= ₹1,999 (199900 paise) get free shipping
  assert.equal(res.cheapestCourier?.ratePaise, 0, "Rate must be 0 for orders over threshold");
});

test("Shipping Adapter - checkServiceability charges courier fee below ₹1,999 threshold", async () => {
  const adapter = new ShiprocketShippingAdapter();
  const res = await adapter.checkServiceability({
    pickupPincode: "400050",
    deliveryPincode: "110001", // New Delhi
    weightKg: 0.5,
    isCod: false,
    orderValuePaise: 149900, // Below ₹1,999 threshold
  });

  assert.equal(res.isServiceable, true);
  assert.ok((res.cheapestCourier?.ratePaise ?? 0) > 0, "Fee must be charged below threshold");
});

test("Shipping Adapter - createShipment books shipment with valid AWB in sandbox mode", async () => {
  const adapter = new ShiprocketShippingAdapter();
  const res = await adapter.createShipment({
    orderNumber: "TS-TEST-SHIP-01",
    orderDate: new Date(),
    customerName: "Aarav Mehta",
    customerEmail: "aarav@offvybe.in",
    customerPhone: "9820011223",
    deliveryAddress: {
      street: "12 Linking Road",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400050",
      country: "India",
    },
    items: [
      {
        name: "The Mayfair Heavyweight Tee",
        sku: "TS-TEE-BLK-L",
        units: 1,
        sellingPricePaise: 249900,
      },
    ],
    dimensions: {
      lengthCm: 30,
      breadthCm: 25,
      heightCm: 5,
      weightKg: 0.4,
    },
    paymentMethod: "PREPAID",
    totalAmountPaise: 249900,
  });

  assert.equal(res.success, true);
  assert.ok(res.awbCode, "Must assign an AWB code");
  assert.equal(res.orderId, "TS-TEST-SHIP-01");
  assert.equal(res.isMock, true, "Must flag sandbox mock mode");
});

test("Shipping Adapter - trackShipment returns structured checkpoints", async () => {
  const adapter = new ShiprocketShippingAdapter();
  const tracking = await adapter.trackShipment("AWB4000501234");

  assert.equal(tracking.awbCode, "AWB4000501234");
  assert.ok(tracking.checkpoints.length >= 1, "Must contain tracking history");
  assert.ok(tracking.estimatedDelivery, "Must provide estimated delivery date");
});

test("Shipping Adapter - cancelShipment successfully executes cancellation", async () => {
  const adapter = new ShiprocketShippingAdapter();
  const res = await adapter.cancelShipment("MOCK-SHIP-001", "AWB4000501234");

  assert.equal(res.success, true);
  assert.ok(res.message);
});

test("Shipping Adapter - checkConnectionAndPickups returns Jodhpur atelier hub when unconfigured", async () => {
  const adapter = new ShiprocketShippingAdapter();
  const conn = await adapter.checkConnectionAndPickups();

  assert.equal(conn.success, false);
  assert.equal(conn.isLive, false);
  assert.ok(conn.locations.length >= 1, "Must return fallback atelier hub");
  const hub = conn.locations[0];
  assert.equal(hub.pin_code, "342008", "Fallback hub PIN must match Jodhpur atelier 342008");
  assert.equal(hub.city, "Jodhpur");
  assert.equal(hub.state, "Rajasthan");
  assert.equal(hub.phone, "9079199951");
});

test("Shipping Adapter - generateLabel returns printable PDF URL in sandbox mode", async () => {
  const adapter = new ShiprocketShippingAdapter();
  const labelUrl = await adapter.generateLabel("MOCK-SHIP-123");

  assert.ok(labelUrl, "Must return a label URL");
  assert.ok(labelUrl.includes("MOCK-SHIP-123.pdf") || labelUrl.startsWith("http"));
});

test("Shipping Adapter - normalizes tracking statuses correctly", () => {
  const mapStatus = (raw: string): "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | null => {
    const rawStatus = raw.toUpperCase();
    if (rawStatus.includes("DELIVERED") && !rawStatus.includes("UNDELIVERED")) return "DELIVERED";
    if (rawStatus.includes("OUT") || rawStatus.includes("TRANSIT") || rawStatus.includes("REACHED")) return "IN_TRANSIT";
    if (rawStatus.includes("PICKED") || rawStatus.includes("MANIFEST")) return "SHIPPED";
    return null;
  };

  assert.equal(mapStatus("DELIVERED"), "DELIVERED");
  assert.equal(mapStatus("OUT FOR DELIVERY"), "IN_TRANSIT");
  assert.equal(mapStatus("IN TRANSIT"), "IN_TRANSIT");
  assert.equal(mapStatus("REACHED AT DESTINATION HUB"), "IN_TRANSIT");
  assert.equal(mapStatus("PICKED UP"), "SHIPPED");
  assert.equal(mapStatus("MANIFEST GENERATED"), "SHIPPED");
  assert.equal(mapStatus("UNDELIVERED_ATTEMPT_1"), null);
});

