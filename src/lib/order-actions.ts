/**
 * What a customer may do with their own order — cancel it before dispatch, or ask for an exchange /
 * return after delivery — and the one place that decides who counts as "their own".
 *
 * Access rule (used by the account page and the track-order page):
 *  - signed in, the order belongs to the account AND was placed while signed in; or
 *  - the order number together with the email used at checkout (same proof as order lookup).
 * Accounts don't verify email, so an order is never shown just because the emails match.
 */
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminOrderInclude, toAdminOrder } from "@/lib/admin-orders";
import { CUSTOMER_SESSION_COOKIE, getValidCustomerSession } from "@/lib/customer-auth";
import { RETURN_REASONS } from "@/lib/order-client";

export const RETURN_WINDOW_DAYS = 30;
const DAY = 24 * 3600 * 1000;

export const customerOrderInclude = {
  ...adminOrderInclude,
  returnRequests: { orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.OrderInclude;

type CustomerDbOrder = Prisma.OrderGetPayload<{ include: typeof customerOrderInclude }>;

export { RETURN_REASONS };

const OPEN_RETURN = new Set(["REQUESTED", "APPROVED", "PICKED_UP"]);

export function isCod(o: { payments: { provider: string }[] }) {
  return o.payments.some((p) => p.provider === "CASH_ON_DELIVERY");
}

/** Cash-on-delivery orders can be cancelled by the customer until they are packed and handed to the courier. */
export function canCancel(o: Pick<CustomerDbOrder, "status" | "trackingNumber" | "payments">) {
  return (o.status === "PENDING" || o.status === "CONFIRMED") && !o.trackingNumber && isCod(o);
}

/** Paid online orders that haven't shipped: we can't refund from here, so the customer is pointed to support. */
export function needsSupportToCancel(o: Pick<CustomerDbOrder, "status" | "trackingNumber" | "payments">) {
  return ["PENDING", "CONFIRMED", "PROCESSING"].includes(o.status) && !canCancel(o);
}

export function returnDeadline(o: Pick<CustomerDbOrder, "status" | "deliveredAt" | "updatedAt">): Date | null {
  if (o.status !== "DELIVERED") return null;
  const deliveredAt = o.deliveredAt ?? o.updatedAt;
  return new Date(deliveredAt.getTime() + RETURN_WINDOW_DAYS * DAY);
}

export function canRequestReturn(o: Pick<CustomerDbOrder, "status" | "deliveredAt" | "updatedAt" | "returnRequests">, now = Date.now()) {
  const deadline = returnDeadline(o);
  if (!deadline || deadline.getTime() < now) return false;
  return !o.returnRequests.some((r) => OPEN_RETURN.has(r.status));
}

export const RETURN_STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved — pickup being arranged",
  PICKED_UP: "Picked up",
  COMPLETED: "Completed",
  REJECTED: "Not approved",
};

/** The shopper-facing view of an order: no internal ids, gateway details or other customers' data. */
export function toCustomerOrder(o: CustomerDbOrder) {
  const base = toAdminOrder(o);
  const deadline = returnDeadline(o);
  return {
    ...base,
    id: o.orderNumber,
    courier: o.deliveryCourier ?? "",
    items: o.items.map((i, idx) => ({ ...base.items[idx], orderItemId: i.id })),
    cancellable: canCancel(o),
    cancelViaSupport: needsSupportToCancel(o),
    returnable: canRequestReturn(o),
    returnBy: deadline ? deadline.toISOString() : null,
    cancelledAt: o.cancelledAt?.toISOString() ?? null,
    deliveredAt: o.deliveredAt?.toISOString() ?? null,
    returns: o.returnRequests.map((r) => ({
      id: r.id,
      kind: r.kind,
      status: r.status,
      statusLabel: RETURN_STATUS_LABEL[r.status] ?? r.status,
      reason: r.reason,
      adminNote: r.adminNote,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export type CustomerOrder = ReturnType<typeof toCustomerOrder>;

/**
 * The signed-in customer's session, or null. Checks the account in the database too, so a session
 * ended by a password change or "sign out everywhere" stops working immediately.
 */
export async function getCustomerSession(req: NextRequest) {
  try {
    return (await getValidCustomerSession(req.cookies.get(CUSTOMER_SESSION_COOKIE)?.value))?.session ?? null;
  } catch {
    return null;
  }
}

/** Loads an order the caller is allowed to act on, or null (same answer for "missing" and "not yours"). */
export async function loadOwnOrder(req: NextRequest, orderNumberRaw: unknown, emailRaw: unknown): Promise<CustomerDbOrder | null> {
  const orderNumber = String(orderNumberRaw ?? "").trim().toUpperCase().slice(0, 40);
  if (!orderNumber) return null;
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: customerOrderInclude });
  if (!order) return null;

  const session = await getCustomerSession(req);
  if (session && order.userId === session.userId && order.placedSignedIn) return order;

  const email = String(emailRaw ?? "").trim().toLowerCase().slice(0, 200);
  if (email && order.user?.email.toLowerCase() === email) return order;
  return null;
}
