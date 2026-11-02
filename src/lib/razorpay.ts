import Razorpay from "razorpay";
import crypto from "crypto";

export interface RazorpayEnvironment {
  keyId: string;
  keySecret: string;
  isTestMode: boolean;
  isLiveMode: boolean;
}

/**
 * Validates Razorpay credentials and enforces strict safety barriers between
 * Test Mode and Live Mode. Live transactions are explicitly blocked unless
 * ALLOW_LIVE_PAYMENTS="true" is configured.
 */
export function getRazorpayEnvironment(): RazorpayEnvironment {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

  if (!keyId || !keySecret) {
    throw new Error(
      "[Razorpay Configuration Error] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing."
    );
  }

  const isTestMode = keyId.startsWith("rzp_test_");
  const isLiveMode = keyId.startsWith("rzp_live_");

  if (!isTestMode && !isLiveMode) {
    console.warn(
      `[Razorpay Warning] Unrecognized key prefix for key: ${keyId.substring(0, 8)}... Expecting rzp_test_ or rzp_live_.`
    );
  }

  // Safety Gate: Block live transactions unless explicitly approved by environment flag
  const isLiveApproved = process.env.ALLOW_LIVE_PAYMENTS === "true";
  if (isLiveMode && !isLiveApproved) {
    throw new Error(
      "[Razorpay Safety Barrier] Live Razorpay credentials (rzp_live_...) detected, but live payments are NOT explicitly authorized. Refusing to process transactions."
    );
  }

  return {
    keyId,
    keySecret,
    isTestMode,
    isLiveMode,
  };
}

let razorpayClient: Razorpay | null = null;

/**
 * Returns a configured Razorpay server SDK client instance.
 */
export function getRazorpayClient(): Razorpay {
  if (razorpayClient) return razorpayClient;

  const env = getRazorpayEnvironment();
  razorpayClient = new Razorpay({
    key_id: env.keyId,
    key_secret: env.keySecret,
  });

  return razorpayClient;
}

export interface CreateOrderParams {
  amountMinor: number; // In paise (e.g., 249900 for ₹2,499)
  currency?: string;   // Defaults to "INR"
  receipt: string;     // Unique merchant order reference
  notes?: Record<string, string>;
}

/**
 * Creates a server-side Razorpay Order.
 */
export async function createRazorpayOrder({
  amountMinor,
  currency = "INR",
  receipt,
  notes = {},
}: CreateOrderParams) {
  const client = getRazorpayClient();
  const env = getRazorpayEnvironment();

  if (amountMinor <= 0) {
    throw new Error("Order amount must be greater than zero.");
  }

  const orderOptions = {
    amount: Math.round(amountMinor),
    currency,
    receipt: receipt.slice(0, 40), // Razorpay receipt max 40 chars
    notes: {
      ...notes,
      environment: env.isTestMode ? "test" : "live",
      platform: "Trend Street Atelier",
    },
  };

  const razorpayOrder = await client.orders.create(orderOptions);

  return {
    order: razorpayOrder,
    keyId: env.keyId,
    isTestMode: env.isTestMode,
  };
}

export interface VerifyPaymentSignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
  secret?: string;
}

/**
 * Cryptographically verifies Razorpay payment signature from client checkout modal
 * using constant-time HMAC-SHA256 comparison to prevent timing side-channel attacks.
 *
 * Signature format: HMAC_SHA256(orderId + "|" + paymentId, secret)
 */
export function verifyRazorpayPaymentSignature({
  orderId,
  paymentId,
  signature,
  secret,
}: VerifyPaymentSignatureParams): boolean {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const envSecret = secret || process.env.RAZORPAY_KEY_SECRET;
  if (!envSecret) {
    console.error("[Razorpay Signature Error] RAZORPAY_KEY_SECRET is unset.");
    return false;
  }

  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", envSecret)
    .update(payload)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

export interface VerifyWebhookSignatureParams {
  rawBody: string;
  signature: string;
  secret?: string;
}

/**
 * Cryptographically verifies Razorpay webhook payload signature from x-razorpay-signature
 * header using constant-time comparison.
 */
export function verifyRazorpayWebhookSignature({
  rawBody,
  signature,
  secret,
}: VerifyWebhookSignatureParams): boolean {
  if (!rawBody || !signature) {
    return false;
  }

  // The webhook secret is the one set in the Razorpay dashboard for this webhook — never the API key secret.
  const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Razorpay Webhook Error] Webhook secret is unconfigured.");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(signature.trim(), "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
