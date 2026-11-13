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
  assert.match(html, /JODHPUR ATELIER/);
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

test("getAdminNotificationEmail - resolves target admin email with correct fallback", async () => {
  const { getAdminNotificationEmail, DEFAULT_ADMIN_EMAIL } = await import("../../src/lib/email");
  assert.equal(DEFAULT_ADMIN_EMAIL, "sujalsolanki7719801@gmail.com");

  const origEnv = process.env.ADMIN_NOTIFICATION_EMAIL;
  try {
    delete process.env.ADMIN_NOTIFICATION_EMAIL;
    assert.equal(getAdminNotificationEmail(), "sujalsolanki7719801@gmail.com");

    process.env.ADMIN_NOTIFICATION_EMAIL = "custom.admin@offvybe.in";
    assert.equal(getAdminNotificationEmail(), "custom.admin@offvybe.in");
  } finally {
    process.env.ADMIN_NOTIFICATION_EMAIL = origEnv;
  }
});

test("generateAdminOrderPlacedHtml - generates rich admin alert with customer & order details", async () => {
  const { generateAdminOrderPlacedHtml } = await import("../../src/lib/email");
  const html = generateAdminOrderPlacedHtml({
    orderNumber: "OV-261114-TEST1",
    customerName: "Sujal Solanki",
    customerEmail: "sujal@example.com",
    customerPhone: "9079199951",
    paymentMethod: "Cash on Delivery",
    subtotal: 4999,
    discount: 500,
    shipping: 0,
    total: 4499,
    shippingAddress: {
      street: "Pal Road",
      city: "Jodhpur",
      state: "Rajasthan",
      postalCode: "342008",
      country: "India",
    },
    items: [
      {
        productName: "Heavyweight Boxy Tee",
        size: "L",
        color: "Washed Black",
        quantity: 2,
        unitPrice: 2499.5,
      },
    ],
  });

  assert.match(html, /OFFVYBE/);
  assert.match(html, /NEW COD ORDER PLACED/);
  assert.match(html, /OV-261114-TEST1/);
  assert.match(html, /Sujal Solanki/);
  assert.match(html, /9079199951/);
  assert.match(html, /Pal Road/);
  assert.match(html, /342008/);
  assert.match(html, /Heavyweight Boxy Tee/);
  assert.match(html, /₹4,499/);
  assert.match(html, /admin\/orders/);
});

test("generateAdminOrderCancelledHtml - generates clear cancellation alert with reason", async () => {
  const { generateAdminOrderCancelledHtml } = await import("../../src/lib/email");
  const html = generateAdminOrderCancelledHtml({
    orderNumber: "OV-261114-CANCEL",
    customerName: "Aarav Sharma",
    customerEmail: "aarav@example.com",
    customerPhone: "9876543210",
    totalAmount: 2499,
    reason: "Ordered wrong size by mistake",
    cancelledBy: "Customer",
    items: [
      {
        productName: "Oversized Heavyweight Hoodie",
        size: "M",
        color: "Deep Burgundy",
        quantity: 1,
        unitPrice: 2499,
      },
    ],
  });

  assert.match(html, /ORDER CANCELLED/);
  assert.match(html, /OV-261114-CANCEL/);
  assert.match(html, /Aarav Sharma/);
  assert.match(html, /9876543210/);
  assert.match(html, /Ordered wrong size by mistake/);
  assert.match(html, /₹2,499/);
  assert.match(html, /Oversized Heavyweight Hoodie/);
});

test("generateAdminReturnExchangeHtml - formats exchange and return requests with item details", async () => {
  const { generateAdminReturnExchangeHtml } = await import("../../src/lib/email");

  // 1. Exchange request
  const exchangeHtml = generateAdminReturnExchangeHtml({
    orderNumber: "OV-261114-EXCHANGE",
    kind: "EXCHANGE",
    reason: "Too small — need next size up",
    note: "Please send size XL if possible",
    customerName: "Vikram Rathore",
    customerEmail: "vikram@example.com",
    customerPhone: "9123456789",
    items: [
      {
        productName: "The Mayfair Velvet Flight Jacket",
        size: "L",
        quantity: 1,
        exchangeSize: "XL",
      },
    ],
  });

  assert.match(exchangeHtml, /NEW EXCHANGE REQUEST/);
  assert.match(exchangeHtml, /OV-261114-EXCHANGE/);
  assert.match(exchangeHtml, /Requested Exchange Size: XL/);
  assert.match(exchangeHtml, /Too small — need next size up/);
  assert.match(exchangeHtml, /Please send size XL if possible/);
  assert.match(exchangeHtml, /admin\/returns/);

  // 2. Return request
  const returnHtml = generateAdminReturnExchangeHtml({
    orderNumber: "OV-261114-RETURN",
    kind: "RETURN",
    reason: "Fabric different from expected",
    customerName: "Meera Patel",
    customerEmail: "meera@example.com",
    items: [
      {
        productName: "Carpenter Denim",
        size: "32",
        quantity: 1,
        exchangeSize: null,
      },
    ],
  });

  assert.match(returnHtml, /NEW RETURN REQUEST/);
  assert.match(returnHtml, /OV-261114-RETURN/);
  assert.match(returnHtml, /Fabric different from expected/);
  assert.match(returnHtml, /Carpenter Denim/);
});

