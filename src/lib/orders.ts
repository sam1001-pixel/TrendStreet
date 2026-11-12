/**
 * OFFVYBE — server-side order placement.
 *
 * One path for every order: prices are recomputed from the database catalog, coupons come from the
 * database, and the order, its line items and the stock reservation are written in one transaction.
 *
 * Online (Razorpay) orders are saved BEFORE the shopper pays, as PENDING with a PENDING payment that
 * holds the Razorpay order id. Payment confirmation (browser callback or webhook — whichever arrives
 * first) only flips that saved order to CONFIRMED; nothing about the cart is read from the browser
 * after payment. Unpaid orders are released after PENDING_PAYMENT_TTL_MINUTES.
 */
import crypto from "crypto";
import { OrderStatus, PaymentProvider, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCatalogForPricing } from "@/lib/catalog";
import { calculateOrderPricing, PricingItem, PricingSummary, ResolvedCoupon } from "@/lib/pricing";
import { consumeCoupon, CouponRuleError, enforceCustomerCouponRules, resolveCoupon } from "@/lib/coupons";
import { isValidIndianPincode } from "@/lib/pincode";
import { getStoreConfig } from "@/lib/store-config-server";
import { shippingRulesFromConfig } from "@/lib/store-config";

export type DeliveryMethod = "standard" | "express" | "vip_courier";

export interface OrderLineInput {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export interface OrderCustomerInput {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface PlaceOrderInput {
  items: OrderLineInput[];
  customer: OrderCustomerInput;
  promoCode?: string | null;
  deliveryMethod: DeliveryMethod;
  /** Pre-generated order number (used as the Razorpay receipt). Generated if omitted. */
  orderNumber?: string;
  payment: { provider: "CASH_ON_DELIVERY" } | { provider: "RAZORPAY"; gatewayOrderId: string };
  /** Signed-in customer placing the order. It shows in their account only if the checkout email is theirs. */
  accountUserId?: string | null;
}

export class OrderInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderInputError";
    Object.setPrototypeOf(this, OrderInputError.prototype);
  }
}

const DELIVERY_COURIER = "Blue Dart Apex / Delhivery Air";
const MAX_QTY_PER_LINE = 10;
export const PENDING_PAYMENT_TTL_MINUTES = 30;

/** e.g. OV-261022-7K3QF — date-prefixed, random suffix, safe to read over the phone. */
export function generateOrderNumber(now = new Date()): string {
  const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(5);
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `OV-${yymmdd}-${suffix}`;
}

