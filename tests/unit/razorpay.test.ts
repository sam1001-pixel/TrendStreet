import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  getRazorpayEnvironment,
} from "../../src/lib/razorpay";

const TEST_SECRET = process.env.RAZORPAY_KEY_SECRET || "mock_hmac_secret_for_unit_tests";
const TEST_ORDER_ID = "order_mock_test_12345";
const TEST_PAYMENT_ID = "pay_mock_test_67890";

function generateExpectedPaymentSignature(orderId: string, paymentId: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

function generateExpectedWebhookSignature(rawBody: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
}

test("Razorpay Payment Signature - accepts valid cryptographic HMAC-SHA256 signature", () => {
  const validSignature = generateExpectedPaymentSignature(TEST_ORDER_ID, TEST_PAYMENT_ID, TEST_SECRET);

  const isValid = verifyRazorpayPaymentSignature({
    orderId: TEST_ORDER_ID,
    paymentId: TEST_PAYMENT_ID,
    signature: validSignature,
    secret: TEST_SECRET,
  });

  assert.equal(isValid, true, "Valid payment signature must be verified successfully");
});

test("Razorpay Payment Signature - rejects tampered order ID", () => {
  const validSignature = generateExpectedPaymentSignature(TEST_ORDER_ID, TEST_PAYMENT_ID, TEST_SECRET);

  const isValid = verifyRazorpayPaymentSignature({
    orderId: "order_TAMPERED12345",
    paymentId: TEST_PAYMENT_ID,
    signature: validSignature,
    secret: TEST_SECRET,
  });

  assert.equal(isValid, false, "Tampered order ID must fail signature verification");
});

test("Razorpay Payment Signature - rejects tampered payment ID", () => {
  const validSignature = generateExpectedPaymentSignature(TEST_ORDER_ID, TEST_PAYMENT_ID, TEST_SECRET);

  const isValid = verifyRazorpayPaymentSignature({
    orderId: TEST_ORDER_ID,
    paymentId: "pay_FORGED_PAYMENT",
    signature: validSignature,
    secret: TEST_SECRET,
  });

  assert.equal(isValid, false, "Tampered payment ID must fail signature verification");
});

test("Razorpay Payment Signature - rejects forged or altered signature", () => {
  const forgedSignature = "a".repeat(64);

  const isValid = verifyRazorpayPaymentSignature({
    orderId: TEST_ORDER_ID,
    paymentId: TEST_PAYMENT_ID,
    signature: forgedSignature,
    secret: TEST_SECRET,
  });

  assert.equal(isValid, false, "Arbitrary hex signature must fail verification");
});

test("Razorpay Payment Signature - handles missing or malformed inputs safely", () => {
  assert.equal(
    verifyRazorpayPaymentSignature({ orderId: "", paymentId: TEST_PAYMENT_ID, signature: "sig", secret: TEST_SECRET }),
    false
  );
  assert.equal(
    verifyRazorpayPaymentSignature({ orderId: TEST_ORDER_ID, paymentId: "", signature: "sig", secret: TEST_SECRET }),
    false
  );
  assert.equal(
    verifyRazorpayPaymentSignature({ orderId: TEST_ORDER_ID, paymentId: TEST_PAYMENT_ID, signature: "", secret: TEST_SECRET }),
    false
  );
});

test("Razorpay Webhook Signature - accepts valid payload signature", () => {
  const rawPayload = JSON.stringify({
    entity: "event",
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: TEST_PAYMENT_ID,
          amount: 249900,
          currency: "INR",
          status: "captured",
        },
      },
    },
  });

  const validSignature = generateExpectedWebhookSignature(rawPayload, TEST_SECRET);

  const isValid = verifyRazorpayWebhookSignature({
    rawBody: rawPayload,
    signature: validSignature,
    secret: TEST_SECRET,
  });

  assert.equal(isValid, true, "Legitimate webhook payload signature must verify successfully");
});

