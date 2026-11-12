import type { Order, UserProfile } from "@/types/store";

/**
 * Sample account shown only when a visitor taps "Preview demo account" on /profile.
 * Never loaded automatically. Demo order numbers start with "TS-DEMO" so they can't
 * be confused with real orders.
 */
export const DEMO_EMAIL = "concierge@offvybe.com";

export const DEMO_USER: UserProfile = {
  name: "",
  email: "",
  phone: "",
  vipTier: "",
  rewardPoints: 0,
  savedAddresses: [],
  measurements: {
    oversizedFit: "",
    boxyFit: "",
    jacketSize: "",
    denimWaist: "",
    denimLength: "",
    chest: "",
  },
};

export const DEMO_WISHLIST: string[] = [];

export const DEMO_ORDERS: Order[] = [];

/** Tracking steps, in order. */
export const TRACK_STEPS = ["Confirmed", "Packed", "Shipped", "Out for delivery", "Delivered"] as const;

/** How far along the 5 tracking steps an order status is (0-based index of the current step). */
export function stepIndexFor(status: string): number {
  switch (status) {
    case "Pending":
    case "Confirmed":
      return 0;
    case "Processing":
      return 1;
    case "Shipped":
      return 2;
    case "In Transit":
      return 3;
    case "Delivered":
      return 4;
    default:
      return 0;
  }
}