/** Validates the customer block; throws OrderInputError with a shopper-readable message. */
export function validateCustomer(c: Partial<OrderCustomerInput> | undefined): OrderCustomerInput {
  const s = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const customer = {
    fullName: s(c?.fullName, 120),
    email: s(c?.email).toLowerCase(),
    phone: s(c?.phone, 20),
    address: s(c?.address, 300),
    apartment: s(c?.apartment, 120) || undefined,
    landmark: s(c?.landmark, 120) || undefined,
    city: s(c?.city, 80),
    state: s(c?.state, 80),
    postalCode: s(c?.postalCode, 10),
  };
  if (customer.fullName.length < 2) throw new OrderInputError("Please enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new OrderInputError("Please enter a valid email address.");
  if (customer.phone.replace(/\D/g, "").length < 10) throw new OrderInputError("Please enter a valid 10-digit mobile number.");
  if (customer.address.length < 5 || !customer.city || !customer.state)
    throw new OrderInputError("Please complete your delivery address.");
  if (!isValidIndianPincode(customer.postalCode)) throw new OrderInputError("Please enter a valid 6-digit PIN code.");
  return customer;
}

/** Recomputes the order price from the database catalog and coupons. Never uses client-sent prices. */
export async function priceOrder(items: OrderLineInput[], promoCode: string | null | undefined, deliveryMethod: DeliveryMethod) {
  if (!Array.isArray(items) || items.length === 0) throw new OrderInputError("Your bag is empty.");
  if (items.length > 30) throw new OrderInputError("Your bag has too many lines. Please split the order.");

  // The same product + size + colour sent as several lines is one line: otherwise the
  // 10-per-line cap could be dodged by repeating the line.
  const merged = new Map<string, OrderLineInput>();
  for (const it of items) {
    const key = `${String(it?.productId)}|${String(it?.size)}|${String(it?.color)}`;
    const q = Math.floor(Number(it?.quantity));
    const prev = merged.get(key);
    merged.set(key, prev ? { ...prev, quantity: Math.floor(Number(prev.quantity)) + q } : { ...it, quantity: q });
  }
  const mergedItems = Array.from(merged.values());

  const catalog = await getCatalogForPricing(Array.from(new Set(mergedItems.map((i) => String(i?.productId)))));
  const lines: (PricingItem & { productId: string })[] = [];
  for (const it of mergedItems) {
    const product = catalog.find((p) => p.id === it?.productId);
    if (!product || !product.inStock) throw new OrderInputError("An item in your bag is no longer available.");
    if (!product.sizes.includes(it.size)) throw new OrderInputError(`Size ${it.size} isn't offered for ${product.name}.`);
    if (!product.colors.some((c) => c.name === it.color)) throw new OrderInputError(`That colour isn't offered for ${product.name}.`);
    const quantity = Math.floor(Number(it.quantity));
    if (!(quantity >= 1 && quantity <= MAX_QTY_PER_LINE)) throw new OrderInputError("Please choose a quantity between 1 and 10.");
    lines.push({
      productId: product.id,
      id: product.id,
      name: product.name,
      unitPriceMinor: Math.round(product.price * 100),
      quantity,
      size: it.size,
      color: it.color,
    });
  }

  const coupon: ResolvedCoupon | null = promoCode ? await resolveCoupon(promoCode) : null;
  // Delivery charges come from Admin → Settings → Delivery (never from the browser).
  const config = await getStoreConfig();
  const method: DeliveryMethod = deliveryMethod === "standard" || !config.shipping.expressEnabled ? "standard" : "express";
  const pricing = calculateOrderPricing(lines, { coupon, deliveryMethod: method, currency: "INR", shipping: shippingRulesFromConfig(config) });
  return { lines, pricing };
}

export interface PlacedOrder {
  id: string;
  orderNumber: string;
  pricing: PricingSummary;
  lines: Awaited<ReturnType<typeof priceOrder>>["lines"];
  customer: OrderCustomerInput;
}

/**
 * Writes an order and reserves its stock. COD orders start PENDING (confirmed by phone/WhatsApp
 * before dispatch); Razorpay orders start PENDING with a PENDING payment until the payment is confirmed.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  const customer = validateCustomer(input.customer);
  const { lines, pricing } = await priceOrder(input.items, input.promoCode, input.deliveryMethod);
  const orderNumber = input.orderNumber ?? generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const variants = await Promise.all(
      lines.map((l) =>
        tx.productVariant.findUnique({
          where: { productId_size_colorName: { productId: l.productId, size: l.size, colorName: l.color } },
        })
      )
    );
    const missing = lines.findIndex((_, i) => !variants[i]);
    if (missing >= 0) {
      const m = lines[missing];
      throw new OrderInputError(`${m.name} in ${m.size} / ${m.color} isn't available any more.`);
    }

    // Reserve stock atomically: the conditional update only succeeds while enough units remain.
    for (let i = 0; i < lines.length; i++) {
      const taken = await tx.inventory.updateMany({
        where: { variantId: variants[i]!.id, quantity: { gte: lines[i].quantity } },
        data: { quantity: { decrement: lines[i].quantity } },
      });
      if (taken.count === 0) {
        throw new OrderInputError(`Sorry — ${lines[i].name} in ${lines[i].size} / ${lines[i].color} just sold out.`);
      }
    }

    if (pricing.promoCodeApplied) {
      try {
        await enforceCustomerCouponRules(tx, pricing.promoCodeApplied, { email: customer.email, phone: customer.phone });
      } catch (e) {
        if (e instanceof CouponRuleError) throw new OrderInputError(`${e.message} Please remove it and try again.`);
        throw e;
      }
      if (!(await consumeCoupon(pricing.promoCodeApplied, tx))) {
        throw new OrderInputError(`The code ${pricing.promoCodeApplied} has just run out. Please remove it and try again.`);
      }
    }

    // Never overwrite an existing account's name or phone from a checkout form.
    const user = await tx.user.upsert({
      where: { email: customer.email },
      update: {},
      create: { email: customer.email, name: customer.fullName, phone: customer.phone, role: "CUSTOMER" },
    });

    const address = await tx.address.create({
      data: {
        userId: user.id,
        fullName: customer.fullName,
        phone: customer.phone,
        street: customer.landmark ? `${customer.address}, Near ${customer.landmark}` : customer.address,
        apartment: customer.apartment ?? null,
        city: customer.city,
        state: customer.state,
        postalCode: customer.postalCode,
        country: "IN",
      },
    });

    const payment: Prisma.PaymentCreateWithoutOrderInput =
      input.payment.provider === "RAZORPAY"
        ? {
            provider: PaymentProvider.RAZORPAY,
            gatewayOrderId: input.payment.gatewayOrderId,
            amount: pricing.totalMinor,
            currency: "INR",
            status: PaymentStatus.PENDING,
          }
        : { provider: PaymentProvider.CASH_ON_DELIVERY, amount: pricing.totalMinor, currency: "INR", status: PaymentStatus.PENDING };

    return tx.order.create({
      data: {
        orderNumber,
        userId: user.id,
        shippingAddressId: address.id,
        status: OrderStatus.PENDING,
        currency: "INR",
        subtotal: pricing.subtotalMinor,
        discountAmount: pricing.discountMinor,
        shippingAmount: pricing.shippingMinor,
        taxAmount: pricing.taxMinor,
        totalAmount: pricing.totalMinor,
        promoCode: pricing.promoCodeApplied,
        deliveryCourier: DELIVERY_COURIER,
        placedSignedIn: Boolean(input.accountUserId) && input.accountUserId === user.id,
        items: {
          create: lines.map((l, i) => ({
            variantId: variants[i]!.id,
            unitPrice: l.unitPriceMinor,
            quantity: l.quantity,
            totalPrice: l.unitPriceMinor * l.quantity,
          })),
        },
        payments: { create: payment },
      },
    });
  });

  return { id: order.id, orderNumber: order.orderNumber, pricing, lines, customer };
}

// ----------------------------------------------------------------------------
// Stock & coupon release
// ----------------------------------------------------------------------------

/** Puts an order's units back in stock and gives back its coupon use. Call inside a transaction. */
export async function releaseOrderResources(
  tx: Prisma.TransactionClient,
  order: { items: { variantId: string; quantity: number }[]; promoCode: string | null }
) {
  for (const item of order.items) {
    await tx.inventory.updateMany({ where: { variantId: item.variantId }, data: { quantity: { increment: item.quantity } } });
  }
  if (order.promoCode) {
    await tx.coupon.updateMany({ where: { code: order.promoCode, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
  }
}

/** Takes an order's units out of stock again (re-opening a released order). Returns false if any line is short. */
async function reserveOrderStock(tx: Prisma.TransactionClient, items: { variantId: string; quantity: number }[]) {
  for (const item of items) {
    const taken = await tx.inventory.updateMany({
      where: { variantId: item.variantId, quantity: { gte: item.quantity } },
      data: { quantity: { decrement: item.quantity } },
    });
    if (taken.count === 0) return false;
  }
  return true;
}

// ----------------------------------------------------------------------------
// Razorpay payment confirmation
// ----------------------------------------------------------------------------

export type ConfirmResult =
  | { outcome: "confirmed"; orderId: string; orderNumber: string; newlyConfirmed: boolean }
  | { outcome: "needs_review"; orderId: string; orderNumber: string; reason: string }
  | { outcome: "refunded"; orderId: string; orderNumber: string; reason: string }
  | { outcome: "not_found" };

async function audit(action: string, entityId: string | null, metadata: Record<string, unknown>) {
  try {
    await prisma.auditLog.create({
      data: { action, entityType: "Payment", entityId, metadata: metadata as Prisma.InputJsonValue },
    });
  } catch (err) {
    console.error("[Audit write failed]:", action, (err as Error).message);
  }
}

/** Refunds a captured Razorpay payment in full and marks the order cancelled. Never throws. */
async function refundPayment(paymentRowId: string, orderId: string, gatewayPaymentId: string, amountMinor: number, reason: string) {
  try {
    const { getRazorpayClient } = await import("@/lib/razorpay");
    await getRazorpayClient().payments.refund(gatewayPaymentId, {
      amount: amountMinor,
      notes: { reason: reason.slice(0, 250) },
    });
    await prisma.$transaction([
      prisma.payment.update({ where: { id: paymentRowId }, data: { status: PaymentStatus.REFUNDED } }),
      prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.REFUNDED } }),
    ]);
    await audit("PAYMENT_REFUNDED", gatewayPaymentId, { orderId, amountMinor, reason });
    return true;
  } catch (err) {
    console.error(`[REFUND FAILED — ACTION REQUIRED] payment ${gatewayPaymentId} for order ${orderId}:`, err);
    await audit("PAYMENT_NEEDS_REVIEW", gatewayPaymentId, { orderId, amountMinor, reason: `Refund failed: ${reason}` });
    return false;
  }
}

/**
 * Marks the saved order for this Razorpay order id as paid. Safe to call more than once and from
 * both the browser callback and the webhook: only the first call flips it (`newlyConfirmed: true`).
 * The caller must already have verified the Razorpay signature.
 */
export async function confirmRazorpayPayment(params: {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature?: string;
  paidAmountMinor: number;
  source: "verify" | "webhook" | "reconcile";
}): Promise<ConfirmResult> {
  const payment = await prisma.payment.findUnique({
    where: { gatewayOrderId: params.gatewayOrderId },
    include: { order: { include: { items: true } } },
  });
  if (!payment) return { outcome: "not_found" };
  const order = payment.order;

  if (payment.status === PaymentStatus.CAPTURED) {
    return { outcome: "confirmed", orderId: order.id, orderNumber: order.orderNumber, newlyConfirmed: false };
  }
  if (payment.status === PaymentStatus.REFUNDED) {
    return { outcome: "refunded", orderId: order.id, orderNumber: order.orderNumber, reason: "Already refunded" };
  }

  // The order was released (unpaid too long) before the payment arrived: try to take the stock back.
  if (order.status === OrderStatus.CANCELLED || payment.status === PaymentStatus.FAILED) {
    const reopened = await prisma.$transaction(async (tx) => {
      const claim = await tx.payment.updateMany({
        where: { id: payment.id, status: { in: [PaymentStatus.FAILED, PaymentStatus.PENDING] } },
        data: { status: PaymentStatus.AUTHORIZED },
      });
      if (claim.count === 0) return "raced" as const;
      if (!(await reserveOrderStock(tx, order.items))) throw new Error("OUT_OF_STOCK");
      await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.PENDING } });
      return "ok" as const;
    }).catch((e) => (e instanceof Error && e.message === "OUT_OF_STOCK" ? ("out_of_stock" as const) : Promise.reject(e)));

    if (reopened === "raced") {
      return confirmRazorpayPayment(params); // another call is handling it; re-read state
    }
    if (reopened === "out_of_stock") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { gatewayPaymentId: params.gatewayPaymentId, gatewaySignature: params.gatewaySignature ?? null, status: PaymentStatus.CAPTURED },
      });
      const reason = "Paid after the order had expired and the stock was no longer available";
      await refundPayment(payment.id, order.id, params.gatewayPaymentId, params.paidAmountMinor, reason);
      return { outcome: "refunded", orderId: order.id, orderNumber: order.orderNumber, reason };
    }
  }

  const amountMatches = params.paidAmountMinor === payment.amount;

  const flipped = await prisma.$transaction(async (tx) => {
    const res = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: PaymentStatus.CAPTURED } },
      data: {
        status: PaymentStatus.CAPTURED,
        gatewayPaymentId: params.gatewayPaymentId,
        gatewaySignature: params.gatewaySignature ?? null,
      },
    });
    if (res.count === 0) return false;
    // A different amount than we asked for is held for a person to check before dispatch.
    if (amountMatches) {
      await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.CONFIRMED } });
    }
    return true;
  });

  if (!amountMatches) {
    const reason = `Paid ${params.paidAmountMinor} paise, expected ${payment.amount}`;
    console.error(`[PAYMENT AMOUNT MISMATCH — REVIEW ORDER ${order.orderNumber}] ${reason}`);
    if (flipped) await audit("PAYMENT_NEEDS_REVIEW", params.gatewayPaymentId, { orderId: order.id, orderNumber: order.orderNumber, reason });
    return { outcome: "needs_review", orderId: order.id, orderNumber: order.orderNumber, reason };
  }

  if (flipped) {
    await audit("PAYMENT_CONFIRMED", params.gatewayPaymentId, { orderId: order.id, orderNumber: order.orderNumber, source: params.source });
  }
  return { outcome: "confirmed", orderId: order.id, orderNumber: order.orderNumber, newlyConfirmed: flipped };
}

