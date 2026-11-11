import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

if (!process.env.RAZORPAY_KEY_ID) process.env.RAZORPAY_KEY_ID = "rzp_test_TyzNAN2k14a8Ug";
if (!process.env.RAZORPAY_KEY_SECRET) process.env.RAZORPAY_KEY_SECRET = "fV5jMZu52qHzgCnBLA4zgv67";
if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_TyzNAN2k14a8Ug";

import { POST as createOrderHandler } from "../../src/app/api/create-order/route";
import { POST as verifyPaymentHandler } from "../../src/app/api/verify-payment/route";
import { NextRequest } from "next/server";

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

test("POST /api/create-order - rejects amount less than 100 paise", async () => {
  const req = new NextRequest("http://localhost:3000/api/create-order", {
    method: "POST",
    body: JSON.stringify({ amount: 50, currency: "INR" }),
  });

  const res = await createOrderHandler(req);
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.ok(data.error.includes("Minimum amount is 100 paise"));
});

test("POST /api/create-order - rejects missing or invalid amount", async () => {
  const req = new NextRequest("http://localhost:3000/api/create-order", {
    method: "POST",
    body: JSON.stringify({ currency: "INR" }),
  });

  const res = await createOrderHandler(req);
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.ok(data.error);
});

test("POST /api/verify-payment - rejects missing required parameters", async () => {
  const req = new NextRequest("http://localhost:3000/api/verify-payment", {
    method: "POST",
    body: JSON.stringify({ razorpay_order_id: "order_123" }),
  });

  const res = await verifyPaymentHandler(req);
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.equal(data.success, false);
});

test("POST /api/verify-payment - rejects invalid signature", async () => {
  const req = new NextRequest("http://localhost:3000/api/verify-payment", {
    method: "POST",
    body: JSON.stringify({
      razorpay_order_id: "order_12345",
      razorpay_payment_id: "pay_67890",
      razorpay_signature: "invalid_tampered_signature_hex",
    }),
  });

  const res = await verifyPaymentHandler(req);
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.equal(data.success, false);
});

test("POST /api/verify-payment - successfully verifies valid HMAC-SHA256 signature", async () => {
  const orderId = "order_valid_99999";
  const paymentId = "pay_valid_88888";
  const expectedSignature = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const req = new NextRequest("http://localhost:3000/api/verify-payment", {
    method: "POST",
    body: JSON.stringify({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: expectedSignature,
    }),
  });

  const res = await verifyPaymentHandler(req);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.equal(data.message, "Payment verified successfully");
});
