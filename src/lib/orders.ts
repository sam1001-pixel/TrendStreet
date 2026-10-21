/**
 * Trend Street — server-side order placement.
 * One path for every order (COD and Razorpay): prices are recomputed from the
 * server catalog, the order and its line items are written in one transaction,
 * and nothing the client sends about money is trusted.
 */
import crypto from "crypto";
import { OrderStatus, PaymentProvider, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCatalogForPricing } from "@/lib/catalog";
import { calculateOrderPricing, PricingItem, PricingSummary } from "@/lib/pricing";
import { isValidIndianPincode } from "@/lib/pincode";

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
  payment:
    | { provider: "CASH_ON_DELIVERY" }
    | { provider: "RAZORPAY"; gatewayOrderId: string; gatewayPaymentId: string; gatewaySignature: string; paidAmountMinor: number };
}

export class OrderInputError extends Error {}

const DELIVERY_COURIER = "Blue Dart Apex / Delhivery Air";
const MAX_QTY_PER_LINE = 10;

/** e.g. TS-261022-7K3QF — date-prefixed, random suffix, safe to read over the phone. */
export function generateOrderNumber(now = new Date()): string {
  const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(5);
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `TS-${yymmdd}-${suffix}`;
}

/** Validates the customer block; throws OrderInputError with a shopper-readable message. */
export function validateCustomer(c: Partial<OrderCustomerInput> | undefined): OrderCustomerInput {
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const customer = {
    fullName: s(c?.fullName),
    email: s(c?.email).toLowerCase(),
    phone: s(c?.phone),
    address: s(c?.address),
    apartment: s(c?.apartment) || undefined,
    landmark: s(c?.landmark) || undefined,
    city: s(c?.city),
    state: s(c?.state),
    postalCode: s(c?.postalCode),
  };
  if (customer.fullName.length < 2) throw new OrderInputError("Please enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new OrderInputError("Please enter a valid email address.");
  if (customer.phone.replace(/\D/g, "").length < 10) throw new OrderInputError("Please enter a valid 10-digit mobile number.");
  if (customer.address.length < 5 || !customer.city || !customer.state)
    throw new OrderInputError("Please complete your delivery address.");
  if (!isValidIndianPincode(customer.postalCode)) throw new OrderInputError("Please enter a valid 6-digit PIN code.");
  return customer;
}

/** Recomputes the order price from the database catalog. Never uses client-sent prices. */
export async function priceOrder(items: OrderLineInput[], promoCode: string | null | undefined, deliveryMethod: DeliveryMethod) {
  if (!Array.isArray(items) || items.length === 0) throw new OrderInputError("Your bag is empty.");

  const catalog = await getCatalogForPricing(Array.from(new Set(items.map((i) => String(i?.productId)))));
  const lines: (PricingItem & { productId: string })[] = [];
  for (const it of items) {
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

  const pricing = calculateOrderPricing(lines, { promoCode, deliveryMethod, currency: "INR" });
  return { lines, pricing };
}

export interface PlacedOrder {
  id: string;
  orderNumber: string;
  pricing: PricingSummary;
  lines: Awaited<ReturnType<typeof priceOrder>>["lines"];
  customer: OrderCustomerInput;
  alreadyExisted: boolean;
  /** True when the amount Razorpay captured differs from the server price — needs manual review. */
  amountMismatch: boolean;
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  const customer = validateCustomer(input.customer);
  const { lines, pricing } = await priceOrder(input.items, input.promoCode, input.deliveryMethod);

  // Razorpay retries / webhook races: one payment id → one order.
  if (input.payment.provider === "RAZORPAY") {
    const existing = await prisma.payment.findUnique({
      where: { gatewayPaymentId: input.payment.gatewayPaymentId },
      include: { order: true },
    });
    if (existing) {
      return { id: existing.order.id, orderNumber: existing.order.orderNumber, pricing, lines, customer, alreadyExisted: true, amountMismatch: false };
    }
  }

  const isCod = input.payment.provider === "CASH_ON_DELIVERY";
  const amountMismatch = input.payment.provider === "RAZORPAY" && input.payment.paidAmountMinor !== pricing.totalMinor;

  const order = await prisma.$transaction(async (tx) => {
    const variants = await Promise.all(
      lines.map((l) =>
        tx.productVariant.findUnique({
          where: { productId_size_colorName: { productId: l.productId, size: l.size, colorName: l.color } },
        })
      )
    );
    const missing = lines.filter((_, i) => !variants[i]);
    if (missing.length) {
      throw new OrderInputError(`${missing[0].name} in ${missing[0].size} / ${missing[0].color} isn't available any more.`);
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

    const user = await tx.user.upsert({
      where: { email: customer.email },
      update: { name: customer.fullName, phone: customer.phone },
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
            gatewayPaymentId: input.payment.gatewayPaymentId,
            gatewaySignature: input.payment.gatewaySignature,
            amount: input.payment.paidAmountMinor,
            currency: "INR",
            status: PaymentStatus.CAPTURED,
          }
        : { provider: PaymentProvider.CASH_ON_DELIVERY, amount: pricing.totalMinor, currency: "INR", status: PaymentStatus.PENDING };

    return tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.id,
        shippingAddressId: address.id,
        // COD is confirmed by the team (call/WhatsApp) before dispatch; paid orders are confirmed immediately.
        // Mismatched payments are held as PENDING for a human to check before dispatch.
        status: isCod || amountMismatch ? OrderStatus.PENDING : OrderStatus.CONFIRMED,
        currency: "INR",
        subtotal: pricing.subtotalMinor,
        discountAmount: pricing.discountMinor,
        shippingAmount: pricing.shippingMinor,
        taxAmount: pricing.taxMinor,
        totalAmount: pricing.totalMinor,
        promoCode: pricing.promoCodeApplied,
        deliveryCourier: DELIVERY_COURIER,
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

  return { id: order.id, orderNumber: order.orderNumber, pricing, lines, customer, alreadyExisted: false, amountMismatch };
}

/** Fire-and-forget confirmation email; never blocks or fails the order. */
export async function sendPlacedOrderEmail(order: PlacedOrder, paymentMethod: string, paymentGatewayId?: string) {
  const { sendOrderConfirmationEmail } = await import("@/lib/email");
  const p = order.pricing;
  return sendOrderConfirmationEmail({
    orderNumber: order.orderNumber,
    orderId: order.id,
    customerName: order.customer.fullName,
    customerEmail: order.customer.email,
    items: order.lines.map((l) => ({
      productName: l.name,
      size: l.size,
      color: l.color,
      quantity: l.quantity,
      unitPrice: l.unitPriceMinor / 100,
    })),
    subtotal: p.subtotalMinor / 100,
    discount: p.discountMinor / 100,
    shipping: p.shippingMinor / 100,
    tax: p.taxMinor / 100,
    total: p.totalMinor / 100,
    promoCode: p.promoCodeApplied ?? undefined,
    paymentMethod,
    paymentGatewayId,
    shippingAddress: {
      street: order.customer.address,
      apartment: order.customer.apartment,
      city: order.customer.city,
      state: order.customer.state,
      postalCode: order.customer.postalCode,
      country: "India",
    },
    deliveryCourier: DELIVERY_COURIER,
  }).catch((err) => console.warn("[Order email warning]:", err?.message || err));
}
