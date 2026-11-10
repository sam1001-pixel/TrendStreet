import type { StoreConfig, HeroLook, SilhouettePanel } from "@/lib/store-config";
export type { HeroLook, SilhouettePanel };

export type ProductCategory =
  | "Oversized"
  | "Jeans"
  | "Boxy Fit"
  | "Jackets";

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  /** Optional review video (MP4/WEBM) and its cover image. */
  videoUrl?: string;
  posterUrl?: string;
  city?: string;
  productId?: string;
  productName?: string;
}

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  category: ProductCategory;
  description: string;
  details: string[];
  fabric: string;
  careInstructions: string[];
  images: string[];
  /** Product videos, shown in the gallery after the photos. */
  videos?: string[];
  /** Hidden from the shop (admin only). */
  archived?: boolean;
  sizes: string[];
  colors: { name: string; hex: string }[];
  featured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  inStock: boolean;
  stockCount: number;
  rating: number;
  reviewsCount: number;
  reviews: Review[];
  tags: string[];
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export type OrderStatus = "Pending" | "Confirmed" | "Processing" | "In Transit" | "Shipped" | "Delivered" | "Cancelled";

export interface OrderItem {
  /** Set on orders loaded from the server (used to pick items for an exchange). */
  orderItemId?: string;
  productId: string;
  productName: string;
  price: number;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  promoCode?: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    apartment?: string;
    city: string;
    postalCode: string;
    country: string;
  };
  deliveryMethod: "standard" | "express" | "vip_courier";
  paymentMethod: "card" | "upi" | "netbanking" | "cod" | "razorpay";
  trackingNumber: string;
  estimatedDelivery: string;
  /** Loaded from the signed-in account (live status) rather than this device's receipt copy. */
  fromAccount?: boolean;
  courier?: string;
  cancellable?: boolean;
  /** Paid online and not shipped yet: cancelling goes through support (refund). */
  cancelViaSupport?: boolean;
  returnable?: boolean;
  returnBy?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  returns?: OrderReturn[];
}

export interface OrderReturn {
  id: string;
  kind: "EXCHANGE" | "RETURN";
  status: "REQUESTED" | "APPROVED" | "PICKED_UP" | "COMPLETED" | "REJECTED";
  statusLabel: string;
  reason: string;
  adminNote: string | null;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  vipTier: string;
  rewardPoints: number;
  savedAddresses: {
    id: string;
    label: string;
    fullName: string;
    address: string;
    city: string;
    state?: string;
    postalCode: string;
    isDefault: boolean;
    phone?: string;
    apartment?: string;
  }[];
  measurements: {
    oversizedFit: string;
    boxyFit: string;
    jacketSize: string;
    denimWaist: string;
    denimLength: string;
    chest: string;
  };
}

export interface AdminAccessRecord {
  adminId: number;
  systemOrTool: string;
  category: "General" | "Operations" | "Finance" | "People" | "Compliance";
  mainAdmin: string;
  backupAdmin: string;
  department: string;
  accessLevel: "Full" | "Write" | "Read" | "No Access";
  numberOfAdminUsers: number;
  billingOwner: string;
  plan: string;
  seats: number;
  renewalDate: string;
  companyOwnedAccount: boolean;
  sharedLogin: boolean;
  passwordManagerEntry: string;
  twoFactorOn: boolean;
  lastAccessReview: string;
  nextAccessReview: string;
  offboardingChecklistItem: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  status: "Requested" | "Approved" | "Provisioned" | "Review Due" | "Revoked";
  notes: string;
}

export interface SiteSettings {
  storeName: string;
  storeTagline: string;
  topAnnouncement: {
    enabled: boolean;
    text: string;
    linkUrl: string;
    linkText: string;
  };
  hero: {
    badgeText: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    primaryBtnText: string;
    primaryBtnLink: string;
    secondaryBtnText: string;
    secondaryBtnLink: string;
    stat1Value: string;
    stat1Label: string;
    stat2Value: string;
    stat2Label: string;
    stat3Value: string;
    stat3Label: string;
  };
  marqueePhrases: string[];
  categoryTaglines: {
    Oversized: string;
    Jeans?: string;
    "Boxy Fit": string;
    Jackets: string;
  };
  promoCodes: {
    code: string;
    discountPercent: number;
    description: string;
  }[];
  contactInfo: {
    email: string;
    phone: string;
    address: string;
    hours: string;
  };
  /** Homepage countdown to the next drop (hidden when `at` is empty or past). */
  nextDrop?: { at: string | null; title: string };
  /** Admin-controlled store settings (delivery, COD, offers, banner, social, trust badges). */
  config?: StoreConfig;
  /** The offer coupon from Admin → Discounts, looked up on the server so % and minimum are always real. */
  offerCoupon?: { code: string; percent: number; minSpend: number; freeShipping: boolean } | null;
  storefrontSections?: {
    hero?: boolean;
    weightTest?: boolean;
    shopByPriceOccasion?: boolean;
    runwayReel?: boolean;
    hangingRail?: boolean;
    dropList?: boolean;
    silhouetteAccordion?: boolean;
    videoReviews?: boolean;
    trustStrip?: boolean;
    categoryStories?: boolean;
    priceBanner?: boolean;
    categoryRails?: boolean;
    recentlyViewed?: boolean;
    nextDrop?: boolean;
  };
}
