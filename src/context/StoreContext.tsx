"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, CartItem, Order, UserProfile, OrderStatus, SiteSettings } from "@/types/store";
import { INITIAL_PRODUCTS } from "@/data/products";
import { calculateOrderPricing, VALID_PROMO_CODES } from "@/lib/pricing";

interface StoreContextType {
  products: Product[];
  siteSettings: SiteSettings;
  updateSiteSettings: (settings: Partial<SiteSettings>) => void;
  resetSiteSettings: () => void;
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  user: UserProfile;
  promoCode: string | null;
  discountRate: number;
  isCartOpen: boolean;
  quickViewProduct: Product | null;
  setIsCartOpen: (open: boolean) => void;
  setQuickViewProduct: (product: Product | null) => void;
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateCartQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  createOrder: (
    orderInput: Omit<Order, "id" | "orderNumber" | "createdAt" | "status" | "trackingNumber" | "estimatedDelivery"> & {
      orderNumber: string;
      status?: OrderStatus;
    }
  ) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addProduct: (product: Omit<Product, "id" | "rating" | "reviewsCount" | "reviews">) => Product;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  cartSubtotal: number;
  cartDiscount: number;
  cartShipping: number;
  cartTax: number;
  cartTotal: number;
  cartItemsCount: number;
}

const DEFAULT_USER: UserProfile = {
  name: "Aarav Sharma",
  email: "aarav.sharma@trendstreet.in",
  phone: "+91 98200 12345",
  vipTier: "Burgundy Connoisseur (VIP Tier 1)",
  rewardPoints: 2450,
  savedAddresses: [
    {
      id: "addr-1",
      label: "Mumbai Residence",
      fullName: "Aarav Sharma",
      address: "Flat 402, Sea Green Apartments, Bandra West",
      city: "Mumbai",
      postalCode: "400050",
      isDefault: true,
    },
    {
      id: "addr-2",
      label: "Bengaluru Loft",
      fullName: "Aarav Sharma",
      address: "Villa 12, 12th Main, Indiranagar",
      city: "Bengaluru",
      postalCode: "560038",
      isDefault: false,
    },
  ],
  measurements: {
    oversizedFit: "L (Relaxed Architectural)",
    boxyFit: "M (Structured Box Crop)",
    jacketSize: "L (Layered Flight Cut)",
    denimWaist: "32W",
    denimLength: "32L",
    chest: "42 in / 106.7 cm",
  },
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  storeName: "Trend Street",
  storeTagline: "The Style Hub",
  topAnnouncement: {
    enabled: true,
    text: "Autumn / Winter 2026 Drops Live • Complimentary Express Courier Across India on Orders Above ₹1,999 • All-Inclusive GST",
    linkUrl: "/shop",
    linkText: "Explore Now",
  },
  hero: {
    badgeText: "Autumn / Winter 2026 Drops",
    titleLine1: "Oversized Silhouettes.",
    titleLine2: "Modern Distinction.",
    subtitle:
      "Trend Street redefines contemporary Indian menswear through heavyweight drape, architectural boxy fits, Okayama selvedge denim jeans, and handcrafted flight jackets.",
    primaryBtnText: "Explore The Drops",
    primaryBtnLink: "/shop",
    secondaryBtnText: "View Lookbook",
    secondaryBtnLink: "/lookbook",
    stat1Value: "520gsm",
    stat1Label: "Heavyweight Loopback",
    stat2Value: "14.5oz",
    stat2Label: "Okayama Selvedge Denim",
    stat3Value: "Boxy Cut",
    stat3Label: "Dropped-Shoulder Geometry",
  },
  marqueePhrases: [
    "HEAVYWEIGHT OVERSIZED HOODIES",
    "14.5OZ OKAYAMA REDLINE SELVEDGE JEANS",
    "BOXY FIT CROPPED GEOMETRY",
    "TUSCAN SUEDE & FLIGHT JACKETS",
    "COMPLIMENTARY EXPRESS COURIER ACROSS INDIA",
    "520GSM JAPANESE FRENCH LOOPBACK TERRY",
  ],
  categoryTaglines: {
    Oversized: "520gsm Loopback & Combed Cotton",
    Jeans: "14.5oz Okayama Shuttle Looms",
    "Boxy Fit": "Structured Minimalist Geometry",
    Jackets: "Tuscan Suede & Duck Canvas",
  },
  promoCodes: [
    { code: "TREND10", discountPercent: 10, description: "Inaugural Offer: 10% off on orders above ₹1,999." },
    { code: "BUNDLE15", discountPercent: 15, description: "VIP Outfit Bundle: 15% off complete streetwear looks." },
    { code: "STREET20", discountPercent: 20, description: "Seasonal Drop: 20% off on orders above ₹3,999." },
    { code: "FREESHIP", discountPercent: 0, description: "Complimentary priority courier delivery across India." },
  ],
  contactInfo: {
    email: "concierge@trendstreet.in",
    phone: "+91 98200 12345",
    address: "Atelier 4, Pali Hill Road, Bandra West, Mumbai 400050, India",
    hours: "Monday – Saturday: 10:00 AM – 8:00 PM IST",
  },
};

