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

export const DEFAULT_ADMIN_EMAIL = "sujalsolanki7719801@gmail.com";

/**
 * Resolves the administrator notification destination.
 * Defaults to sujalsolanki7719801@gmail.com.
 */
export function getAdminNotificationEmail(): string {
  const envEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  if (envEmail && envEmail.includes("@")) return envEmail;
  return DEFAULT_ADMIN_EMAIL;
}

/**
 * Resolves a valid Resend API key, ignoring placeholder values.
 */
export function getResendApiKey(): string | undefined {
  const key = process.env.RESEND_API_KEY?.trim();
  if (key && !key.includes("replace_with")) return key;
  return undefined;
}

export interface AdminOrderPlacedData extends OrderEmailData {
  customerPhone?: string;
  orderCreatedAt?: Date | string;
}

export interface AdminOrderCancelledData {
  orderNumber: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  reason?: string;
  totalAmount: number; // In rupees
  paymentMethod?: string;
  cancelledAt?: Date | string;
  cancelledBy?: "Customer" | "Admin / Store";
  items?: Array<{
    productName: string;
    size?: string;
    color?: string;
    quantity: number;
    unitPrice?: number;
  }>;
}

export interface AdminReturnExchangeData {
  orderNumber: string;
  orderId?: string;
  kind: "EXCHANGE" | "RETURN";
  reason: string;
  note?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  items: Array<{
    productName: string;
    size: string;
    quantity: number;
    exchangeSize?: string | null;
  }>;
  createdAt?: Date | string;
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
<body style="margin: 0; padding: 0; background-color: #FDFBF7; font-family: 'Montserrat', 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FDFBF7; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139, 30, 63, 0.15); box-shadow: 0 10px 30px rgba(30, 27, 24, 0.08);">
          
          <!-- Burgundy Atelier Banner -->
          <tr>
            <td style="background-color: #8B1E3F; padding: 36px 24px; text-align: center; border-bottom: 2px solid #D4AF37;">
              <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 800; letter-spacing: 0.28em; color: #FDFBF7; text-transform: uppercase; display: block;">OFFVYBE</span>
              <span style="font-size: 10px; letter-spacing: 0.35em; color: #D4AF37; text-transform: uppercase; margin-top: 8px; display: block; font-weight: 600;">JODHPUR ATELIER &bull; ARCHITECTURAL MENSWEAR</span>
            </td>
          </tr>

          <!-- Confirmation Headline -->
          <tr>
            <td style="padding: 36px 32px 24px 32px; text-align: center; border-bottom: 1px solid #EFEAE4;">
              <span style="background-color: #FDFBF7; color: #8B1E3F; border: 1px solid #D4AF37; font-size: 10px; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase; padding: 5px 14px; border-radius: 20px; display: inline-block; margin-bottom: 18px;">
                ALLOCATION SECURED &bull; VERIFIED PAYMENT
              </span>
              <h1 style="font-family: Georgia, serif; font-size: 26px; color: #1E1B18; margin: 0 0 10px 0; font-weight: bold;">
                Order Confirmed
              </h1>
              <p style="font-size: 14px; color: #4A4644; margin: 0; line-height: 1.6;">
                Greetings ${data.customerName}, your bespoke menswear garment selection has been allocated and transferred to our Jodhpur cutting floor.
              </p>
            </td>
          </tr>

