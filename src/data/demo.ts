import type { Order, UserProfile } from "@/types/store";

/**
 * Sample account shown only when a visitor taps "Preview demo account" on /profile.
 * Never loaded automatically. Demo order numbers start with "TS-DEMO" so they can't
 * be confused with real orders.
 */
export const DEMO_EMAIL = "demo@trendstreet.in";

export const DEMO_USER: UserProfile = {
  name: "Kabir Rathore",
  email: DEMO_EMAIL,
  phone: "98290 45612",
  vipTier: "Indigo Circle",
  rewardPoints: 2480,
  savedAddresses: [
    {
      id: "demo-home",
      label: "Home",
      fullName: "Kabir Rathore",
      address: "14, Sardarpura 3rd C Road, near Gandhi Maidan",
      city: "Jodhpur",
      state: "Rajasthan",
      postalCode: "342003",
      isDefault: true,
    },
    {
      id: "demo-office",
      label: "Office",
      fullName: "Kabir Rathore",
      address: "Level 6, One BKC, Bandra Kurla Complex",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400051",
      isDefault: false,
    },
  ],
  measurements: {
    oversizedFit: "L",
    boxyFit: "M",
    jacketSize: "L",
    denimWaist: "32",
    denimLength: "32",
    chest: "40 in",
  },
};

export const DEMO_WISHLIST = ["ts-022", "ts-010", "ts-005", "ts-014"];

const img = (id: string) => `https://images.unsplash.com/${id}?q=80&w=600&auto=format&fit=crop`;

export const DEMO_ORDERS: Order[] = [
  {
    id: "TS-DEMO-24117",
    orderNumber: "TS-DEMO-24117",
    createdAt: "2026-10-21T10:42:00.000Z",
    status: "In Transit",
    items: [
      { productId: "ts-022", productName: "Jodhpuri Bandhgala Bomber", price: 6999, selectedSize: "L", selectedColor: "Royal Indigo", quantity: 1, image: img("photo-1551028719-00167b16eac5") },
      { productId: "ts-020", productName: "Bagru Block-Print Boxy Shirt", price: 2899, selectedSize: "M", selectedColor: "Indigo Block", quantity: 1, image: img("photo-1596755094514-f87e34085b2c") },
    ],
    subtotal: 9898,
    discount: 1485,
    shipping: 0,
    tax: 901,
    total: 8413,
    promoCode: "BUNDLE15",
    customer: { fullName: "Kabir Rathore", email: DEMO_EMAIL, phone: "98290 45612", address: "14, Sardarpura 3rd C Road", city: "Jodhpur", postalCode: "342003", country: "India" },
    deliveryMethod: "express",
    paymentMethod: "upi",
    trackingNumber: "BD-77319024IN",
    estimatedDelivery: "2026-10-25",
  },
  {
    id: "TS-DEMO-23980",
    orderNumber: "TS-DEMO-23980",
    createdAt: "2026-10-09T15:05:00.000Z",
    status: "Delivered",
    items: [
      { productId: "ts-002", productName: "The Tokyo Drop-Shoulder Oversized Hoodie", price: 4999, selectedSize: "L", selectedColor: "Vintage Charcoal", quantity: 1, image: img("photo-1556905055-8f358a7a47b2") },
      { productId: "ts-006", productName: "Raw Indigo Straight Baggy Jeans", price: 5499, selectedSize: "32", selectedColor: "Deep Raw Indigo", quantity: 1, image: img("photo-1542272604-787c3835535d") },
    ],
    subtotal: 10498,
    discount: 0,
    shipping: 0,
    tax: 1125,
    total: 10498,
    customer: { fullName: "Kabir Rathore", email: DEMO_EMAIL, phone: "98290 45612", address: "Level 6, One BKC", city: "Mumbai", postalCode: "400051", country: "India" },
    deliveryMethod: "standard",
    paymentMethod: "card",
    trackingNumber: "DLV-5520193847",
    estimatedDelivery: "2026-10-13",
  },
  {
    id: "TS-DEMO-23544",
    orderNumber: "TS-DEMO-23544",
    createdAt: "2026-09-18T08:20:00.000Z",
    status: "Delivered",
    items: [
      { productId: "ts-013", productName: "Blue City Indigo Oversized Tee", price: 1999, selectedSize: "L", selectedColor: "Blue City Indigo", quantity: 2, image: img("photo-1521572267360-ee0c2909d518") },
    ],
    subtotal: 3998,
    discount: 400,
    shipping: 0,
    tax: 386,
    total: 3598,
    promoCode: "TREND10",
    customer: { fullName: "Kabir Rathore", email: DEMO_EMAIL, phone: "98290 45612", address: "14, Sardarpura 3rd C Road", city: "Jodhpur", postalCode: "342003", country: "India" },
    deliveryMethod: "standard",
    paymentMethod: "cod",
    trackingNumber: "BD-77280011IN",
    estimatedDelivery: "2026-09-22",
  },
];

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
