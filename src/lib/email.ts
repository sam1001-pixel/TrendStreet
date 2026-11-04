/**
 * OFFVYBE — TRANSACTIONAL EMAIL SERVICE (RESEND)
 *
 * Handles order confirmation receipts, payment verification notifications,
 * and delivery updates using Resend's transactional email API.
 *
 * Security & Reliability Features:
 * - Configurable verified sender address (EMAIL_FROM / RESEND_FROM_EMAIL)
 * - Automatic deduplication via memory cache & database audit logs
 * - Graceful failure handling (payment/order flow never blocks on email failures)
 * - Strict PII redaction in logs (customer emails, addresses, phones are masked)
 */

// Shared client: a second PrismaClient here opened its own connection pool on every serverless instance.
import { prisma } from "./prisma";

// In-memory deduplication cache: Set<orderNumber> with 1-hour expiration
const inMemorySentOrders = new Map<string, number>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function pruneSentOrderCache() {
  const now = Date.now();
  inMemorySentOrders.forEach((timestamp, key) => {
    if (now - timestamp > CACHE_TTL_MS) {
      inMemorySentOrders.delete(key);
    }
  });
}

/**
 * Redacts an email address for safe operational logging without exposing PII.
 * Example: "aarav.sharma@offvybe.in" -> "a***a@offvybe.in"
 */
export function maskEmailForLogs(email: string): string {
  if (!email || !email.includes("@")) return "***@***";
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export interface EmailOrderItem {
  productName: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number; // In rupees or paise
  image?: string;
}

export interface OrderEmailData {
  orderNumber: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  items: EmailOrderItem[];
  subtotal: number;
  discount?: number;
  shipping: number;
  tax?: number;
  total: number;
  promoCode?: string;
  paymentMethod: string;
  paymentGatewayId?: string;
  shippingAddress: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  deliveryCourier?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  duplicate?: boolean;
  error?: string;
}

/**
 * Resolves the configured sender email address.
 * Prioritizes RESEND_FROM_EMAIL -> EMAIL_FROM -> "OFFVYBE <onboarding@resend.dev>".
 */
export function getVerifiedSenderAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    "OFFVYBE <onboarding@resend.dev>"
  );
}

/**
 * Checks if a confirmation email was already dispatched for this order.
 */
export async function isOrderEmailAlreadySent(orderNumber: string, orderId?: string): Promise<boolean> {
  pruneSentOrderCache();

  // 1. Check in-memory cache
  if (inMemorySentOrders.has(orderNumber) || (orderId && inMemorySentOrders.has(orderId))) {
    return true;
  }

  // 2. Check durable database audit logs
  try {
    const existingLog = await prisma.auditLog.findFirst({
      where: {
        action: "ORDER_CONFIRMATION_EMAIL_SENT",
        OR: [
          { entityId: orderNumber },
          ...(orderId ? [{ entityId: orderId }] : []),
        ],
      },
    });

    if (existingLog) {
      inMemorySentOrders.set(orderNumber, Date.now());
      if (orderId) inMemorySentOrders.set(orderId, Date.now());
      return true;
    }
  } catch (dbErr) {
    // Database check failure should not prevent proceeding
    if (process.env.NODE_ENV !== "test") {
      console.warn("[Email Deduplication Warning] Database check bypassed:", (dbErr as Error).message);
    }
  }

  return false;
}

/**
 * Generates the luxury HTML email markup for OFFVYBE.
 */
/** Escapes text for safe insertion into HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Returns a copy of the email data with every string field HTML-escaped (names and addresses are shopper input). */
function escapeEmailData<T>(value: T): T {
  if (typeof value === "string") return escapeHtml(value) as unknown as T;
  if (Array.isArray(value)) return value.map(escapeEmailData) as unknown as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, escapeEmailData(v)])) as T;
  }
  return value;
}