          <!-- Order Reference Strip -->
          <tr>
            <td style="background-color: #FDFBF7; padding: 20px 32px; border-bottom: 1px solid #EFEAE4;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #6B6562; display: block;">Order Reference</span>
                    <strong style="font-size: 16px; color: #1E1B18; font-family: monospace;">${data.orderNumber}</strong>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #6B6562; display: block;">Transit Logistics</span>
                    <strong style="font-size: 13px; color: #8B1E3F; font-weight: 700;">${data.deliveryCourier || "Blue Dart Apex / Delhivery Air"}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Garment Selection Table -->
          <tr>
            <td style="padding: 24px 32px;">
              <span style="font-size: 12px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase; color: #8B1E3F; display: block; margin-bottom: 12px;">
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
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FDFBF7; padding: 20px; border-radius: 12px; border: 1px solid #EFEAE4;">
                <tr>
                  <td style="font-size: 13px; color: #4A4644; padding-bottom: 6px;">Subtotal</td>
                  <td align="right" style="font-size: 13px; color: #1E1B18; font-weight: 600; padding-bottom: 6px;">${formattedSubtotal}</td>
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
                  <td style="font-size: 13px; color: #6B6562; padding-bottom: 12px; border-bottom: 1px solid #EFEAE4;">Taxation</td>
                  <td align="right" style="font-size: 12px; color: #6B6562; padding-bottom: 12px; border-bottom: 1px solid #EFEAE4;">Included (GST)</td>
                </tr>
                <tr>
                  <td style="font-size: 16px; font-weight: bold; color: #1E1B18; padding-top: 12px;">Total Paid</td>
                  <td align="right" style="font-size: 18px; font-weight: bold; color: #8B1E3F; padding-top: 12px;">${formattedTotal}</td>
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
                    <p style="font-size: 13px; color: #1E1B18; line-height: 1.5; margin: 0;">
                      ${data.shippingAddress.street}<br>
                      ${data.shippingAddress.apartment ? `${data.shippingAddress.apartment}<br>` : ""}
                      ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
                      ${data.shippingAddress.country}
                    </p>
                  </td>
                  <td width="45%" style="vertical-align: top;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6B6562; display: block; margin-bottom: 4px;">Payment Method</span>
                    <strong style="font-size: 13px; color: #1E1B18; text-transform: uppercase; display: block;">
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
              <a href="https://offvybe.com/profile" style="background-color: #8B1E3F; color: #FDFBF7; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-size: 12px; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase; display: inline-block; border: 1px solid #D4AF37;">
                Track Atelier Progress
              </a>
              <p style="font-size: 11px; color: #6B6562; margin-top: 14px; margin-bottom: 0;">
                Real-time tracking details and courier airway bill numbers will be dispatched via SMS upon handover.
              </p>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="background-color: #1E1B18; padding: 28px 24px; text-align: center; color: #FDFBF7;">
              <p style="font-size: 12px; color: #D4AF37; margin: 0 0 6px 0; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase;">
                OFFVYBE FLAGSHIP ATELIER
              </p>
              <p style="font-size: 11px; color: #E8DFD8; margin: 0 0 12px 0; line-height: 1.5;">
                OFFVYBE, Pal Road, Jodhpur, Rajasthan 342008<br>
                Concierge Hotline: +91 90791 99951 &bull; concierge@offvybe.in
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
    const apiKey = getResendApiKey();

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
    let activeSender = sender;
    let response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: activeSender,
        to: [data.customerEmail],
        subject,
        html,
        text: textFallback,
      }),
    });

    let resData = await response.json();

    // Auto-fallback if the custom domain (e.g. offvybe.com) is not yet verified in Resend
    if (
      !response.ok &&
      response.status === 403 &&
      activeSender !== "OFFVYBE <onboarding@resend.dev>" &&
      (resData?.message?.includes("not verified") || resData?.message?.includes("domain"))
    ) {
      console.warn(
        `[Resend Email Sender Fallback] Sender ${activeSender} domain is not verified yet. Retrying via OFFVYBE <onboarding@resend.dev>...`
      );
      activeSender = "OFFVYBE <onboarding@resend.dev>";
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: activeSender,
          to: [data.customerEmail],
          subject,
          html,
          text: textFallback,
        }),
      });
      resData = await response.json();
    }

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

// ----------------------------------------------------------------------------
// ADMIN NOTIFICATION DISPATCH ENGINE (TARGET: sujalsolanki7719801@gmail.com)
// ----------------------------------------------------------------------------

const inMemorySentAdminAlerts = new Map<string, number>();

function isDuplicateAdminAlert(key: string): boolean {
  pruneSentOrderCache();
  const now = Date.now();
  const prev = inMemorySentAdminAlerts.get(key);
  if (prev && now - prev < CACHE_TTL_MS) {
    return true;
  }
  inMemorySentAdminAlerts.set(key, now);
  return false;
}