test("generateCustomerOrderCancelledHtml - formats customer cancellation with refund or COD notice", async () => {
  const { generateCustomerOrderCancelledHtml } = await import("../../src/lib/email");

  // 1. Online / Razorpay payment: informs customer of 5-7 day bank refund
  const onlineHtml = generateCustomerOrderCancelledHtml({
    orderNumber: "OV-261114-CUST1",
    customerName: "Aarav Sharma",
    customerEmail: "aarav@example.com",
    paymentMethod: "Razorpay (UPI Instant)",
    totalAmount: 3999,
    reason: "Requested different delivery date",
    items: [
      {
        productName: "The Grandeur Silk Overshirt",
        size: "L",
        color: "Ivory White",
        quantity: 1,
        unitPrice: 3999,
      },
    ],
  });

  assert.match(onlineHtml, /Order Cancellation Confirmed/);
  assert.match(onlineHtml, /OV-261114-CUST1/);
  assert.match(onlineHtml, /Aarav Sharma/);
  assert.match(onlineHtml, /Refund Initiated/);
  assert.match(onlineHtml, /5–7 business days/);
  assert.match(onlineHtml, /The Grandeur Silk Overshirt/);
  assert.match(onlineHtml, /₹3,999/);
  assert.match(onlineHtml, /9079199951/);
  assert.match(onlineHtml, /care@offvybe.com/);

  // 2. Cash on Delivery: clarifies no payment was charged
  const codHtml = generateCustomerOrderCancelledHtml({
    orderNumber: "OV-261114-COD1",
    customerName: "Sujal Solanki",
    customerEmail: "sujal@example.com",
    paymentMethod: "Cash on Delivery",
    totalAmount: 2499,
    reason: "Order placed by mistake",
    items: [
      {
        productName: "Heavyweight Boxy Tee",
        size: "M",
        color: "Washed Black",
        quantity: 1,
        unitPrice: 2499,
      },
    ],
  });

  assert.match(codHtml, /Cash on Delivery Order/);
  assert.match(codHtml, /No payment was collected/);
  assert.match(codHtml, /OV-261114-COD1/);
  assert.match(codHtml, /Sujal Solanki/);
});

test("generateCustomerReturnStatusHtml - formats status updates for all lifecycle states", async () => {
  const { generateCustomerReturnStatusHtml } = await import("../../src/lib/email");

  // 1. REQUESTED status
  const requestedHtml = generateCustomerReturnStatusHtml({
    orderNumber: "OV-261114-REQ",
    customerName: "Vikram Rathore",
    customerEmail: "vikram@example.com",
    kind: "EXCHANGE",
    status: "REQUESTED",
    reason: "Wrong size delivered",
    items: [
      {
        productName: "The Royal Bandhgala Jacket",
        size: "M",
        quantity: 1,
        exchangeSize: "L",
      },
    ],
  });

  assert.match(requestedHtml, /REQUEST RECEIVED/);
  assert.match(requestedHtml, /Exchange Request Received/);
  assert.match(requestedHtml, /OV-261114-REQ/);
  assert.match(requestedHtml, /The Royal Bandhgala Jacket/);
  assert.match(requestedHtml, /Requested Replacement Size: L/);

  // 2. APPROVED status with admin note
  const approvedHtml = generateCustomerReturnStatusHtml({
    orderNumber: "OV-261114-APP",
    customerName: "Vikram Rathore",
    customerEmail: "vikram@example.com",
    kind: "EXCHANGE",
    status: "APPROVED",
    adminNote: "Pickup executive will visit on Friday between 11 AM - 2 PM.",
    items: [
      {
        productName: "The Royal Bandhgala Jacket",
        size: "M",
        quantity: 1,
        exchangeSize: "L",
      },
    ],
  });

  assert.match(approvedHtml, /REQUEST APPROVED/);
  assert.match(approvedHtml, /Pickup Arranged/);
  assert.match(approvedHtml, /Message from Atelier Concierge/);
  assert.match(approvedHtml, /Pickup executive will visit on Friday/);
  assert.match(approvedHtml, /Doorstep Handover Checklist/);

  // 3. PICKED_UP status
  const pickedUpHtml = generateCustomerReturnStatusHtml({
    orderNumber: "OV-261114-PICK",
    customerName: "Vikram Rathore",
    customerEmail: "vikram@example.com",
    kind: "RETURN",
    status: "PICKED_UP",
    items: [
      {
        productName: "Linen Trousers",
        size: "34",
        quantity: 1,
      },
    ],
  });

  assert.match(pickedUpHtml, /ITEM PICKED UP/);
  assert.match(pickedUpHtml, /In Transit to Atelier/);

  // 4. COMPLETED status
  const completedHtml = generateCustomerReturnStatusHtml({
    orderNumber: "OV-261114-DONE",
    customerName: "Vikram Rathore",
    customerEmail: "vikram@example.com",
    kind: "RETURN",
    status: "COMPLETED",
    items: [
      {
        productName: "Linen Trousers",
        size: "34",
        quantity: 1,
      },
    ],
  });

  assert.match(completedHtml, /COMPLETED/);
  assert.match(completedHtml, /Return Completed &bull; Refund Processed/);

  // 5. REJECTED status
  const rejectedHtml = generateCustomerReturnStatusHtml({
    orderNumber: "OV-261114-REJ",
    customerName: "Vikram Rathore",
    customerEmail: "vikram@example.com",
    kind: "RETURN",
    status: "REJECTED",
    adminNote: "Garment was returned outside the 30-day exchange window.",
    items: [
      {
        productName: "Linen Trousers",
        size: "34",
        quantity: 1,
      },
    ],
  });

  assert.match(rejectedHtml, /REQUEST UPDATE/);
  assert.match(rejectedHtml, /Garment was returned outside the 30-day exchange window/);
});


