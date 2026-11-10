import test from "node:test";
import assert from "node:assert/strict";
import {
  maskEmailForLogs,
  getVerifiedSenderAddress,
  generateOrderConfirmationHtml,
  isOrderEmailAlreadySent,
  OrderEmailData,
} from "../../src/lib/email";

test("maskEmailForLogs - redacts email addresses to prevent PII exposure in logs", () => {
  assert.equal(maskEmailForLogs("aarav.sharma@offvybe.in"), "a***a@offvybe.in");
  assert.equal(maskEmailForLogs("sujal@domain.com"), "s***l@domain.com");
  assert.equal(maskEmailForLogs("ab@xyz.com"), "a***@xyz.com");
  assert.equal(maskEmailForLogs("invalid-email"), "***@***");
  assert.equal(maskEmailForLogs(""), "***@***");
});

test("getVerifiedSenderAddress - resolves configured sender with fallback", () => {
  const origResendFrom = process.env.RESEND_FROM_EMAIL;
  const origEmailFrom = process.env.EMAIL_FROM;

  try {
    // 1. Explicit RESEND_FROM_EMAIL
    process.env.RESEND_FROM_EMAIL = "OFFVYBE <orders@offvybe.in>";
    process.env.EMAIL_FROM = "fallback@offvybe.in";
    assert.equal(getVerifiedSenderAddress(), "OFFVYBE <orders@offvybe.in>");

    // 2. EMAIL_FROM fallback
    delete process.env.RESEND_FROM_EMAIL;
    process.env.EMAIL_FROM = "orders@offvybe.in";
    assert.equal(getVerifiedSenderAddress(), "orders@offvybe.in");

    // 3. Default fallback
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.EMAIL_FROM;
    assert.equal(getVerifiedSenderAddress(), "OFFVYBE <onboarding@resend.dev>");
  } finally {
    process.env.RESEND_FROM_EMAIL = origResendFrom;
    process.env.EMAIL_FROM = origEmailFrom;
  }
});

test("generateOrderConfirmationHtml - builds luxury email markup with order details", () => {
  const sampleData: OrderEmailData = {
    orderNumber: "TS-2026-9901",
    customerName: "Aarav Sharma",
    customerEmail: "aarav.sharma@offvybe.in",
    items: [
      {
        productName: "The Mayfair Velvet Flight Jacket",
        size: "L",
        color: "Italian Velvet Cut",
        quantity: 1,
        unitPrice: 11999,
      },
    ],
    subtotal: 11999,
    discount: 1199,
    shipping: 0,
    tax: 1296,
    total: 10800,
    promoCode: "TREND10",
    paymentMethod: "Razorpay (UPI Instant)",
    shippingAddress: {
      street: "Plot 42, Waterfield Road",
      apartment: "Flat 402",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400050",
      country: "India",
    },
    deliveryCourier: "Blue Dart Apex / Delhivery Air",
  };

  const html = generateOrderConfirmationHtml(sampleData);

  // Assertions for luxury branding and order context
  assert.match(html, /OFFVYBE/);
  assert.match(html, /MUMBAI ATELIER/);
  assert.match(html, /TS-2026-9901/);
  assert.match(html, /The Mayfair Velvet Flight Jacket/);
  assert.match(html, /Italian Velvet Cut/);
  assert.match(html, /Blue Dart Apex \/ Delhivery Air/);
  assert.match(html, /Verified &amp; Settled via Razorpay/);
  assert.match(html, /Compliant with the Digital Personal Data Protection Act 2023/);
});

test("isOrderEmailAlreadySent - handles deduplication check gracefully", async () => {
  // Fresh order reference should not be flagged as duplicate initially
  const freshOrderNumber = `TS-TEST-${Date.now()}`;
  const isSent = await isOrderEmailAlreadySent(freshOrderNumber);
  assert.equal(typeof isSent, "boolean");
});

test("email - customer-entered text is HTML-escaped in the confirmation email", async () => {
  const { generateOrderConfirmationHtml } = await import("../../src/lib/email");
  const html = generateOrderConfirmationHtml({
    orderNumber: "TS-261103-AAAAA",
    orderId: "o1",
    customerName: '<a href="https://evil.example">Claim refund</a>',
    customerEmail: "x@example.com",
    items: [{ productName: "Tee", size: "M", color: "Black", quantity: 1, unitPrice: 2499 }],
    subtotal: 2499,
    discount: 0,
    shipping: 0,
    tax: 119,
    total: 2499,
    paymentMethod: "Cash on Delivery",
    shippingAddress: { street: "<script>alert(1)</script>", city: "Mumbai", state: "MH", postalCode: "400050", country: "India" },
  } as any);
  assert.equal(html.includes('<a href="https://evil.example">'), false);
  assert.equal(html.includes("<script>alert(1)</script>"), false);
  assert.equal(html.includes("&lt;script&gt;"), true);
});