/** Internal resilient dispatcher for Resend with auto-retry on unverified domains. */
async function dispatchResendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  logTag: string;
  referenceId?: string;
}): Promise<SendEmailResult> {
  const apiKey = getResendApiKey();
  const recipientList = Array.isArray(options.to) ? options.to : [options.to];
  const maskedRecipients = recipientList.map(maskEmailForLogs).join(", ");

  if (!apiKey) {
    console.warn(`[${options.logTag} Warning] RESEND_API_KEY is not configured on server. Skipping dispatch.`);
    return { success: false, error: "RESEND_API_KEY is unconfigured." };
  }

  let activeSender = getVerifiedSenderAddress();
  try {
    let response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: activeSender,
        to: recipientList,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    let resData = await response.json();

    // Auto-fallback if the custom domain (e.g. offvybe.com) is not yet verified in Resend
    if (
      !response.ok &&
      response.status === 403 &&
      activeSender !== "OFFVYBE <onboarding@resend.dev>" &&
      (resData?.message?.includes("not verified") || resData?.message?.includes("domain"))
    ) {
      console.warn(
        `[${options.logTag} Sender Fallback] Sender ${activeSender} domain is not verified yet. Retrying via OFFVYBE <onboarding@resend.dev>...`
      );
      activeSender = "OFFVYBE <onboarding@resend.dev>";
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: activeSender,
          to: recipientList,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });
      resData = await response.json();
    }

    if (!response.ok) {
      const errorMsg = resData?.message || resData?.error || `HTTP ${response.status}`;
      console.warn(`[${options.logTag} Error] Ref: ${options.referenceId || "N/A"}, To: ${maskedRecipients}, Cause: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }

    const messageId = resData?.id;
    console.info(`[${options.logTag} Success] Dispatched to ${maskedRecipients} (Message ID: ${messageId})`);
    return { success: true, messageId, duplicate: false };
  } catch (error: any) {
    console.error(`[${options.logTag} Exception] Ref: ${options.referenceId || "N/A"}, To: ${maskedRecipients}, Error:`, error.message || error);
    return { success: false, error: error.message || "Unknown error during email dispatch." };
  }
}

/** Generates high-contrast HTML notification for admin when an order is placed. */
export function generateAdminOrderPlacedHtml(rawData: AdminOrderPlacedData): string {
  const data = escapeEmailData(rawData);
  const formattedTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rawData.total);

  const formattedSubtotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rawData.subtotal);

  const formattedDate = rawData.orderCreatedAt
    ? new Date(rawData.orderCreatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

  const isCod = data.paymentMethod?.toLowerCase().includes("cash") || data.paymentMethod?.toLowerCase().includes("cod");

  const itemsRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #E8DFD8; font-family: 'Helvetica Neue', Arial, sans-serif;">
        <strong style="color: #1A1615; font-size: 14px; display: block;">${item.productName}</strong>
        <span style="color: #6B6562; font-size: 12px;">Size: ${item.size || "Standard"} &bull; Color: ${item.color || "Standard"} &bull; Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #E8DFD8; text-align: right; vertical-align: top; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1A1615; font-size: 14px; font-weight: 600;">
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
  <title>New Order Alert — OFFVYBE</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F6F0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #E5DFD7; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #1A1615; padding: 24px; text-align: center; border-bottom: 3px solid #D4AF37;">
              <span style="font-family: Georgia, serif; font-size: 22px; font-weight: 800; letter-spacing: 0.25em; color: #FFFFFF; text-transform: uppercase; display: block;">OFFVYBE</span>
              <span style="font-size: 11px; letter-spacing: 0.2em; color: #D4AF37; text-transform: uppercase; margin-top: 6px; display: block; font-weight: 600;">ADMIN OPERATIONS DISPATCH</span>
            </td>
          </tr>

          <!-- Alert Badge & Headline -->
          <tr>
            <td style="padding: 28px 28px 20px 28px; text-align: center; border-bottom: 1px solid #F0EBE5;">
              <span style="background-color: ${isCod ? "#FFF3E0" : "#E8F5E9"}; color: ${isCod ? "#E65100" : "#2E7D32"}; border: 1px solid ${isCod ? "#FFE0B2" : "#C8E6C9"}; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; display: inline-block; margin-bottom: 12px;">
                ${isCod ? "🚨 NEW COD ORDER PLACED" : "✅ NEW PAID ORDER RECEIVED"}
              </span>
              <h1 style="font-size: 24px; color: #1A1615; margin: 0 0 6px 0; font-weight: 700;">
                Order ${data.orderNumber}
              </h1>
              <p style="font-size: 13px; color: #6B6562; margin: 0;">
                Placed on ${formattedDate} IST
              </p>
            </td>
          </tr>

          <!-- Summary Highlights -->
          <tr>
            <td style="padding: 20px 28px; background-color: #FDFBF7; border-bottom: 1px solid #F0EBE5;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 12px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #8F8884; letter-spacing: 0.1em; display: block;">Total Amount</span>
                    <strong style="font-size: 22px; color: #8B1E3F; font-weight: 800;">${formattedTotal}</strong>
                  </td>
                  <td width="50%" style="vertical-align: top;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #8F8884; letter-spacing: 0.1em; display: block;">Payment Mode</span>
                    <strong style="font-size: 14px; color: #1A1615; display: block; margin-top: 4px;">${data.paymentMethod}</strong>
                    <span style="font-size: 11px; color: ${isCod ? "#E65100" : "#2E7D32"}; font-weight: 600;">
                      ${isCod ? "Payment to collect at delivery" : "Prepaid & Settled via Razorpay"}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer & Delivery Information -->
          <tr>
            <td style="padding: 24px 28px; border-bottom: 1px solid #F0EBE5;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 14px;">
                    <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B1E3F; display: block; margin-bottom: 8px;">Customer Contact</strong>
                    <p style="font-size: 13px; color: #1A1615; line-height: 1.6; margin: 0;">
                      <strong>${data.customerName}</strong><br>
                      <a href="mailto:${data.customerEmail}" style="color: #8B1E3F; text-decoration: underline;">${data.customerEmail}</a><br>
                      ${data.customerPhone ? `<a href="tel:${data.customerPhone}" style="color: #1A1615; text-decoration: none;">📞 ${data.customerPhone}</a>` : '<span style="color: #8F8884;">Phone not provided</span>'}
                    </p>
                  </td>
                  <td width="50%" style="vertical-align: top;">
                    <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B1E3F; display: block; margin-bottom: 8px;">Delivery Address</strong>
                    <p style="font-size: 13px; color: #1A1615; line-height: 1.5; margin: 0;">
                      ${data.shippingAddress.street}<br>
                      ${data.shippingAddress.apartment ? `${data.shippingAddress.apartment}<br>` : ""}
                      ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
                      ${data.shippingAddress.country}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Ordered Items Breakdown -->
          <tr>
            <td style="padding: 24px 28px;">
              <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B1E3F; display: block; margin-bottom: 12px;">
                Ordered Garments (${data.items.reduce((s, it) => s + it.quantity, 0)} pieces)
              </strong>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                ${itemsRows}
              </table>
            </td>
          </tr>

          <!-- Price Calculation Strip -->
          <tr>
            <td style="padding: 0 28px 24px 28px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FDFBF7; padding: 16px; border-radius: 8px; border: 1px solid #F0EBE5;">
                <tr>
                  <td style="font-size: 12px; color: #6B6562; padding-bottom: 4px;">Subtotal</td>
                  <td align="right" style="font-size: 12px; color: #1A1615; font-weight: 600; padding-bottom: 4px;">${formattedSubtotal}</td>
                </tr>
                ${data.discount && data.discount > 0 ? `
                <tr>
                  <td style="font-size: 12px; color: #2E7D32; padding-bottom: 4px;">Discount ${data.promoCode ? `(${data.promoCode})` : ""}</td>
                  <td align="right" style="font-size: 12px; color: #2E7D32; font-weight: 600; padding-bottom: 4px;">-₹${data.discount.toLocaleString("en-IN")}</td>
                </tr>` : ""}
                <tr>
                  <td style="font-size: 12px; color: #6B6562; padding-bottom: 4px;">Shipping</td>
                  <td align="right" style="font-size: 12px; color: #1A1615; font-weight: 600; padding-bottom: 4px;">${data.shipping === 0 ? "FREE" : `₹${data.shipping.toLocaleString("en-IN")}`}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; font-weight: 700; color: #1A1615; padding-top: 8px; border-top: 1px solid #E5DFD7;">Grand Total</td>
                  <td align="right" style="font-size: 16px; font-weight: 800; color: #8B1E3F; padding-top: 8px; border-top: 1px solid #E5DFD7;">${formattedTotal}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Admin Portal Link CTA -->
          <tr>
            <td style="padding: 0 28px 28px 28px; text-align: center;">
              <a href="https://offvybe.com/admin/orders" style="background-color: #8B1E3F; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 12px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; display: inline-block;">
                Open Admin Orders Dashboard &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F6F0; padding: 18px 24px; text-align: center; border-top: 1px solid #E5DFD7; font-size: 11px; color: #8F8884;">
              OFFVYBE Operations Dispatch &bull; Automated notification for Sujal Solanki (Admin)<br>
              Hostinger Production Server &bull; Jodhpur, Rajasthan
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

/** Generates high-contrast HTML notification for admin when an order is cancelled. */
export function generateAdminOrderCancelledHtml(rawData: AdminOrderCancelledData): string {
  const data = escapeEmailData(rawData);
  const formattedTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rawData.totalAmount);

  const formattedDate = rawData.cancelledAt
    ? new Date(rawData.cancelledAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

  const itemsRows = (data.items || [])
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #E8DFD8; font-family: 'Helvetica Neue', Arial, sans-serif;">
        <strong style="color: #1A1615; font-size: 13px; display: block;">${item.productName}</strong>
        <span style="color: #6B6562; font-size: 12px;">Size: ${item.size || "Standard"} &bull; Color: ${item.color || "Standard"} &bull; Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #E8DFD8; text-align: right; vertical-align: top; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1A1615; font-size: 13px; font-weight: 600;">
        ${item.unitPrice ? `₹${(item.unitPrice * item.quantity).toLocaleString("en-IN")}` : `Qty: ${item.quantity}`}
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
  <title>Order Cancelled — OFFVYBE</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F6F0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #E5DFD7; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #1A1615; padding: 24px; text-align: center; border-bottom: 3px solid #C62828;">
              <span style="font-family: Georgia, serif; font-size: 22px; font-weight: 800; letter-spacing: 0.25em; color: #FFFFFF; text-transform: uppercase; display: block;">OFFVYBE</span>
              <span style="font-size: 11px; letter-spacing: 0.2em; color: #EF5350; text-transform: uppercase; margin-top: 6px; display: block; font-weight: 600;">ADMIN OPERATIONS ALERT</span>
            </td>
          </tr>

          <!-- Alert Badge & Headline -->
          <tr>
            <td style="padding: 28px 28px 20px 28px; text-align: center; border-bottom: 1px solid #F0EBE5;">
              <span style="background-color: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; display: inline-block; margin-bottom: 12px;">
                ⚠️ ORDER CANCELLED
              </span>
              <h1 style="font-size: 24px; color: #1A1615; margin: 0 0 6px 0; font-weight: 700;">
                Order ${data.orderNumber}
              </h1>
              <p style="font-size: 13px; color: #6B6562; margin: 0;">
                Cancelled on ${formattedDate} IST
              </p>
            </td>
          </tr>

          <!-- Cancellation Details Card -->
          <tr>
            <td style="padding: 20px 28px; background-color: #FDFBF7; border-bottom: 1px solid #F0EBE5;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 12px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #8F8884; letter-spacing: 0.1em; display: block;">Cancelled Value</span>
                    <strong style="font-size: 20px; color: #C62828; font-weight: 800;">${formattedTotal}</strong>
                  </td>
                  <td width="50%" style="vertical-align: top;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #8F8884; letter-spacing: 0.1em; display: block;">Cancelled By</span>
                    <strong style="font-size: 13px; color: #1A1615; display: block; margin-top: 2px;">${data.cancelledBy || "Customer"}</strong>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 14px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #8F8884; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">Reason Given</span>
                    <div style="background-color: #FFFFFF; padding: 12px; border-radius: 6px; border: 1px solid #E5DFD7; font-size: 13px; color: #1A1615; font-style: italic;">
                      &ldquo;${data.reason || "No specific reason provided"}&rdquo;
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Contact Details -->
          <tr>
            <td style="padding: 20px 28px; border-bottom: 1px solid #F0EBE5;">
              <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B1E3F; display: block; margin-bottom: 8px;">Customer Information</strong>
              <p style="font-size: 13px; color: #1A1615; line-height: 1.6; margin: 0;">
                <strong>${data.customerName}</strong><br>
                Email: <a href="mailto:${data.customerEmail}" style="color: #8B1E3F; text-decoration: underline;">${data.customerEmail}</a><br>
                ${data.customerPhone ? `Phone: <a href="tel:${data.customerPhone}" style="color: #1A1615;">📞 ${data.customerPhone}</a>` : ""}
              </p>
            </td>
          </tr>

          ${itemsRows ? `
          <!-- Cancelled Garments -->
          <tr>
            <td style="padding: 20px 28px;">
              <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B1E3F; display: block; margin-bottom: 10px;">
                Garments Released Back to Inventory
              </strong>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                ${itemsRows}
              </table>
            </td>
          </tr>
          ` : ""}

          <!-- Admin Portal Link CTA -->
          <tr>
            <td style="padding: 10px 28px 28px 28px; text-align: center;">
              <a href="https://offvybe.com/admin/orders" style="background-color: #1A1615; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 12px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; display: inline-block;">
                Manage Order in Admin &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F6F0; padding: 18px 24px; text-align: center; border-top: 1px solid #E5DFD7; font-size: 11px; color: #8F8884;">
              OFFVYBE Operations Dispatch &bull; Automated notification for Sujal Solanki (Admin)<br>
              Hostinger Production Server &bull; Jodhpur, Rajasthan
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

/** Generates high-contrast HTML notification for admin when an exchange or return is requested. */
export function generateAdminReturnExchangeHtml(rawData: AdminReturnExchangeData): string {
  const data = escapeEmailData(rawData);
  const isExchange = data.kind === "EXCHANGE";

  const formattedDate = rawData.createdAt
    ? new Date(rawData.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

  const itemsRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #E8DFD8; font-family: 'Helvetica Neue', Arial, sans-serif;">
        <strong style="color: #1A1615; font-size: 13px; display: block;">${item.productName}</strong>
        <span style="color: #6B6562; font-size: 12px;">Original Size: <strong>${item.size}</strong> &bull; Qty: ${item.quantity}</span>
        ${isExchange && item.exchangeSize ? `
        <div style="margin-top: 4px;">
          <span style="background-color: #E8F5E9; color: #2E7D32; border: 1px solid #C8E6C9; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">
            ⇄ Requested Exchange Size: ${item.exchangeSize}
          </span>
        </div>` : ""}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #E8DFD8; text-align: right; vertical-align: top; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1A1615; font-size: 13px; font-weight: 600;">
        Qty: ${item.quantity}
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
  <title>${isExchange ? "Exchange Request" : "Return Request"} — OFFVYBE</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F6F0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #E5DFD7; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #1A1615; padding: 24px; text-align: center; border-bottom: 3px solid ${isExchange ? "#1976D2" : "#E65100"};">
              <span style="font-family: Georgia, serif; font-size: 22px; font-weight: 800; letter-spacing: 0.25em; color: #FFFFFF; text-transform: uppercase; display: block;">OFFVYBE</span>
              <span style="font-size: 11px; letter-spacing: 0.2em; color: ${isExchange ? "#90CAF9" : "#FFB74D"}; text-transform: uppercase; margin-top: 6px; display: block; font-weight: 600;">AFTER-SALES &amp; REVERSE LOGISTICS</span>
            </td>
          </tr>

          <!-- Alert Badge & Headline -->
          <tr>
            <td style="padding: 28px 28px 20px 28px; text-align: center; border-bottom: 1px solid #F0EBE5;">
              <span style="background-color: ${isExchange ? "#E3F2FD" : "#FFF3E0"}; color: ${isExchange ? "#1565C0" : "#E65100"}; border: 1px solid ${isExchange ? "#BBDEFB" : "#FFE0B2"}; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; display: inline-block; margin-bottom: 12px;">
                ${isExchange ? "🔄 NEW EXCHANGE REQUEST" : "↩️ NEW RETURN REQUEST"}
              </span>
              <h1 style="font-size: 24px; color: #1A1615; margin: 0 0 6px 0; font-weight: 700;">
                Order ${data.orderNumber}
              </h1>
              <p style="font-size: 13px; color: #6B6562; margin: 0;">
                Submitted on ${formattedDate} IST
              </p>
            </td>
          </tr>

          <!-- Request Reason & Notes -->
          <tr>
            <td style="padding: 20px 28px; background-color: #FDFBF7; border-bottom: 1px solid #F0EBE5;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 12px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #8F8884; letter-spacing: 0.1em; display: block;">Request Type</span>
                    <strong style="font-size: 15px; color: ${isExchange ? "#1565C0" : "#E65100"}; font-weight: 700;">
                      ${isExchange ? "Exchange (Size / Fit)" : "Return (Refund)"}
                    </strong>
                  </td>
                  <td width="50%" style="vertical-align: top;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #8F8884; letter-spacing: 0.1em; display: block;">Customer Reason</span>
                    <strong style="font-size: 13px; color: #1A1615; display: block; margin-top: 2px;">${data.reason}</strong>
                  </td>
                </tr>
                ${data.note ? `
                <tr>
                  <td colspan="2" style="padding-top: 14px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #8F8884; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">Customer Note</span>
                    <div style="background-color: #FFFFFF; padding: 12px; border-radius: 6px; border: 1px solid #E5DFD7; font-size: 13px; color: #1A1615; font-style: italic;">
                      &ldquo;${data.note}&rdquo;
                    </div>
                  </td>
                </tr>` : ""}
              </table>
            </td>
          </tr>

          <!-- Customer & Pickup Address -->
          <tr>
            <td style="padding: 20px 28px; border-bottom: 1px solid #F0EBE5;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 14px;">
                    <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B1E3F; display: block; margin-bottom: 8px;">Customer Information</strong>
                    <p style="font-size: 13px; color: #1A1615; line-height: 1.6; margin: 0;">
                      <strong>${data.customerName}</strong><br>
                      Email: <a href="mailto:${data.customerEmail}" style="color: #8B1E3F; text-decoration: underline;">${data.customerEmail}</a><br>
                      ${data.customerPhone ? `Phone: <a href="tel:${data.customerPhone}" style="color: #1A1615;">📞 ${data.customerPhone}</a>` : ""}
                    </p>
                  </td>
                  ${data.shippingAddress ? `
                  <td width="50%" style="vertical-align: top;">
                    <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B1E3F; display: block; margin-bottom: 8px;">Pickup Address</strong>
                    <p style="font-size: 13px; color: #1A1615; line-height: 1.5; margin: 0;">
                      ${data.shippingAddress.street}<br>
                      ${data.shippingAddress.apartment ? `${data.shippingAddress.apartment}<br>` : ""}
                      ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}
                    </p>
                  </td>` : ""}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items to Return / Exchange -->
          <tr>
            <td style="padding: 20px 28px;">
              <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B1E3F; display: block; margin-bottom: 10px;">
                ${isExchange ? "Items Requested for Exchange" : "Items Requested for Return"}
              </strong>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                ${itemsRows}
              </table>
            </td>
          </tr>

          <!-- Admin Portal Link CTA -->
          <tr>
            <td style="padding: 10px 28px 28px 28px; text-align: center;">
              <a href="https://offvybe.com/admin/returns" style="background-color: ${isExchange ? "#1565C0" : "#8B1E3F"}; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 12px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; display: inline-block;">
                Review Request in Admin &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F6F0; padding: 18px 24px; text-align: center; border-top: 1px solid #E5DFD7; font-size: 11px; color: #8F8884;">
              OFFVYBE Operations Dispatch &bull; Automated notification for Sujal Solanki (Admin)<br>
              Hostinger Production Server &bull; Jodhpur, Rajasthan
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
 * Dispatches an automated email alert to sujalsolanki7719801@gmail.com
 * when any order is placed (COD or Online).
 */
export async function sendAdminOrderPlacedNotification(
  data: AdminOrderPlacedData
): Promise<SendEmailResult> {
  const adminEmail = getAdminNotificationEmail();
  const alertKey = `order_placed:${data.orderNumber}`;
  if (isDuplicateAdminAlert(alertKey)) {
    console.info(`[Admin Alert Deduplication] Skipped duplicate order alert for ${data.orderNumber}`);
    return { success: true, duplicate: true };
  }

  const subject = `🚨 [NEW ORDER] ${data.orderNumber} — ₹${data.total.toLocaleString("en-IN")} (${data.paymentMethod})`;
  const html = generateAdminOrderPlacedHtml(data);
  const text = `NEW ORDER RECEIVED\nOrder: ${data.orderNumber}\nTotal: ₹${data.total.toLocaleString("en-IN")}\nPayment: ${data.paymentMethod}\nCustomer: ${data.customerName} (${data.customerEmail}, ${data.customerPhone || "no phone"})\nAddress: ${data.shippingAddress.street}, ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}\nItems: ${data.items.map((i) => `${i.productName} (${i.size}/${i.color}) x${i.quantity}`).join(", ")}\nView: https://offvybe.com/admin/orders`;

  return dispatchResendEmail({
    to: adminEmail,
    subject,
    html,
    text,
    logTag: "Admin New Order Alert",
    referenceId: data.orderNumber,
  });
}

