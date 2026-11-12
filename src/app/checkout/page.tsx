"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle,
  ArrowRight,
  Lock,
  Banknote,
  MapPin,
  Check,
  AlertCircle,
} from "lucide-react";

// Razorpay test keys start with rzp_test_; the sandbox notice is only shown then.
const IS_RAZORPAY_TEST = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").startsWith("rzp_test_");

const inputClass =
  "w-full min-h-[48px] rounded-lg border border-burgundy/20 bg-ivory px-3.5 py-3 text-sm text-espresso focus:border-burgundy focus:outline-none";
const labelClass = "mb-1.5 block text-xs font-semibold text-espresso";
import { INDIAN_STATES_AND_UTS } from "@/lib/indian-states";
import { useUserAuth } from "@/context/UserAuthContext";
import { useAccount } from "@/context/AccountContext";
import { useStore, useStoreConfig } from "@/context/StoreContext";
import { shippingRulesFromConfig } from "@/lib/store-config";
import { formatPrice, calculateOrderPricing } from "@/lib/pricing";
import { checkPincodeServiceability, PincodeServiceability } from "@/lib/pincode";



const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    promoCode,
    coupon,
    createOrder,
    user,
    updateUserProfile,
  } = useStore();
  const config = useStoreConfig();
  const { isAuthenticated } = useUserAuth();
  const account = useAccount();
  // Signed in: offer to keep a new address in the account for next time.
  const [saveToAccount, setSaveToAccount] = useState(true);

  const [step, setStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form State initialized with Indian defaults
  const [formData, setFormData] = useState({
    // Never pre-fill a stranger's details — only the shopper's own saved profile.
    fullName: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.savedAddresses[0]?.address || "",
    apartment: "",
    landmark: "",
    city: user.savedAddresses[0]?.city || "",
    state: user.savedAddresses[0]?.state || "",
    postalCode: user.savedAddresses[0]?.postalCode || "",
    country: "India",
    // Standard is the default: it is what the bag drawer quotes, so the total doesn't jump at checkout.
    deliveryMethod: "standard" as "standard" | "express" | "vip_courier",
    paymentMethod: "upi" as "card" | "upi" | "netbanking" | "cod",
    upiApp: "gpay" as "gpay" | "phonepe" | "paytm" | "bhim" | "custom",
    upiId: "",
    cardNumber: "",
    cardExp: "",
    cardCvv: "",
    cardName: "",
    bankName: "",
  });

  type SavedAddr = (typeof user.savedAddresses)[number];
  const pickAddress = (a: SavedAddr) =>
    setFormData((f) => ({
      ...f,
      fullName: a.fullName || f.fullName,
      phone: a.phone || f.phone,
      address: a.address,
      apartment: a.apartment || "",
      city: a.city,
      state: a.state || "",
      postalCode: a.postalCode,
    }));
  const sameAddress = (a: SavedAddr) =>
    a.address.trim().toLowerCase() === formData.address.trim().toLowerCase() && a.postalCode === formData.postalCode;
  const isSavedAddress = user.savedAddresses.some(sameAddress);

  // Saved addresses and details arrive after sign-in loads: fill the form once if it's still empty.
  const prefilled = React.useRef(false);
  useEffect(() => {
    if (prefilled.current) return;
    const def = user.savedAddresses.find((a) => a.isDefault) ?? user.savedAddresses[0];
    if (!def && !user.name) return;
    prefilled.current = true;
    setFormData((f) => ({
      ...f,
      fullName: f.fullName || def?.fullName || user.name,
      email: f.email || user.email,
      phone: f.phone || def?.phone || user.phone,
      ...(def && !f.address
        ? { address: def.address, apartment: def.apartment || "", city: def.city, state: def.state || "", postalCode: def.postalCode }
        : {}),
    }));
  }, [user.savedAddresses, user.name, user.email, user.phone]);

  /** After a successful order: remember details (and the address, for accounts), refresh "My orders". */
  const afterOrderPlaced = () => {
    updateUserProfile({ name: formData.fullName, email: formData.email, phone: formData.phone });
    if (isAuthenticated && account.status === "ready") {
      if (saveToAccount && !isSavedAddress) {
        void account.saveAddress({
          label: user.savedAddresses.length ? "Address" : "Home",
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.landmark ? `${formData.address}, Near ${formData.landmark}` : formData.address,
          apartment: formData.apartment,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          isDefault: user.savedAddresses.length === 0,
        });
      }
      void account.refresh();
    }
  };

  // Price with the delivery method actually chosen, using the same engine the server charges with.
  const pricing = calculateOrderPricing(
    cart.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      unitPriceMinor: Math.round(item.product.price * 100),
      quantity: item.quantity,
      size: item.selectedSize,
      color: item.selectedColor,
    })),
    {
      coupon,
      deliveryMethod: config.shipping.expressEnabled ? formData.deliveryMethod : "standard",
      currency: "INR",
      shipping: shippingRulesFromConfig(config),
    }
  );
  const cartSubtotal = pricing.subtotalMinor / 100;
  const cartDiscount = pricing.discountMinor / 100;
  const cartShipping = pricing.shippingMinor / 100;
  const cartTax = pricing.taxMinor / 100;
  const cartTotal = pricing.totalMinor / 100;

  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [pincodeServiceability, setPincodeServiceability] = useState<PincodeServiceability | null>(null);

  // Check initial PIN code serviceability on mount or postalCode changes
  useEffect(() => {
    if (formData.postalCode && formData.postalCode.length === 6) {
      const result = checkPincodeServiceability(formData.postalCode);
      setPincodeServiceability(result);
    }
  }, [formData.postalCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (step1Error) setStep1Error(null);
    if (validationError) setValidationError(null);

    // Auto-validate and resolve Indian PIN code on 6 digits
    if (name === "postalCode") {
      const cleanPin = value.trim();
      if (cleanPin.length === 6) {
        const result = checkPincodeServiceability(cleanPin);
        setPincodeServiceability(result);
        if (result.isValid && result.city && result.state) {
          setFormData((prev) => ({
            ...prev,
            postalCode: cleanPin,
            city: result.city || prev.city,
            state: result.state || prev.state,
          }));
        }
      } else {
        setPincodeServiceability(null);
      }
    }
  };

  // Moving between steps: bring the new step into view (on phones the button sits far below it).
  const firstStepRender = React.useRef(true);
  useEffect(() => {
    if (firstStepRender.current) {
      firstStepRender.current = false;
      return;
    }
    document.getElementById("checkout-steps")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const validateAndProceedToStep2 = () => {
    const required: [keyof typeof formData, string][] = [
      ["fullName", "full name"],
      ["email", "email"],
      ["phone", "mobile number"],
      ["address", "house / street"],
      ["postalCode", "PIN code"],
      ["city", "city"],
      ["state", "state"],
    ];
    const missing = required.filter(([key]) => !String(formData[key] ?? "").trim());
    if (missing.length) {
      setStep1Error(`Please add your ${missing.map(([, label]) => label).join(", ")}.`);
      // On phones the message sits above the fold — take the shopper straight to the first gap.
      const el = document.getElementById(`checkout-${missing[0][0]}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
      return false;
    }

    if (formData.country === "India") {
      const serviceCheck = checkPincodeServiceability(formData.postalCode);
      if (!serviceCheck.isValid) {
        setStep1Error("Please enter a valid 6-digit Indian PIN code (e.g. 342008, 110001, 560001).");
        document.getElementById("checkout-postalCode")?.focus();
        return false;
      }
      setPincodeServiceability(serviceCheck);
    }

    setStep1Error(null);
    setStep(2);
    return true;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      validateAndProceedToStep2();
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    handleSubmitOrder(e);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setValidationError(null);

    // 1. CASH ON DELIVERY (COD) DIRECT PROCESSING
    if (formData.paymentMethod === "cod") {
      try {
        // Saved server-side: prices recomputed, order + items written to the database.
        const response = await fetch("/api/orders/cod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart.map((item) => ({
              productId: item.product.id,
              size: item.selectedSize,
              color: item.selectedColor,
              quantity: item.quantity,
            })),
            customer: {
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
              apartment: formData.apartment,
              landmark: formData.landmark,
              city: formData.city,
              state: formData.state,
              postalCode: formData.postalCode,
            },
            promoCode: coupon?.code || undefined,
            deliveryMethod: formData.deliveryMethod,
          }),
        });

        const codData = await response.json();

        if (!response.ok || !codData.success) {
          setValidationError(codData.error || "We couldn't place your order. Please try again.");
          setIsProcessing(false);
          return;
        }

        const orderItems = cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          quantity: item.quantity,
          image: item.product.images[0],
        }));

        const newOrder = createOrder({
          orderNumber: codData.orderNumber,
          status: "Pending",
          items: orderItems,
          subtotal: codData.pricing.subtotalMinor / 100,
          discount: codData.pricing.discountMinor / 100,
          shipping: codData.pricing.shippingMinor / 100,
          tax: codData.pricing.taxMinor / 100,
          total: codData.pricing.totalMinor / 100,
          promoCode: coupon?.code || undefined,
          customer: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: `${formData.address}${formData.apartment ? `, ${formData.apartment}` : ""}${formData.landmark ? `, Near ${formData.landmark}` : ""}, ${formData.state}`,
            apartment: formData.apartment,
            city: formData.city,
            postalCode: formData.postalCode,
            country: formData.country,
          },
          deliveryMethod: formData.deliveryMethod,
          paymentMethod: formData.paymentMethod,
        });

        setIsProcessing(false);
        afterOrderPlaced();
        router.push(`/order-confirmation/${newOrder.id}`);
      } catch (err) {
        console.error("COD Order completion error:", err);
        setValidationError("Unable to place COD order. Please check connection and try again.");
        setIsProcessing(false);
      }
      return;
    }

    // 2. ONLINE PAYMENT VIA RAZORPAY (UPI / CARD / NETBANKING)
    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || typeof (window as any).Razorpay === "undefined") {
        setValidationError("Unable to load secure Razorpay gateway. Please check connection or disable ad-blockers.");
        setIsProcessing(false);
        return;
      }

      // Initialize server-authoritative Razorpay Order
      const createOrderRes = await fetch("/api/payment/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            price: item.product.price,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
            quantity: item.quantity,
          })),
          customer: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            apartment: formData.apartment,
            landmark: formData.landmark,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
          },
          promoCode: coupon?.code || undefined,
          deliveryMethod: formData.deliveryMethod,
        }),
      });

      const orderData = await createOrderRes.json();

      if (!createOrderRes.ok || !orderData.success) {
        setValidationError(orderData.error || "Failed to initialize payment gateway. Please retry.");
        setIsProcessing(false);
        return;
      }

      // Launch Razorpay Standard Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "OFFVYBE",
        description: "Luxury Indian Menswear Order",
        order_id: orderData.orderId,
        image: "/icon.png",
        handler: async function (paymentResponse: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          try {
            // Cryptographic server-side verification
            const verifyRes = await fetch("/api/payment/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success || !verifyData.verified) {
              setValidationError(
                verifyData.error || "We couldn't confirm your payment. Please contact us before paying again."
              );
              setIsProcessing(false);
              return;
            }

            // Sync with local client order state
            const orderItems = cart.map((item) => ({
              productId: item.product.id,
              productName: item.product.name,
              price: item.product.price,
              selectedSize: item.selectedSize,
              selectedColor: item.selectedColor,
              quantity: item.quantity,
              image: item.product.images[0],
            }));

            const newOrder = createOrder({
              orderNumber: verifyData.orderNumber || orderData.orderNumber,
              items: orderItems,
              // Totals as saved on the server at create-order.
              subtotal: orderData.pricing.subtotalMinor / 100,
              discount: orderData.pricing.discountMinor / 100,
              shipping: orderData.pricing.shippingMinor / 100,
              tax: orderData.pricing.taxMinor / 100,
              total: orderData.pricing.totalMinor / 100,
              promoCode: coupon?.code || undefined,
              customer: {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                address: `${formData.address}${formData.apartment ? `, ${formData.apartment}` : ""}${formData.landmark ? `, Near ${formData.landmark}` : ""}, ${formData.state}`,
                apartment: formData.apartment,
                city: formData.city,
                postalCode: formData.postalCode,
                country: formData.country,
              },
              deliveryMethod: formData.deliveryMethod,
              paymentMethod: formData.paymentMethod,
            });

            setIsProcessing(false);
            afterOrderPlaced();
            router.push(`/order-confirmation/${newOrder.id}`);
          } catch (verifyErr) {
            console.error("Signature verification error:", verifyErr);
            setValidationError("Network error during payment verification. Please contact support.");
            setIsProcessing(false);
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#4A0E17", // burgundy luxury shade
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on("payment.failed", function (failResp: any) {
        setValidationError(failResp.error?.description || "Payment attempt failed. Please check credentials or retry.");
        setIsProcessing(false);
      });
      rzpInstance.open();
    } catch (err: any) {
      console.error("Razorpay workflow error:", err);
      setValidationError(err.message || "An unexpected error occurred during checkout.");
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-espresso">Your Bag is Empty</h2>
        <p className="text-xs text-espresso/60">There are no luxury menswear items in your bag to checkout.</p>
        <Link
          href="/shop"
          className="inline-block py-3 px-6 bg-burgundy text-ivory text-xs font-bold uppercase rounded shadow-sm hover:bg-crimson transition-colors"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-12 space-y-5 sm:space-y-8">
      {/* Header + steps */}
      <div className="space-y-4 border-b border-burgundy/15 pb-5 sm:flex sm:items-end sm:justify-between sm:space-y-0 sm:pb-6">
        <div>
          <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-crimson">
            <Lock className="h-3 w-3" /> Secure checkout
          </span>
          <h1 className="font-serif text-2xl font-bold text-espresso sm:text-3xl">Checkout</h1>
        </div>

        <ol id="checkout-steps" className="scroll-mt-24 grid grid-cols-3 gap-1.5 text-xs font-semibold sm:flex sm:gap-2" aria-label="Checkout steps">
          {["Address", "Delivery", "Payment"].map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const current = step === n;
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={n >= step}
                  onClick={() => setStep(n)}
                  aria-current={current ? "step" : undefined}
                  className={`flex min-h-[40px] w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 transition-colors sm:w-auto ${
                    current ? "bg-burgundy font-bold text-gold" : done ? "bg-burgundy/10 text-burgundy" : "bg-ivory-dark text-espresso/60"
                  }`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${current ? "bg-gold/20" : done ? "bg-burgundy text-ivory" : "bg-white/70"}`}>
                    {done ? <Check className="h-3 w-3" /> : n}
                  </span>
                  {label}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Phones: the total is otherwise only visible below the form */}
      <a
        href="#order-summary"
        className="flex min-h-[48px] items-center justify-between rounded-xl border border-burgundy/15 bg-white px-4 text-sm lg:hidden"
      >
        <span className="text-espresso/70">
          {(() => { const n = cart.reduce((s, i) => s + i.quantity, 0); return `${n} ${n === 1 ? "item" : "items"}`; })()} · <span className="text-burgundy underline underline-offset-2">View summary</span>
        </span>
        <span className="font-bold text-burgundy">{formatPrice(cartTotal)}</span>
      </a>

      {validationError && (
        <div className="p-4 bg-crimson/10 border border-crimson/30 rounded-xl flex items-center gap-3 text-xs text-crimson font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Interactive Checkout Form */}
        <form onSubmit={handleFormSubmit} className="lg:col-span-8 space-y-6">
          {/* STEP 1: SHIPPING ADDRESS */}
          {step === 1 && (
            <div className="bg-white p-4 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-burgundy/10">
                <h2 className="font-serif text-lg font-bold text-espresso flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-burgundy" />
                  <span>Delivery address</span>
                </h2>
                <span className="text-[11px] text-espresso/60">India only</span>
              </div>

              {step1Error && (
                <div className="p-3 bg-crimson/10 border border-crimson/30 rounded-lg text-xs text-crimson font-medium">
                  {step1Error}
                </div>
              )}

              {user.savedAddresses.length > 0 && (
                <div>
                  <p className={labelClass}>Deliver to a saved address</p>
                  <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
                    {user.savedAddresses.map((a) => {
                      const active = sameAddress(a);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => pickAddress(a)}
                          aria-pressed={active}
                          className={`flex min-h-[56px] w-[220px] flex-shrink-0 flex-col items-start justify-center rounded-xl border px-3 py-2 text-left transition-colors sm:w-auto sm:max-w-[260px] ${
                            active ? "border-burgundy bg-burgundy/5 ring-1 ring-burgundy" : "border-burgundy/20 bg-white hover:border-burgundy/50"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 text-xs font-bold text-espresso">
                            {active && <Check className="h-3.5 w-3.5 text-burgundy" />} {a.label || "Address"}
                            {a.isDefault && <span className="rounded-full bg-gold/20 px-1.5 text-[10px] font-bold uppercase text-gold-dark">Default</span>}
                          </span>
                          <span className="mt-0.5 line-clamp-1 text-[11px] text-espresso/65">
                            {a.address}, {a.city} – {a.postalCode}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="checkout-fullName" className={labelClass}>
                    Full name
                  </label>
                  <input
                    id="checkout-fullName"
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="checkout-email" className={labelClass}>
                    Email (for your receipt)
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    name="email"
                    autoComplete="email" inputMode="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="checkout-phone" className={labelClass}>
                    Mobile number (for delivery updates)
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel" inputMode="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="checkout-address" className={labelClass}>
                    House / flat no., building, street
                  </label>
                  <input
                    id="checkout-address"
                    type="text"
                    name="address"
                    autoComplete="address-line1"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="checkout-apartment" className={labelClass}>
                    Area, floor (optional)
                  </label>
                  <input
                    id="checkout-apartment"
                    type="text"
                    name="apartment"
                    autoComplete="address-line2"
                    value={formData.apartment}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="checkout-landmark" className={labelClass}>
                    Landmark (optional)
                  </label>
                  <input
                    id="checkout-landmark"
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="checkout-postalCode" className={labelClass}>
                    PIN code
                  </label>
                  <input
                    id="checkout-postalCode"
                    type="text"
                    name="postalCode"
                    autoComplete="postal-code" inputMode="numeric"
                    required
                    maxLength={6}
                    value={formData.postalCode}
                    onChange={handleChange}
                    className={`${inputClass} tracking-widest`}
                  />
                </div>

                <div>
                  <label htmlFor="checkout-city" className={labelClass}>
                    City
                  </label>
                  <input
                    id="checkout-city"
                    type="text"
                    name="city"
                    autoComplete="address-level2"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="checkout-state" className={labelClass}>
                    State / UT
                  </label>
                  <select
                    id="checkout-state"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    autoComplete="address-level1"
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES_AND_UTS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* We deliver within India only — the order API validates Indian PIN codes. */}
              </div>

              {isAuthenticated && !isSavedAddress && formData.address.trim().length > 4 && (
                <label className="flex min-h-[44px] items-center gap-2.5 text-xs text-espresso">
                  <input
                    type="checkbox"
                    checked={saveToAccount}
                    onChange={(e) => setSaveToAccount(e.target.checked)}
                    className="h-4 w-4 accent-burgundy"
                  />
                  Save this address to my account for next time
                </label>
              )}

              {/* Real-time PIN code serviceability badge */}
              {pincodeServiceability && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    pincodeServiceability.isValid
                      ? "bg-green-50 border-green-200 text-green-900"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}
                >
                  {pincodeServiceability.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {pincodeServiceability.isValid
                        ? `PIN Code ${pincodeServiceability.pincode} Serviceable (${pincodeServiceability.tier})`
                        : "Invalid PIN Code"}
                    </span>
                    <p className="mt-0.5 opacity-90">{pincodeServiceability.message}</p>
                  </div>
                </div>
              )}

              <div className="pt-2 sm:flex sm:justify-end">
                <button
                  type="button"
                  onClick={validateAndProceedToStep2}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-burgundy px-8 text-sm font-bold uppercase tracking-wider text-ivory shadow-md transition-colors hover:bg-crimson sm:w-auto"
                >
                  <span>Continue to delivery</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DELIVERY OPTIONS */}
          {step === 2 && (
            <div className="bg-white p-4 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-burgundy/10">
                <h2 className="font-serif text-lg font-bold text-espresso flex items-center gap-2">
                  <Truck className="w-5 h-5 text-burgundy" />
                  <span>Delivery speed</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="-mr-2 min-h-[40px] px-2 text-xs font-semibold text-burgundy underline"
                >
                  Edit address
                </button>
              </div>

              <div className="space-y-3">
                {/* Express Courier — hidden when switched off in Admin → Settings → Delivery */}
                {config.shipping.expressEnabled && (
                <label
                  className={`p-4 rounded-xl border-2 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    formData.deliveryMethod === "express"
                      ? "border-burgundy bg-burgundy/5 shadow-xs"
                      : "border-ivory-dark hover:border-burgundy/30 bg-white"
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="express"
                      checked={formData.deliveryMethod === "express"}
                      onChange={handleChange}
                      className="h-5 w-5 flex-shrink-0 accent-burgundy"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-espresso">Express</span>
                        <span className="bg-gold text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-espresso/70 mt-0.5">
                        {config.shipping.expressDays} · Blue Dart / Delhivery Air · SMS tracking
                      </p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-sm font-bold text-green-800">
                    {pricing.isFreeShipping ? "Free" : formatPrice(config.shipping.express)}
                  </span>
                </label>
                )}

                {/* Standard Courier */}
                <label
                  className={`p-4 rounded-xl border-2 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    formData.deliveryMethod === "standard"
                      ? "border-burgundy bg-burgundy/5 shadow-xs"
                      : "border-ivory-dark hover:border-burgundy/30 bg-white"
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="standard"
                      checked={formData.deliveryMethod === "standard"}
                      onChange={handleChange}
                      className="h-5 w-5 flex-shrink-0 accent-burgundy"
                    />
                    <div>
                      <span className="font-bold text-sm text-espresso">Standard</span>
                      <p className="text-xs text-espresso/70 mt-0.5">
                        {config.shipping.standardDays} · Delhivery / DTDC
                      </p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-sm font-bold text-green-800">
                    {pricing.isFreeShipping ? "Free" : formatPrice(config.shipping.standard)}
                  </span>
                </label>
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[44px] text-sm font-semibold text-espresso hover:text-burgundy"
                >
                  ← Back to address
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-burgundy px-8 text-sm font-bold uppercase tracking-wider text-ivory shadow-md transition-colors hover:bg-crimson sm:w-auto"
                >
                  <span>Continue to payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT — card/UPI details are entered only in Razorpay's secure window */}
          {step === 3 && (
            <div className="bg-white p-4 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-burgundy/10">
                <h2 className="font-serif text-lg font-bold text-espresso">Payment</h2>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-800">
                  <Lock className="h-3.5 w-3.5" /> Secured by Razorpay
                </span>
              </div>

              {IS_RAZORPAY_TEST && process.env.NODE_ENV !== "production" && (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                  <span className="font-semibold">Test mode:</span> use a Razorpay test card or UPI ID. No real money moves.
                </div>
              )}

              <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                {[
                  {
                    id: "upi" as const,
                    title: "Pay online",
                    note: "UPI, cards or net banking in Razorpay's secure window",
                    Icon: CreditCard,
                  },
                  {
                    id: "cod" as const,
                    title: "Cash on delivery",
                    note: "Pay in cash or by UPI to the courier at your door",
                    Icon: Banknote,
                  },
                ]
                  // Cash on delivery can be switched off in Admin → Settings → Delivery & COD.
                  .filter((m) => m.id !== "cod" || config.cod.enabled)
                  .map(({ id, title, note, Icon }) => {
                  const selected = id === "cod" ? formData.paymentMethod === "cod" : formData.paymentMethod !== "cod";
                  return (
                    <label
                      key={id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                        selected ? "border-burgundy bg-burgundy/5 shadow-xs" : "border-ivory-dark bg-white hover:border-burgundy/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={id}
                        checked={selected}
                        onChange={() => setFormData({ ...formData, paymentMethod: id })}
                        className="h-5 w-5 flex-shrink-0 accent-burgundy"
                      />
                      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${selected ? "bg-burgundy text-gold" : "bg-ivory text-burgundy"}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-espresso">{title}</span>
                        <span className="block text-xs text-espresso/65">{note}</span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {formData.paymentMethod === "cod" ? (
                <p className="flex items-start gap-2 rounded-xl bg-ivory p-3 text-xs text-espresso/70">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-700" />
                  We&apos;ll call or WhatsApp you to confirm before dispatch. Available on serviceable PIN codes.
                </p>
              ) : (
                <p className="flex items-start gap-2 rounded-xl bg-ivory p-3 text-xs text-espresso/70">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-700" />
                  You&apos;ll pick UPI, card or net banking in the next step. OFFVYBE never sees your card details.
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] text-sm font-semibold text-espresso hover:text-burgundy"
                >
                  ← Back to delivery
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex min-h-[56px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-burgundy px-8 text-sm font-bold uppercase tracking-wider text-ivory shadow-xl transition-all hover:bg-crimson disabled:opacity-50 sm:w-auto"
                >
                  {isProcessing ? (
                    <span>Please wait…</span>
                  ) : (
                    <>
                      <span>
                        {formData.paymentMethod === "cod" ? "Place order" : "Pay"} · {formatPrice(cartTotal)}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Order Summary Sidebar */}
        <aside id="order-summary" className="lg:col-span-4 space-y-6 scroll-mt-24">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-burgundy/15 shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-espresso pb-2 border-b border-burgundy/10">
              Your Selection ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h3>

            <div data-lenis-prevent className="divide-y divide-ivory-dark max-h-72 overflow-y-auto pr-1 space-y-3">
              {cart.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                  className="pt-3 first:pt-0 flex items-center space-x-3"
                >
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    width={56}
                    height={64}
                    className="w-14 h-16 object-cover rounded bg-ivory-dark flex-shrink-0"
                  />
                  <div className="flex-1 text-xs">
                    <h5 className="font-serif font-bold text-espresso line-clamp-1">{item.product.name}</h5>
                    <p className="text-[11px] text-espresso/60">
                      Size: {item.selectedSize} × {item.quantity}
                    </p>
                    <span className="font-bold text-burgundy">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-xs text-espresso/80 pt-3 border-t border-burgundy/10">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(cartSubtotal)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-crimson font-medium">
                  <span>Discount ({promoCode})</span>
                  <span>-{formatPrice(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{cartShipping === 0 ? "Free" : formatPrice(cartShipping)}</span>
              </div>
              <div className="flex justify-between">
                <span>Includes GST</span>
                <span>{formatPrice(cartTax)}</span>
              </div>
              <div className="pt-2 border-t border-ivory-dark flex justify-between text-base font-bold text-burgundy">
                <span>Total</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-burgundy/10 space-y-2 text-[11px] text-espresso/60">
              <div className="flex items-center gap-1.5 text-green-800 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Secure payments by Razorpay</span>
              </div>
              <p>
                All prices include GST (5% on pieces up to ₹2,500, 18% above).
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
