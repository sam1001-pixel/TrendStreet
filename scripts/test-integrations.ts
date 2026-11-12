import { prisma } from "../src/lib/prisma";
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  getRazorpayEnvironment,
} from "../src/lib/razorpay";
import {
  maskEmailForLogs,
  getVerifiedSenderAddress,
  generateOrderConfirmationHtml,
  sendOrderConfirmationEmail,
} from "../src/lib/email";
import { getShippingProvider } from "../src/lib/shipping";
import crypto from "crypto";

async function runVerification() {
  console.log("=================================================");
  console.log("OFFVYBE — INTEGRATION VERIFICATION RUNNER");
  console.log("=================================================");

  // 1. DATABASE CONNECTIVITY
  console.log("\n[1/4] Testing MongoDB Atlas Database Connectivity...");
  try {
    const productCount = await prisma.product.count();
    const user = await prisma.user.findFirst({ select: { role: true, createdAt: true } });
    const settings = await prisma.siteSettings.findUnique({ where: { id: "global" } });

    console.log("  ✔ Database connection: SUCCESS");
    console.log(`  ✔ Active Products in Catalog: ${productCount}`);
    console.log(`  ✔ Seeded User Found: Role ${user?.role}`);
    console.log(`  ✔ Global Settings Store Name: '${settings?.storeName}'`);
  } catch (err: any) {
    console.log("  ✖ Database connection failed:", err.message);
  }


  // 2. PAYMENT SIGNATURE & GATEWAY SAFETY
  console.log("\n[2/4] Testing Razorpay Cryptographic Verification & Mode Gates...");
  try {
    const env = getRazorpayEnvironment();
    console.log(`  ✔ Razorpay Mode: ${env.isTestMode ? "TEST MODE (Sandbox)" : "LIVE MODE"}`);
    console.log(`  ✔ Live Payment Safety Gate: ${process.env.ALLOW_LIVE_PAYMENTS === "true" ? "ENABLED" : "BLOCKED (Safe)"}`);

    const testSecret = "unit_test_mock_secret_key_12345";
    const orderId = "order_test_98765";
    const paymentId = "pay_test_54321";

    // Valid signature simulation
    const validSignature = crypto
      .createHmac("sha256", testSecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const passResult = verifyRazorpayPaymentSignature({
      orderId,
      paymentId,
      signature: validSignature,
      secret: testSecret,
    });

    // Tampered signature simulation
    const failResult = verifyRazorpayPaymentSignature({
      orderId,
      paymentId: "pay_tampered_id",
      signature: validSignature,
      secret: testSecret,
    });

    console.log(`  ✔ Valid Signature Verification: ${passResult ? "PASSED (200 OK)" : "FAILED"}`);
    console.log(`  ✔ Tampered Signature Rejection: ${!failResult ? "PASSED (400 Rejected)" : "FAILED"}`);
  } catch (err: any) {
    console.log("  ✖ Payment verification check failed:", err.message);
  }

  // 3. EMAIL DELIVERY & SENDER CONFIGURATION
  console.log("\n[3/4] Testing Resend Transactional Email Engine & Delivery...");
  try {
    const sender = getVerifiedSenderAddress();
    console.log(`  ✔ Configured Verified Sender: ${sender}`);
    console.log(`  ✔ PII Masking: ${maskEmailForLogs("customer@trendstreet.in")}`);

    const testHtml = generateOrderConfirmationHtml({
      orderNumber: "TS-VERIFY-001",
      customerName: "Test Verification Customer",
      customerEmail: "delivered@resend.dev",
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
      shipping: 0,
      total: 11999,
      paymentMethod: "Razorpay (Test)",
      shippingAddress: {
        street: "42 Waterfield Road",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400050",
        country: "India",
      },
    });

    console.log(`  ✔ HTML Email Template Generation: ${testHtml.length > 500 ? "SUCCESS (" + testHtml.length + " bytes)" : "FAILED"}`);

    // Test live dispatch to Resend safe testing sink: "delivered@resend.dev"
    console.log("  Attempting API dispatch to Resend (delivered@resend.dev)...");
    const sendResult = await sendOrderConfirmationEmail({
      orderNumber: `TS-VERIFY-${Date.now()}`,
      customerName: "Test Verification Customer",
      customerEmail: "delivered@resend.dev",
      items: [
        {
          productName: "Heavyweight Boxy Tee",
          size: "M",
          color: "Deep Burgundy",
          quantity: 1,
          unitPrice: 2499,
        },
      ],
      subtotal: 2499,
      shipping: 0,
      total: 2499,
      paymentMethod: "Razorpay Test",
      shippingAddress: {
        street: "Bandra West",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400050",
        country: "India",
      },
    });

    if (sendResult.success) {
      console.log(`  ✔ Resend Email Delivery: SUCCESS (Message ID: ${sendResult.messageId || "delivered"})`);
    } else {
      console.log(`  ⚠ Resend Email Delivery: BLOCKED OR FAILED (${sendResult.error})`);
    }
  } catch (err: any) {
    console.log("  ⚠ Email test caught exception:", err.message);
  }

  // 4. SHIPPING & LOGISTICS (Shiprocket)
  console.log("\n[4/4] Testing Shipping Engine & Courier Serviceability...");
  try {
    const shipping = getShippingProvider();
    const hasLiveCreds = Boolean(
      process.env.SHIPROCKET_EMAIL &&
      process.env.SHIPROCKET_PASSWORD &&
      !process.env.SHIPROCKET_EMAIL.includes("replace_with")
    );

    console.log(`  ✔ Shipping Provider: ${shipping.providerName}`);
    console.log(`  ✔ Shiprocket Mode: ${hasLiveCreds ? "LIVE SHIPROCKET API" : "DETERMINISTIC SANDBOX MOCK"}`);
    console.log(`  ✔ Origin Pickup Hub PIN: ${process.env.SHIPROCKET_PICKUP_PINCODE || "400050"}`);
    console.log(`  ✔ Pickup Hub Nickname: ${process.env.SHIPROCKET_PICKUP_LOCATION || "Primary"}`);

    const serviceability = await shipping.checkServiceability({
      pickupPincode: process.env.SHIPROCKET_PICKUP_PINCODE || "400050",
      deliveryPincode: "110001", // New Delhi Central
      weightKg: 0.5,
      isCod: false,
      orderValuePaise: 249900,
    });

    console.log(`  ✔ Delivery Check (PIN 110001): ${serviceability.isServiceable ? "SERVICEABLE" : "UNSERVICEABLE"}`);
    console.log(`  ✔ Active Couriers Found: ${serviceability.availableCouriers.length}`);
    if (serviceability.cheapestCourier) {
      console.log(`  ✔ Recommended Courier: ${serviceability.cheapestCourier.courierName} (Est: ${serviceability.cheapestCourier.estimatedDeliveryDays} days)`);
    }
    console.log(`  ✔ Execution Mode: ${serviceability.isMock ? "Mock/Sandbox (Safe)" : "Live Shiprocket API"}`);
  } catch (err: any) {
    console.log("  ⚠ Shipping test caught exception:", err.message);
  }

  console.log("\n=================================================");
  console.log("VERIFICATION RUN COMPLETE");
  console.log("=================================================");
}

runVerification();