/**
 * Dispatches an automated email alert to sujalsolanki7719801@gmail.com
 * when any order is cancelled by the customer or admin.
 */
export async function sendAdminOrderCancelledNotification(
  data: AdminOrderCancelledData
): Promise<SendEmailResult> {
  const adminEmail = getAdminNotificationEmail();
  const alertKey = `order_cancelled:${data.orderNumber}`;
  if (isDuplicateAdminAlert(alertKey)) {
    console.info(`[Admin Alert Deduplication] Skipped duplicate cancellation alert for ${data.orderNumber}`);
    return { success: true, duplicate: true };
  }

  const subject = `⚠️ [ORDER CANCELLED] ${data.orderNumber} — ₹${data.totalAmount.toLocaleString("en-IN")}`;
  const html = generateAdminOrderCancelledHtml(data);
  const text = `ORDER CANCELLED\nOrder: ${data.orderNumber}\nAmount: ₹${data.totalAmount.toLocaleString("en-IN")}\nCancelled By: ${data.cancelledBy || "Customer"}\nReason: ${data.reason || "Not specified"}\nCustomer: ${data.customerName} (${data.customerEmail}${data.customerPhone ? `, ${data.customerPhone}` : ""})\nView: https://offvybe.com/admin/orders`;

  return dispatchResendEmail({
    to: adminEmail,
    subject,
    html,
    text,
    logTag: "Admin Order Cancelled Alert",
    referenceId: data.orderNumber,
  });
}