export function generateOrderConfirmationHtml(rawData: OrderEmailData): string {
  const data = escapeEmailData(rawData);
  const formattedTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(data.total);

  const formattedSubtotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(data.subtotal);

  const formattedShipping =
    data.shipping === 0
      ? "Complimentary Priority Courier"
      : new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(data.shipping);

  const itemsRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #E8DFD8; font-family: 'Helvetica Neue', Arial, sans-serif;">
        <strong style="color: #1A1615; font-size: 14px; display: block;">${item.productName}</strong>
        <span style="color: #6B6562; font-size: 12px;">Size: ${item.size || "M"} &bull; Shade: ${item.color || "Standard"} &bull; Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #E8DFD8; text-align: right; vertical-align: top; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1A1615; font-size: 14px; font-weight: 600;">
        ₹${(item.unitPrice * item.quantity).toLocaleString("en-IN")}
      </td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed — OFFVYBE</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E8DFD8; box-shadow: 0 4px 20px rgba(26,22,21,0.06);">
          
          <!-- Burgundy Atelier Banner -->
          <tr>
            <td style="background-color: #4A1216; padding: 32px 24px; text-align: center;">
              <span style="font-family: Georgia, serif; font-size: 26px; font-weight: bold; letter-spacing: 0.25em; color: #FFFFFF; text-transform: uppercase; display: block;">OFFVYBE</span>
              <span style="font-size: 10px; letter-spacing: 0.3em; color: #D4AF37; text-transform: uppercase; margin-top: 6px; display: block;">MUMBAI ATELIER &bull; ARCHITECTURAL MENSWEAR</span>
            </td>
          </tr>

          <!-- Confirmation Headline -->
          <tr>
            <td style="padding: 36px 32px 24px 32px; text-align: center; border-bottom: 1px solid #E8DFD8;">
              <span style="background-color: #FAF7F2; color: #4A1216; border: 1px solid #4A1216; font-size: 11px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 16px;">
                ALLOCATION SECURED &bull; VERIFIED PAYMENT
              </span>
              <h1 style="font-family: Georgia, serif; font-size: 24px; color: #1A1615; margin: 0 0 10px 0; font-weight: bold;">
                Order Confirmed
              </h1>
              <p style="font-size: 14px; color: #4A4644; margin: 0; line-height: 1.6;">
                Greetings ${data.customerName}, your bespoke menswear garment selection has been allocated and transferred to our Bandra West cutting floor.
              </p>
            </td>
          </tr>

          <!-- Order Reference Strip -->
          <tr>
            <td style="background-color: #FAF7F2; padding: 18px 32px; border-bottom: 1px solid #E8DFD8;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6B6562; display: block;">Order Reference</span>
                    <strong style="font-size: 15px; color: #1A1615; font-family: monospace;">${data.orderNumber}</strong>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6B6562; display: block;">Transit Logistics</span>
                    <strong style="font-size: 13px; color: #4A1216;">${data.deliveryCourier || "Blue Dart Apex / Delhivery Air"}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Garment Selection Table -->
          <tr>
            <td style="padding: 24px 32px;">
              <span style="font-size: 12px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase; color: #4A1216; display: block; margin-bottom: 12px;">
                Selected Garments
              </span>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                ${itemsRows}
              </table>
            </td>
          </tr>

          <!-- Pricing Breakdown -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 20px; border-radius: 8px; border: 1px solid #E8DFD8;">
                <tr>
                  <td style="font-size: 13px; color: #4A4644; padding-bottom: 6px;">Subtotal</td>
                  <td align="right" style="font-size: 13px; color: #1A1615; font-weight: 600; padding-bottom: 6px;">${formattedSubtotal}</td>
                </tr>
                ${
                  data.discount && data.discount > 0
                    ? `<tr>
                  <td style="font-size: 13px; color: #2E7D32; padding-bottom: 6px;">Atelier Privilege (${data.promoCode || "Privilege"})</td>
                  <td align="right" style="font-size: 13px; color: #2E7D32; font-weight: 600; padding-bottom: 6px;">-₹${data.discount.toLocaleString("en-IN")}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="font-size: 13px; color: #4A4644; padding-bottom: 6px;">Priority Logistics</td>
                  <td align="right" style="font-size: 13px; color: #2E7D32; font-weight: 600; padding-bottom: 6px;">${formattedShipping}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #6B6562; padding-bottom: 12px; border-bottom: 1px solid #E8DFD8;">Taxation</td>
                  <td align="right" style="font-size: 12px; color: #6B6562; padding-bottom: 12px; border-bottom: 1px solid #E8DFD8;">Included (GST)</td>
                </tr>
                <tr>
                  <td style="font-size: 16px; font-weight: bold; color: #1A1615; padding-top: 12px;">Total Paid</td>
                  <td align="right" style="font-size: 18px; font-weight: bold; color: #4A1216; padding-top: 12px;">${formattedTotal}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Address & Payment Confirmation -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="55%" style="vertical-align: top; padding-right: 16px;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6B6562; display: block; margin-bottom: 4px;">Atelier Handover Address</span>
                    <p style="font-size: 13px; color: #1A1615; line-height: 1.5; margin: 0;">
                      ${data.shippingAddress.street}<br>
                      ${data.shippingAddress.apartment ? `${data.shippingAddress.apartment}<br>` : ""}
                      ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
                      ${data.shippingAddress.country}
                    </p>
                  </td>
                  <td width="45%" style="vertical-align: top;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6B6562; display: block; margin-bottom: 4px;">Payment Method</span>
                    <strong style="font-size: 13px; color: #1A1615; text-transform: uppercase; display: block;">
                      ${data.paymentMethod}
                    </strong>
                    <span style="font-size: 11px; color: #2E7D32; display: block; margin-top: 4px;">
                      &#10003; Verified &amp; Settled via Razorpay
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dispatch Tracking CTA -->
          <tr>
            <td style="padding: 12px 32px 36px 32px; text-align: center;">
              <a href="https://offvybe.in/profile" style="background-color: #4A1216; color: #FAF7F2; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 12px; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase; display: inline-block;">
                Track Atelier Progress
              </a>
              <p style="font-size: 11px; color: #6B6562; margin-top: 14px; margin-bottom: 0;">
                Real-time tracking details and courier airway bill numbers will be dispatched via SMS upon handover.
              </p>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="background-color: #1A1615; padding: 28px 24px; text-align: center; color: #FAF7F2;">
              <p style="font-size: 12px; color: #D4AF37; margin: 0 0 6px 0; font-weight: 600;">
                OFFVYBE FLAGSHIP ATELIER
              </p>
              <p style="font-size: 11px; color: #E8DFD8; margin: 0 0 12px 0; line-height: 1.5;">
                42 Waterfield Road, Bandra West, Mumbai, Maharashtra 400050<br>
                Concierge Hotline: +91 98200 12345 &bull; concierge@offvybe.in
              </p>
              <p style="font-size: 10px; color: #8F8884; margin: 0; line-height: 1.4;">
                This communication is generated following verified electronic settlement. Compliant with the Digital Personal Data Protection Act 2023 (DPDP) and Consumer Protection (E-Commerce) Rules 2020.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Dispatches a transactional order confirmation email via Resend API.
 *
 * Designed for maximum resilience:
 * - Redacts PII in logs
 * - Enforces deduplication
 * - Never throws uncaught exceptions into checkout or payment handlers
 */
export async function sendOrderConfirmationEmail(
  data: OrderEmailData
): Promise<SendEmailResult> {
  const maskedEmail = maskEmailForLogs(data.customerEmail);

  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn("[Resend Email Warning] RESEND_API_KEY is not configured on server. Skipping email dispatch.");
      return { success: false, error: "RESEND_API_KEY is unconfigured." };
    }

    // 1. Prevent duplicate email dispatches
    const isDuplicate = await isOrderEmailAlreadySent(data.orderNumber, data.orderId);
    if (isDuplicate) {
      console.info(
        `[Resend Email Deduplication] Skipped duplicate confirmation email for Order: ${data.orderNumber} (Recipient: ${maskedEmail})`
      );
      return { success: true, duplicate: true };
    }

    const sender = getVerifiedSenderAddress();
    const subject = `Order Confirmed — OFFVYBE Allocation [${data.orderNumber}]`;
    const html = generateOrderConfirmationHtml(data);
    const textFallback = `Order Confirmed: ${data.orderNumber}\nTotal: ₹${data.total.toLocaleString("en-IN")}\nRecipient: ${data.customerName}\nStatus: Atelier Allocation Secured\nThank you for choosing OFFVYBE.`;

    // 2. Dispatch via Resend REST API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [data.customerEmail],
        subject,
        html,
        text: textFallback,
      }),
    });

    const resData = await response.json();

    if (!response.ok) {
      const errorMsg = resData?.message || resData?.error || `HTTP ${response.status}`;
      console.warn(
        `[Resend Email Error] Order: ${data.orderNumber}, Recipient: ${maskedEmail}, Cause: ${errorMsg}`
      );
      return { success: false, error: errorMsg };
    }

    const messageId = resData?.id;

    // 3. Mark in-memory cache and record audit log in database
    inMemorySentOrders.set(data.orderNumber, Date.now());
    if (data.orderId) inMemorySentOrders.set(data.orderId, Date.now());

    try {
      await prisma.auditLog.create({
        data: {
          action: "ORDER_CONFIRMATION_EMAIL_SENT",
          entityType: "Order",
          entityId: data.orderId || data.orderNumber,
          metadata: {
            orderNumber: data.orderNumber,
            messageId,
            sender,
            recipientMasked: maskedEmail,
            sentAt: new Date().toISOString(),
          },
        },
      });
    } catch (auditErr) {
      console.warn("[Resend Email Audit Warning] Could not persist audit log entry:", (auditErr as Error).message);
    }

    console.info(
      `[Resend Email Success] Dispatched confirmation for Order: ${data.orderNumber} to ${maskedEmail} (Message ID: ${messageId})`
    );

    return {
      success: true,
      messageId,
      duplicate: false,
    };
  } catch (error: any) {
    console.error(
      `[Resend Email Exception] Order: ${data.orderNumber}, Recipient: ${maskedEmail}, Error:`,
      error.message || error
    );
    return {
      success: false,
      error: error.message || "Unknown error during email dispatch.",
    };
  }
}