const INITIAL_ORDERS: Order[] = [
  {
    id: "ord-1001",
    orderNumber: "TS-2026-8941",
    createdAt: "2026-10-14T14:32:00Z",
    status: "Delivered",
    items: [
      {
        productId: "ts-001",
        productName: "The Mayfair Heavyweight Oversized Tee",
        price: 2499,
        selectedSize: "L",
        selectedColor: "Deep Burgundy",
        quantity: 1,
        image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop",
      },
      {
        productId: "ts-004",
        productName: "The Shibuya Relaxed Carpenter Jeans",
        price: 5499,
        selectedSize: "32",
        selectedColor: "Washed Vintage Blue",
        quantity: 1,
        image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop",
      },
    ],
    subtotal: 7998,
    discount: 799.8,
    shipping: 0,
    tax: 0,
    total: 7198.2,
    promoCode: "TREND10",
    customer: {
      fullName: "Aarav Sharma",
      email: "aarav.sharma@trendstreet.in",
      phone: "+91 98200 12345",
      address: "Flat 402, Sea Green Apartments, Bandra West",
      city: "Mumbai",
      postalCode: "400050",
      country: "India",
    },
    deliveryMethod: "vip_courier",
    paymentMethod: "upi",
    trackingNumber: "DELHIVERY-AWB-9948210IN",
    estimatedDelivery: "2026-10-16",
  },
  {
    id: "ord-1002",
    orderNumber: "TS-2026-9214",
    createdAt: "2026-10-18T09:15:00Z",
    status: "In Transit",
    items: [
      {
        productId: "ts-010",
        productName: "The Tuscan Suede MA-1 Flight Jacket",
        price: 8999,
        selectedSize: "L",
        selectedColor: "Deep Burgundy",
        quantity: 1,
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop",
      },
    ],
    subtotal: 8999,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 8999,
    customer: {
      fullName: "Aarav Sharma",
      email: "aarav.sharma@trendstreet.in",
      phone: "+91 98200 12345",
      address: "Flat 402, Sea Green Apartments, Bandra West",
      city: "Mumbai",
      postalCode: "400050",
      country: "India",
    },
    deliveryMethod: "vip_courier",
    paymentMethod: "card",
    trackingNumber: "BLUEDART-EXP-773190IN",
    estimatedDelivery: "2026-10-21",
  },
];

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  // Only this shopper's own receipts — never demo orders.
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Hydrate from localStorage safely on mount
  useEffect(() => {
    try {
      // Products and settings come from the database (see the fetch below), not browser storage.
      localStorage.removeItem("ts_site_settings");
      localStorage.removeItem("ts_products");

      const storedCart = localStorage.getItem("ts_cart");
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }

      const storedWishlist = localStorage.getItem("ts_wishlist");
      if (storedWishlist) {
        setWishlist(JSON.parse(storedWishlist));
      }

      const storedOrders = localStorage.getItem("ts_orders");
      if (storedOrders) {
        // Drop the demo orders older builds seeded into every browser.
        const demoIds = new Set(INITIAL_ORDERS.map((o) => o.id));
        setOrders((JSON.parse(storedOrders) as Order[]).filter((o) => !demoIds.has(o.id)));
      }

      const storedUser = localStorage.getItem("ts_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to load local storage state:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Live catalog + CMS settings from the database (edited in /admin).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/storefront")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { products: Product[]; settings: Partial<SiteSettings> }) => {
        if (cancelled) return;
        if (Array.isArray(data.products) && data.products.length) {
          setProducts(data.products);
          // Re-price bag items against the latest catalog.
          setCart((prev) =>
            prev
              .map((item) => {
                const fresh = data.products.find((p) => p.id === item.product.id);
                return fresh ? { ...item, product: fresh } : null;
              })
              .filter((x): x is CartItem => x !== null)
          );
        }
        if (data.settings) {
          setSiteSettings((prev) => ({
            ...prev,
            ...data.settings,
            topAnnouncement: { ...prev.topAnnouncement, ...(data.settings.topAnnouncement || {}) },
            hero: { ...prev.hero, ...(data.settings.hero || {}) },
            contactInfo: { ...prev.contactInfo, ...(data.settings.contactInfo || {}) },
          }));
        }
      })
      .catch((e) => console.warn("Live catalog unavailable, showing bundled catalog:", e));
    return () => {
      cancelled = true;
    };
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("ts_cart", JSON.stringify(cart));
      localStorage.setItem("ts_wishlist", JSON.stringify(wishlist));
      localStorage.setItem("ts_orders", JSON.stringify(orders));
      localStorage.setItem("ts_user", JSON.stringify(user));
    } catch (e) {
      console.error("Failed to persist state:", e);
    }
  }, [cart, wishlist, orders, user, isHydrated]);

  const addToCart = (product: Product, size: string, color: string, quantity = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
      );

      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += quantity;
        return newCart;
      } else {
        return [...prevCart, { product, selectedSize: size, selectedColor: color, quantity }];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) =>
          !(item.product.id === productId && item.selectedSize === size && item.selectedColor === color)
      )
    );
  };

  const updateCartQuantity = (productId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId && item.selectedSize === size && item.selectedColor === color
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setPromoCode(null);
    setDiscountRate(0);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const applyPromoCode = (code: string): { success: boolean; message: string } => {
    const cleanCode = code.trim().toUpperCase();
    // Only codes the server honours can be applied, so the bag never promises a discount checkout won't give.
    const found = VALID_PROMO_CODES[cleanCode];
    if (found) {
      const minSpend = found.minSpendMinor / 100;
      if (cartSubtotal < minSpend) {
        return { success: false, message: `${cleanCode} needs a bag of ₹${minSpend.toLocaleString("en-IN")} or more.` };
      }
      setPromoCode(cleanCode);
      setDiscountRate(found.percent / 100);
      return { success: true, message: found.percent > 0 ? `${found.description} (${found.percent}% off applied)` : found.description };
    }
    return { success: false, message: "Invalid promo code. Please check your spelling or contact concierge." };
  };

  const updateSiteSettings = (newSettings: Partial<SiteSettings>) => {
    setSiteSettings((prev) => ({
      ...prev,
      ...newSettings,
      hero: { ...prev.hero, ...(newSettings.hero || {}) },
      topAnnouncement: { ...prev.topAnnouncement, ...(newSettings.topAnnouncement || {}) },
      contactInfo: { ...prev.contactInfo, ...(newSettings.contactInfo || {}) },
      categoryTaglines: { ...prev.categoryTaglines, ...(newSettings.categoryTaglines || {}) },
    }));
  };

  const resetSiteSettings = () => {
    setSiteSettings(DEFAULT_SITE_SETTINGS);
  };

  const removePromoCode = () => {
    setPromoCode(null);
    setDiscountRate(0);
  };

  const createOrder = (
    orderInput: Omit<Order, "id" | "orderNumber" | "createdAt" | "status" | "trackingNumber" | "estimatedDelivery"> & {
      orderNumber: string;
      status?: OrderStatus;
    }
  ): Order => {
    const date = new Date();
    const estDate = new Date();
    estDate.setDate(date.getDate() + 3);

    const newOrder: Order = {
      ...orderInput,
      // Local receipt copy of a server-saved order — the order number comes from the database.
      id: orderInput.orderNumber,
      createdAt: date.toISOString(),
      status: orderInput.status ?? "Confirmed",
      trackingNumber: "Assigned at dispatch",
      estimatedDelivery: estDate.toISOString().split("T")[0],
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status } : ord))
    );
  };

  const addProduct = (productInput: Omit<Product, "id" | "rating" | "reviewsCount" | "reviews">): Product => {
    const newProduct: Product = {
      ...productInput,
      id: `ts-${Date.now()}`,
      rating: 5.0,
      reviewsCount: 1,
      reviews: [
        {
          id: `rev-${Date.now()}`,
          author: "Trend Street Atelier",
          rating: 5,
          date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          title: "Craftsmanship Certified",
          comment: "Inspected and certified by Trend Street Atelier.",
          verified: true,
        },
      ],
    };

    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...profile }));
  };

  // Calculations
  // Same engine the server uses (src/lib/pricing.ts), so the bag total always matches what checkout charges.
  const pricing = calculateOrderPricing(
    cart.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      unitPriceMinor: Math.round(item.product.price * 100),
      quantity: item.quantity,
      size: item.selectedSize,
      color: item.selectedColor,
    })),
    { promoCode, deliveryMethod: "standard", currency: "INR" }
  );
  const cartSubtotal = pricing.subtotalMinor / 100;
  const cartDiscount = pricing.discountMinor / 100;
  const cartShipping = pricing.shippingMinor / 100;
  const cartTax = pricing.taxMinor / 100; // GST included in prices — shown, not added
  const cartTotal = pricing.totalMinor / 100;
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        products,
        siteSettings,
        updateSiteSettings,
        resetSiteSettings,
        cart,
        wishlist,
        orders,
        user,
        promoCode,
        discountRate,
        isCartOpen,
        quickViewProduct,
        setIsCartOpen,
        setQuickViewProduct,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        applyPromoCode,
        removePromoCode,
        createOrder,
        updateOrderStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        updateUserProfile,
        cartSubtotal,
        cartDiscount,
        cartShipping,
        cartTax,
        cartTotal,
        cartItemsCount,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
