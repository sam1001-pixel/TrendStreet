/** Browser helpers for the order actions API (used by the account page and the track-order page). */
import type { Order } from "@/types/store";

export const RETURN_REASONS = [
  "Size too small",
  "Size too big",
  "Different from the photos",
  "Damaged or defective",
  "Received the wrong item",
  "Changed my mind",
] as const;

type Result = { ok: true; order: Order } | { ok: false; error: string };

async function post(url: string, body: unknown): Promise<Result> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.order) return { ok: true, order: data.order as Order };
    return { ok: false, error: data?.error || "Something went wrong. Please try again." };
  } catch {
    return { ok: false, error: "You seem to be offline. Please check your connection and try again." };
  }
}

/** `email` is only needed when not signed in (track-order page). */
export function cancelOrder(orderNumber: string, reason: string, email?: string) {
  return post("/api/orders/cancel", { orderNumber, reason, email });
}

export function requestReturn(input: {
  orderNumber: string;
  email?: string;
  kind: "EXCHANGE" | "RETURN";
  reason: string;
  note?: string;
  items: { orderItemId: string; quantity: number; exchangeSize?: string }[];
}) {
  return post("/api/returns", input);
}

/** Customer-facing progress steps for an order. */
export const ORDER_STEPS = ["Placed", "Confirmed", "Shipped", "Delivered"] as const;

export function orderStep(status: Order["status"]): number {
  switch (status) {
    case "Pending":
      return 0;
    case "Confirmed":
    case "Processing":
      return 1;
    case "Shipped":
    case "In Transit":
      return 2;
    case "Delivered":
      return 3;
    default:
      return -1;
  }
}

export const STATUS_COPY: Record<Order["status"], string> = {
  Pending: "Order placed — we'll confirm it shortly",
  Confirmed: "Confirmed — being packed",
  Processing: "Being packed",
  Shipped: "On the way",
  "In Transit": "On the way",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
};
