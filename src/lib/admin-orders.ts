/** Database ⇄ admin UI mapping for orders. */
import { OrderStatus as DbOrderStatus, Prisma } from "@prisma/client";
import type { Order, OrderStatus } from "@/types/store";
import { SHIPPING_RATES_MINOR } from "@/lib/pricing";

export const STATUS_TO_UI: Record<DbOrderStatus, OrderStatus> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  IN_TRANSIT: "In Transit",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Cancelled",
};

export const STATUS_TO_DB: Record<OrderStatus, DbOrderStatus> = {
  Pending: "PENDING",
  Confirmed: "CONFIRMED",
  Processing: "PROCESSING",
  "In Transit": "IN_TRANSIT",
  Shipped: "SHIPPED",
  Delivered: "DELIVERED",
  Cancelled: "CANCELLED",
};

export const adminOrderInclude = {
  user: true,
  shippingAddress: true,
  payments: true,
  items: { include: { variant: { include: { product: { include: { images: { orderBy: { sortOrder: "asc" as const }, take: 1 } } } } } } },
} satisfies Prisma.OrderInclude;

/** Excludes online orders that were never paid (awaiting payment, or released after timing out). */
export const PLACED_ORDERS_WHERE = {
  NOT: { payments: { some: { provider: "RAZORPAY", status: { in: ["PENDING", "FAILED"] } } } },
} satisfies Prisma.OrderWhereInput;

type DbOrder = Prisma.OrderGetPayload<{ include: typeof adminOrderInclude }>;

const deliveryFromShipping = (minor: number): Order["deliveryMethod"] =>
  minor === SHIPPING_RATES_MINOR.vip_courier ? "vip_courier" : minor === SHIPPING_RATES_MINOR.express ? "express" : "standard";

export function toAdminOrder(o: DbOrder): Order {
  const a = o.shippingAddress;
  const isCod = o.payments.some((p) => p.provider === "CASH_ON_DELIVERY");
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt.toISOString(),
    status: STATUS_TO_UI[o.status],
    items: o.items.map((i) => ({
      productId: i.variant.productId,
      productName: i.variant.product.name,
      price: i.unitPrice / 100,
      selectedSize: i.variant.size,
      selectedColor: i.variant.colorName,
      quantity: i.quantity,
      image: i.variant.product.images[0]?.url ?? "",
    })),
    subtotal: o.subtotal / 100,
    discount: o.discountAmount / 100,
    shipping: o.shippingAmount / 100,
    tax: o.taxAmount / 100,
    total: o.totalAmount / 100,
    promoCode: o.promoCode ?? undefined,
    customer: {
      fullName: a.fullName,
      email: o.user?.email ?? "",
      phone: a.phone ?? o.user?.phone ?? "",
      address: [a.street, a.state].filter(Boolean).join(", "),
      apartment: a.apartment ?? undefined,
      city: a.city,
      postalCode: a.postalCode,
      country: a.country === "IN" ? "India" : a.country,
    },
    deliveryMethod: deliveryFromShipping(o.shippingAmount),
    paymentMethod: isCod ? "cod" : "razorpay",
    trackingNumber: o.trackingNumber ?? "",
    estimatedDelivery: o.estimatedDelivery ? o.estimatedDelivery.toISOString().slice(0, 10) : "",
  };
}

const FULFILMENT = new Set(["CONFIRMED", "PROCESSING", "IN_TRANSIT", "SHIPPED", "DELIVERED"]);

/**
 * Order status rules (server-side, whatever the admin UI sends):
 * - an online (Razorpay) order can't move past Pending, or be re-opened, unless the payment was captured;
 * - refunded orders are final; delivered orders go through Returns instead of being cancelled;
 * - back to Pending only from Confirmed (undo) or Cancelled (re-open a cash-on-delivery order).
 * Returns an error message, or null if the move is allowed.
 */
export function checkOrderTransition(
  order: { status: string; payments: { provider: string; status: string }[] },
  to: string
): string | null {
  const online = order.payments.some((p) => p.provider === "RAZORPAY");
  const paid = order.payments.some((p) => p.status === "CAPTURED");
  if (order.status === "REFUNDED") return "This order was refunded, so its status can't be changed.";
  if (to === "CANCELLED" && order.status === "DELIVERED") return "Delivered orders can't be cancelled — use a return instead.";
  if (to === "PENDING" && !["CONFIRMED", "CANCELLED"].includes(order.status)) return "An order can only go back to Pending from Confirmed or Cancelled.";
  if ((FULFILMENT.has(to) || (order.status === "CANCELLED" && to !== "CANCELLED")) && online && !paid) {
    return "This online order hasn't been paid, so it can't be confirmed, shipped or re-opened.";
  }
  return null;
}
