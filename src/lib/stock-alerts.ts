/**
 * OFFVYBE — "Notify me" restock alerts and "Remind me" next-drop alerts.
 *
 * Shoppers leave an email and/or WhatsApp number. Emails go out automatically through Resend
 * (when RESEND_API_KEY is set); WhatsApp-only sign-ups are listed in Admin → Drop alerts with a
 * one-tap WhatsApp link, because sending WhatsApp messages automatically needs a WhatsApp Business API account.
 */
import { prisma } from "@/lib/prisma";
import { escapeHtml, getVerifiedSenderAddress, maskEmailForLogs } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { normaliseEmail, normalisePhone } from "@/lib/alert-contact";

export { normaliseEmail, normalisePhone };

export type AlertKindInput = "RESTOCK" | "DROP";

export class AlertInputError extends Error {}

/** Saves a sign-up (or returns the existing pending one, so double taps don't duplicate). */
export async function createAlert(input: { kind: AlertKindInput; productId?: unknown; size?: unknown; email?: unknown; phone?: unknown }) {
  const kind: AlertKindInput = input.kind === "DROP" ? "DROP" : "RESTOCK";
  const email = normaliseEmail(input.email);
  const phone = normalisePhone(input.phone);
  if (!email && !phone) throw new AlertInputError("Enter a valid email or a 10-digit mobile number.");

  let productId: string | null = null;
  let size: string | null = null;
  if (kind === "RESTOCK") {
    if (typeof input.productId !== "string" || !input.productId) throw new AlertInputError("Missing product.");
    const product = await prisma.product.findUnique({ where: { id: input.productId }, select: { id: true, variants: { select: { size: true } } } });
    if (!product) throw new AlertInputError("This product is no longer available.");
    productId = product.id;
    if (typeof input.size === "string" && product.variants.some((v) => v.size === input.size)) size = input.size;
  }

  const existing = await prisma.stockAlert.findFirst({
    where: {
      kind,
      productId,
      size,
      notifiedAt: null,
      OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
    },
  });
  if (existing) return existing;
  return prisma.stockAlert.create({ data: { kind, productId, size, email, phone } });
}

async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  try {
    let sender = getVerifiedSenderAddress();
    let res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: sender, to: [to], subject, html, text }),
    });
    let data = await res.json().catch(() => ({}));
    if (
      !res.ok &&
      res.status === 403 &&
      sender !== "OFFVYBE <onboarding@resend.dev>" &&
      (data?.message?.includes("not verified") || data?.message?.includes("domain"))
    ) {
      sender = "OFFVYBE <onboarding@resend.dev>";
      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: sender, to: [to], subject, html, text }),
      });
    }
    if (!res.ok) console.warn(`[Alerts] Email to ${maskEmailForLogs(to)} failed: HTTP ${res.status}`);
    return res.ok;
  } catch (err) {
    console.warn(`[Alerts] Email to ${maskEmailForLogs(to)} failed:`, (err as Error).message);
    return false;
  }
}

function emailHtml(heading: string, body: string, cta: string, url: string, image?: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#0a0a0a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden">
${image ? `<tr><td><img src="${escapeHtml(image)}" alt="" width="480" style="display:block;width:100%;height:auto"></td></tr>` : ""}
<tr><td style="padding:24px">
<p style="margin:0 0 4px;font-size:12px;letter-spacing:3px;color:#b30015;font-weight:bold">OFFVYBE</p>
<h1 style="margin:0 0 12px;font-size:22px">${escapeHtml(heading)}</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#333">${escapeHtml(body)}</p>
<a href="${escapeHtml(url)}" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px;font-size:14px">${escapeHtml(cta)}</a>
<p style="margin:20px 0 0;font-size:12px;color:#777">You asked us to tell you. This is a one-time message.</p>
</td></tr></table></td></tr></table></body></html>`;
}

/**
 * Emails everyone waiting for this product, for sizes that are now in stock.
 * Sign-ups without an email stay pending for the WhatsApp list.
 */
export async function notifyRestock(productId: string): Promise<{ sent: number; waiting: number }> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: { include: { inventory: true } } },
  });
  if (!product || product.archived) return { sent: 0, waiting: 0 };

  const inStockSizes = new Set(
    product.variants.filter((v) => (v.inventory?.quantity ?? 0) - (v.inventory?.reservedQty ?? 0) > 0).map((v) => v.size)
  );
  if (!inStockSizes.size) return { sent: 0, waiting: 0 };

  const pending = await prisma.stockAlert.findMany({ where: { kind: "RESTOCK", productId, notifiedAt: null } });
  const url = `${SITE_URL}/product/${product.id}`;
  const price = `₹${(product.basePrice / 100).toLocaleString("en-IN")}`;
  let sent = 0;
  let waiting = 0;

  for (const a of pending) {
    if (a.size && !inStockSizes.has(a.size)) {
      waiting++;
      continue;
    }
    if (!a.email) {
      waiting++;
      continue;
    }
    const sizeText = a.size ? ` in size ${a.size}` : "";
    const ok = await sendEmail(
      a.email,
      `It's back: ${product.name}${sizeText}`,
      emailHtml(`It's back${sizeText}.`, `${product.name} is in stock again at ${price}. Stock is limited, so grab yours before it sells out again.`, "Shop it now", url, product.images[0]?.url),
      `${product.name} is back in stock${sizeText} at ${price}. Shop it: ${url}`
    );
    if (ok) {
      await prisma.stockAlert.update({ where: { id: a.id }, data: { notifiedAt: new Date() } });
      sent++;
    } else waiting++;
  }
  return { sent, waiting };
}

/** Emails everyone who asked to be reminded about the next drop. */
export async function notifyDropLive(): Promise<{ sent: number; waiting: number }> {
  const pending = await prisma.stockAlert.findMany({ where: { kind: "DROP", notifiedAt: null } });
  const settings = await prisma.siteSettings.findUnique({ where: { id: "global" }, select: { nextDropTitle: true } }).catch(() => null);
  const title = settings?.nextDropTitle || "The new drop";
  const url = `${SITE_URL}/shop?sort=newest`;
  let sent = 0;
  let waiting = 0;
  for (const a of pending) {
    if (!a.email) {
      waiting++;
      continue;
    }
    const ok = await sendEmail(
      a.email,
      `${title} is live`,
      emailHtml(`${title} is live.`, "You asked for a reminder — it's here. Every piece is limited, so the best sizes go first.", "Shop the drop", url),
      `${title} is live. Shop it: ${url}`
    );
    if (ok) {
      await prisma.stockAlert.update({ where: { id: a.id }, data: { notifiedAt: new Date() } });
      sent++;
    } else waiting++;
  }
  return { sent, waiting };
}