/**
 * Releases stock held by Razorpay orders that were never paid. Before releasing, each one is checked
 * with Razorpay, so a payment whose webhook was missed is confirmed instead of cancelled.
 */
export async function releaseStaleRazorpayOrders(limit = 25): Promise<{ released: number; confirmed: number; errors: number }> {
  const cutoff = new Date(Date.now() - PENDING_PAYMENT_TTL_MINUTES * 60 * 1000);
  const stale = await prisma.payment.findMany({
    where: { provider: PaymentProvider.RAZORPAY, status: PaymentStatus.PENDING, createdAt: { lt: cutoff } },
    include: { order: { include: { items: true } } },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  let released = 0;
  let confirmed = 0;
  let errors = 0;

  for (const p of stale) {
    try {
      if (p.gatewayOrderId) {
        const { getRazorpayClient } = await import("@/lib/razorpay");
        const rzp = getRazorpayClient();
        const rzpOrder = await rzp.orders.fetch(p.gatewayOrderId);
        if (rzpOrder.status === "paid") {
          const payments = await rzp.orders.fetchPayments(p.gatewayOrderId);
          const captured = payments.items.find((x) => x.status === "captured");
          if (captured) {
            await confirmRazorpayPayment({
              gatewayOrderId: p.gatewayOrderId,
              gatewayPaymentId: captured.id,
              paidAmountMinor: Number(captured.amount),
              source: "reconcile",
            });
            confirmed++;
            continue;
          }
        }
      }

      const didRelease = await prisma.$transaction(async (tx) => {
        const res = await tx.payment.updateMany({
          where: { id: p.id, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.FAILED },
        });
        if (res.count === 0) return false;
        await releaseOrderResources(tx, p.order);
        await tx.order.update({ where: { id: p.orderId }, data: { status: OrderStatus.CANCELLED } });
        return true;
      });
      if (didRelease) released++;
    } catch (err) {
      errors++;
      console.error(`[Release stale order] ${p.order.orderNumber}:`, (err as Error).message);
    }
  }

  return { released, confirmed, errors };
}

// ----------------------------------------------------------------------------
// Confirmation emails
// ----------------------------------------------------------------------------

/** Sends the confirmation email for a saved order, built from the database. Never throws. */
export async function sendOrderEmailFromDb(orderId: string, paymentMethod: string, paymentGatewayId?: string) {
  try {
    const o = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, shippingAddress: true, items: { include: { variant: { include: { product: true } } } } },
    });
    if (!o?.user?.email) return;
    const { sendOrderConfirmationEmail } = await import("@/lib/email");
    await sendOrderConfirmationEmail({
      orderNumber: o.orderNumber,
      orderId: o.id,
      customerName: o.shippingAddress.fullName || o.user.name || "Customer",
      customerEmail: o.user.email,
      items: o.items.map((it) => ({
        productName: it.variant.product.name,
        size: it.variant.size,
        color: it.variant.colorName,
        quantity: it.quantity,
        unitPrice: it.unitPrice / 100,
      })),
      subtotal: o.subtotal / 100,
      discount: o.discountAmount / 100,
      shipping: o.shippingAmount / 100,
      tax: o.taxAmount / 100,
      total: o.totalAmount / 100,
      promoCode: o.promoCode ?? undefined,
      paymentMethod,
      paymentGatewayId,
      shippingAddress: {
        street: o.shippingAddress.street,
        apartment: o.shippingAddress.apartment ?? undefined,
        city: o.shippingAddress.city,
        state: o.shippingAddress.state ?? "",
        postalCode: o.shippingAddress.postalCode,
        country: "India",
      },
      deliveryCourier: o.deliveryCourier || DELIVERY_COURIER,
    });
  } catch (err) {
    console.warn("[Order email warning]:", (err as Error)?.message || err);
  }
}