/**
 * Dispatches an automated email alert to sujalsolanki7719801@gmail.com
 * when a customer requests an exchange or return.
 */
export async function sendAdminReturnExchangeNotification(
  data: AdminReturnExchangeData
): Promise<SendEmailResult> {
  const adminEmail = getAdminNotificationEmail();
  const alertKey = `return_exchange:${data.orderNumber}:${data.kind}`;
  if (isDuplicateAdminAlert(alertKey)) {
    console.info(`[Admin Alert Deduplication] Skipped duplicate return/exchange alert for ${data.orderNumber}`);
    return { success: true, duplicate: true };
  }

  const isExchange = data.kind === "EXCHANGE";
  const subject = `🔄 [${isExchange ? "EXCHANGE REQUEST" : "RETURN REQUEST"}] Order ${data.orderNumber}`;
  const html = generateAdminReturnExchangeHtml(data);
  const text = `${isExchange ? "EXCHANGE REQUEST" : "RETURN REQUEST"}\nOrder: ${data.orderNumber}\nReason: ${data.reason}\nNote: ${data.note || "None"}\nCustomer: ${data.customerName} (${data.customerEmail}${data.customerPhone ? `, ${data.customerPhone}` : ""})\nItems:\n${data.items.map((i) => ` - ${i.productName} (Size: ${i.size}${i.exchangeSize ? ` -> Exchange for ${i.exchangeSize}` : ""}) x${i.quantity}`).join("\n")}\nReview: https://offvybe.com/admin/returns`;

  return dispatchResendEmail({
    to: adminEmail,
    subject,
    html,
    text,
    logTag: isExchange ? "Admin Exchange Alert" : "Admin Return Alert",
    referenceId: data.orderNumber,
  });
}

