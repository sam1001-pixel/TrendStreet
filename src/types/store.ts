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
}