test("Razorpay Webhook Signature - rejects tampered raw body payload", () => {
  const legitimatePayload = JSON.stringify({ event: "payment.captured", id: "pay_1" });
  const validSignature = generateExpectedWebhookSignature(legitimatePayload, TEST_SECRET);

  const tamperedPayload = JSON.stringify({ event: "payment.captured", id: "pay_TAMPERED" });

  const isValid = verifyRazorpayWebhookSignature({
    rawBody: tamperedPayload,
    signature: validSignature,
    secret: TEST_SECRET,
  });

  assert.equal(isValid, false, "Tampered webhook payload must fail verification");
});

test("Razorpay Environment Safety Gate - enforces test mode and prevents unapproved live mode", () => {
  const originalKeyId = process.env.RAZORPAY_KEY_ID;
  const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const originalAllowLive = process.env.ALLOW_LIVE_PAYMENTS;

  try {
    // 1. Valid test configuration
    process.env.RAZORPAY_KEY_ID = "rzp_test_mockKeyForTesting";
    process.env.RAZORPAY_KEY_SECRET = "mockSecretForTesting123";
    process.env.ALLOW_LIVE_PAYMENTS = "false";

    const testEnv = getRazorpayEnvironment();
    assert.equal(testEnv.isTestMode, true);
    assert.equal(testEnv.isLiveMode, false);

    // 2. Block unapproved live keys
    process.env.RAZORPAY_KEY_ID = "rzp_live_realMerchantKey123";
    process.env.ALLOW_LIVE_PAYMENTS = "false";

    assert.throws(
      () => getRazorpayEnvironment(),
      /Live Razorpay credentials .* detected, but live payments are NOT explicitly authorized/
    );

    // 3. Approved live keys pass safety check
    process.env.ALLOW_LIVE_PAYMENTS = "true";
    const liveEnv = getRazorpayEnvironment();
    assert.equal(liveEnv.isLiveMode, true);
    assert.equal(liveEnv.isTestMode, false);

    // 4. Missing credentials in production throw configuration error
    const originalNodeEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = "production";
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;
      assert.throws(
        () => getRazorpayEnvironment(),
        /RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing/
      );
    } finally {
      (process.env as any).NODE_ENV = originalNodeEnv;
    }
  } finally {
    process.env.RAZORPAY_KEY_ID = originalKeyId;
    process.env.RAZORPAY_KEY_SECRET = originalKeySecret;
    process.env.ALLOW_LIVE_PAYMENTS = originalAllowLive;
  }
});

test("Razorpay Signature Enforcement - rejects unverified or simulated signatures", async () => {
  const originalKeyId = process.env.RAZORPAY_KEY_ID;
  const originalAllowLive = process.env.ALLOW_LIVE_PAYMENTS;
  try {
    process.env.RAZORPAY_KEY_ID = "rzp_test_mockKeyForTesting";
    process.env.ALLOW_LIVE_PAYMENTS = "false";

    const simOrderId = "order_sim_test123";
    const simPaymentId = "pay_sim_test456";
    const fakeSig = `sim_sig_${simOrderId}`;

    const isValid = verifyRazorpayPaymentSignature({
      orderId: simOrderId,
      paymentId: simPaymentId,
      signature: fakeSig,
      secret: "mock_secret",
    });
    assert.equal(isValid, false, "Fake or simulated signatures must always be rejected");

    // Real cryptographic HMAC signature must be accepted
    const legitSig = crypto
      .createHmac("sha256", "mock_secret")
      .update(`${simOrderId}|${simPaymentId}`)
      .digest("hex");

    const isLegitValid = verifyRazorpayPaymentSignature({
      orderId: simOrderId,
      paymentId: simPaymentId,
      signature: legitSig,
      secret: "mock_secret",
    });
    assert.equal(isLegitValid, true, "Legitimate cryptographic signature must be accepted");
  } finally {
    process.env.RAZORPAY_KEY_ID = originalKeyId;
    process.env.ALLOW_LIVE_PAYMENTS = originalAllowLive;
  }
});
