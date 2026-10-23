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
  Sparkles,
  Building2,
  QrCode,
  Banknote,
  MapPin,
  Check,
  AlertCircle,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice, calculateOrderPricing } from "@/lib/pricing";
import { checkPincodeServiceability, PincodeServiceability } from "@/lib/pincode";

const INDIAN_STATES_AND_UTS = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

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
    createOrder,
    user,
    updateUserProfile,
  } = useStore();

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
    deliveryMethod: "express" as "standard" | "express" | "vip_courier",
    paymentMethod: "upi" as "card" | "upi" | "netbanking" | "cod",
    upiApp: "gpay" as "gpay" | "phonepe" | "paytm" | "bhim" | "custom",
    upiId: "",
    cardNumber: "",
    cardExp: "",
    cardCvv: "",
    cardName: "",
    bankName: "",
  });

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
    { promoCode, deliveryMethod: formData.deliveryMethod, currency: "INR" }
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

  const validateAndProceedToStep2 = () => {
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.state.trim() ||
      !formData.postalCode.trim()
    ) {
      setStep1Error("Please complete all required address fields before proceeding.");
      return false;
    }

    if (formData.country === "India") {
      const serviceCheck = checkPincodeServiceability(formData.postalCode);
      if (!serviceCheck.isValid) {
        setStep1Error("Please enter a valid 6-digit Indian PIN code (e.g. 400050, 110001, 560001).");
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
            promoCode: promoCode || undefined,
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
          promoCode: promoCode || undefined,
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
        // Remember contact details on this device so the next checkout fills itself in.
        updateUserProfile({ name: formData.fullName, email: formData.email, phone: formData.phone });
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
          promoCode: promoCode || undefined,
          deliveryMethod: formData.deliveryMethod,
          currency: "INR",
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
        name: "TREND STREET",
        description: "Luxury Indian Menswear Order",
        order_id: orderData.orderId,
        image: "/favicon.ico",
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
                orderData: {
                  customer: formData,
                  items: cart.map((item) => ({
                    productId: item.product.id,
                    productName: item.product.name,
                    price: item.product.price,
                    selectedSize: item.selectedSize,
                    selectedColor: item.selectedColor,
                    quantity: item.quantity,
                  })),
                  pricing: orderData.pricing,
                  promoCode: promoCode || undefined,
                  deliveryMethod: formData.deliveryMethod,
                  paymentMethod: formData.paymentMethod,
                },
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success || !verifyData.verified) {
              setValidationError(
                verifyData.error || "Payment cryptographic signature verification failed. Please contact concierge."
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

            if (!verifyData.saved) {
              console.warn("Payment verified but order not saved; payment id:", paymentResponse.razorpay_payment_id);
            }

            const newOrder = createOrder({
              // If saving failed, the Razorpay payment id is the reference our team can trace.
              orderNumber: verifyData.orderNumber || paymentResponse.razorpay_payment_id,
              items: orderItems,
              subtotal: cartSubtotal,
              discount: cartDiscount,
              shipping: cartShipping,
              tax: cartTax,
              total: cartTotal,
              promoCode: promoCode || undefined,
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
            // Remember contact details on this device so the next checkout fills itself in.
            updateUserProfile({ name: formData.fullName, email: formData.email, phone: formData.phone });
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Checkout Progress Header */}
      <div className="pb-6 border-b border-burgundy/15 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-crimson block mb-1">
            256-Bit SSL Encrypted Luxury Atelier Checkout
          </span>
          <h1 className="font-serif text-3xl font-bold text-espresso">
            Trend Street Atelier Checkout
          </h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-3 text-xs font-semibold">
          <span
            className={`px-3 py-1 rounded-full ${
              step >= 1 ? "bg-burgundy text-gold font-bold" : "bg-ivory-dark text-espresso/50"
            }`}
          >
            1. Shipping
          </span>
          <span className="text-burgundy/40">→</span>
          <span
            className={`px-3 py-1 rounded-full ${
              step >= 2 ? "bg-burgundy text-gold font-bold" : "bg-ivory-dark text-espresso/50"
            }`}
          >
            2. Delivery
          </span>
          <span className="text-burgundy/40">→</span>
          <span
            className={`px-3 py-1 rounded-full ${
              step >= 3 ? "bg-burgundy text-gold font-bold" : "bg-ivory-dark text-espresso/50"
            }`}
          >
            3. Payment
          </span>
        </div>
      </div>

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
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-burgundy/10">
                <h3 className="font-serif text-lg font-bold text-espresso flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-burgundy" />
                  <span>1. Shipping & Doorstep Delivery Destination</span>
                </h3>
                <span className="text-[11px] text-green-800 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Identity Verified
                </span>
              </div>

              {step1Error && (
                <div className="p-3 bg-crimson/10 border border-crimson/30 rounded-lg text-xs text-crimson font-medium">
                  {step1Error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label htmlFor="checkout-fullName" className="block font-semibold text-espresso mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    id="checkout-fullName"
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full bg-ivory px-3.5 py-2.5 rounded border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-email" className="block font-semibold text-espresso mb-1">
                    Email Address (Order & Invoice Dispatch) *
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="aarav@example.com"
                    className="w-full bg-ivory px-3.5 py-2.5 rounded border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-phone" className="block font-semibold text-espresso mb-1">
                    Mobile Phone (+91 Indian Courier SMS & OTP) *
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98200 12345"
                    className="w-full bg-ivory px-3.5 py-2.5 rounded border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="checkout-address" className="block font-semibold text-espresso mb-1">
                    Flat / House No., Building, Street Address *
                  </label>
                  <input
                    id="checkout-address"
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Plot 42, Waterfield Road"
                    className="w-full bg-ivory px-3.5 py-2.5 rounded border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-apartment" className="block font-semibold text-espresso mb-1">
                    Apartment / Suite / Floor (Optional)
                  </label>
                  <input
                    id="checkout-apartment"
                    type="text"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleChange}
                    placeholder="Flat 402, Sea Pearl Apartments"
                    className="w-full bg-ivory px-3.5 py-2.5 rounded border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-landmark" className="block font-semibold text-espresso mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    id="checkout-landmark"
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="Near Mehboob Studio / Bandra Post Office"
                    className="w-full bg-ivory px-3.5 py-2.5 rounded border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-postalCode" className="block font-semibold text-espresso mb-1">
                    6-Digit PIN Code *
                  </label>
                  <input
                    id="checkout-postalCode"
                    type="text"
                    name="postalCode"
                    required
                    maxLength={6}
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="400050"
                    className="w-full bg-ivory px-3.5 py-2.5 rounded border border-burgundy/20 text-espresso font-mono focus:outline-none focus:border-burgundy"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-city" className="block font-semibold text-espresso mb-1">
                    City *
                  </label>
                  <input
                    id="checkout-city"
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Mumbai"
                    className="w-full bg-ivory px-3.5 py-2.5 rounded border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-state" className="block font-semibold text-espresso mb-1">
                    State / Union Territory *
                  </label>
                  <select
                    id="checkout-state"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full bg-ivory px-3.5 py-2.5 rounded border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy cursor-pointer"
                  >
                    <option value="">Select State / UT</option>
                    {INDIAN_STATES_AND_UTS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="checkout-country" className="block font-semibold text-espresso mb-1">
                    Country / Region *
                  </label>
                  <select
                    id="checkout-country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full bg-ivory px-3.5 py-2.5 rounded border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy cursor-pointer"
                  >
                    <option value="India">India (Domestic Luxury Courier)</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Singapore">Singapore</option>
                  </select>
                </div>
              </div>

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

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={validateAndProceedToStep2}
                  className="py-3 px-8 bg-burgundy hover:bg-crimson text-ivory text-xs font-bold uppercase tracking-[0.2em] rounded-lg transition-colors flex items-center gap-2 shadow-md"
                >
                  <span>Continue to Delivery Options</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DELIVERY OPTIONS */}
          {step === 2 && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-burgundy/10">
                <h3 className="font-serif text-lg font-bold text-espresso flex items-center gap-2">
                  <Truck className="w-5 h-5 text-burgundy" />
                  <span>2. Select Premium Courier Dispatch</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-burgundy underline font-semibold"
                >
                  Edit Address
                </button>
              </div>

              <div className="space-y-3">
                {/* Express Courier */}
                <label
                  className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
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
                      className="text-burgundy focus:ring-burgundy w-4 h-4"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-espresso">
                          Blue Dart Apex / Delhivery Air (Express Air Courier)
                        </span>
                        <span className="bg-gold text-espresso text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-espresso/70 mt-0.5">
                        Delivered in 2–3 business days with real-time SMS tracking and signature handover.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-green-800">
                    {cartSubtotal >= 1999 ? "Complimentary" : formatPrice(250)}
                  </span>
                </label>

                {/* Standard Courier */}
                <label
                  className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
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
                      className="text-burgundy focus:ring-burgundy w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-xs text-espresso">
                        Delhivery Surface / DTDC Priority Ground
                      </span>
                      <p className="text-[11px] text-espresso/70 mt-0.5">
                        Estimated arrival: 4–5 business days across India.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-green-800">
                    {cartSubtotal >= 1999 ? "Complimentary" : formatPrice(150)}
                  </span>
                </label>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-espresso hover:text-burgundy"
                >
                  ← Back to Address
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="py-3 px-8 bg-burgundy hover:bg-crimson text-ivory text-xs font-bold uppercase tracking-[0.2em] rounded-lg transition-colors flex items-center gap-2 shadow-md"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD */}
          {step === 3 && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-burgundy/10">
                <h3 className="font-serif text-lg font-bold text-espresso">
                  3. Select Payment Experience
                </h3>
                <div className="flex items-center space-x-1.5 text-xs text-green-800 font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>RBI Compliant & 256-Bit SSL</span>
                </div>
              </div>

              {/* Razorpay Test Mode Banner */}
              <div className="bg-amber-50 border border-amber-200/80 text-amber-900 px-4 py-3 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="font-semibold">Razorpay Sandbox Active:</span>
                  <span className="text-amber-800">
                    Test Mode active. Use any Razorpay test card / UPI handle. Live payments are securely disabled.
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded tracking-wider">
                  rzp_test
                </span>
              </div>

              {/* Payment Type Selection Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "upi", label: "Instant UPI", icon: QrCode },
                  { id: "card", label: "Cards / RuPay", icon: CreditCard },
                  { id: "netbanking", label: "Net Banking", icon: Building2 },
                  { id: "cod", label: "Cash on Delivery", icon: Banknote },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = formData.paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          paymentMethod: m.id as "card" | "upi" | "netbanking" | "cod",
                        })
                      }
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? "bg-burgundy text-gold border-burgundy shadow-sm"
                          : "bg-ivory text-espresso border-burgundy/15 hover:border-burgundy"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[11px] font-bold">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* UPI Inputs */}
              {formData.paymentMethod === "upi" && (
                <div className="p-5 bg-ivory rounded-xl border border-burgundy/10 text-xs space-y-4">
                  <div>
                    <span className="font-bold text-espresso block mb-2">Preferred UPI App</span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {[
                        { id: "gpay", name: "Google Pay" },
                        { id: "phonepe", name: "PhonePe" },
                        { id: "paytm", name: "Paytm" },
                        { id: "bhim", name: "BHIM UPI" },
                        { id: "custom", name: "UPI ID / VPA" },
                      ].map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, upiApp: app.id as any })}
                          className={`py-2 px-2 rounded border text-center font-medium transition-all ${
                            formData.upiApp === app.id
                              ? "bg-espresso text-ivory border-espresso"
                              : "bg-white text-espresso border-burgundy/20"
                          }`}
                        >
                          {app.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="checkout-upiId" className="block font-semibold text-espresso mb-1">
                      Enter UPI ID / VPA (Virtual Payment Address)
                    </label>
                    <input
                      id="checkout-upiId"
                      type="text"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleChange}
                      placeholder="e.g. mobile@upi or username@okhdfcbank"
                      className="w-full bg-white px-3.5 py-2.5 rounded border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy font-mono"
                    />
                    <p className="text-[11px] text-espresso/60 mt-1">
                      A payment request notification will be sent to your UPI app for instant one-click approval.
                    </p>
                  </div>
                </div>
              )}

              {/* Card Inputs */}
              {formData.paymentMethod === "card" && (
                <div className="space-y-4 p-5 bg-ivory rounded-xl border border-burgundy/10 text-xs">
                  <div>
                    <label htmlFor="checkout-cardNumber" className="block font-semibold text-espresso mb-1">
                      Card Number (RuPay, Visa, Mastercard, Amex)
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-espresso/40" />
                      <input
                        id="checkout-cardNumber"
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        className="w-full bg-white pl-10 pr-3 py-2.5 rounded border border-burgundy/20 text-espresso font-mono focus:outline-none focus:border-burgundy"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="checkout-cardExp" className="block font-semibold text-espresso mb-1">
                        Expiry Date (MM/YY)
                      </label>
                      <input
                        id="checkout-cardExp"
                        type="text"
                        name="cardExp"
                        value={formData.cardExp}
                        onChange={handleChange}
                        className="w-full bg-white px-3 py-2.5 rounded border border-burgundy/20 text-espresso font-mono focus:outline-none focus:border-burgundy"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkout-cardCvv" className="block font-semibold text-espresso mb-1">
                        CVV / CVC
                      </label>
                      <input
                        id="checkout-cardCvv"
                        type="password"
                        name="cardCvv"
                        maxLength={4}
                        value={formData.cardCvv}
                        onChange={handleChange}
                        className="w-full bg-white px-3 py-2.5 rounded border border-burgundy/20 text-espresso font-mono focus:outline-none focus:border-burgundy"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="checkout-cardName" className="block font-semibold text-espresso mb-1">
                      Cardholder Name
                    </label>
                    <input
                      id="checkout-cardName"
                      type="text"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleChange}
                      className="w-full bg-white px-3 py-2.5 rounded border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy"
                    />
                  </div>
                </div>
              )}

              {/* Net Banking Inputs */}
              {formData.paymentMethod === "netbanking" && (
                <div className="p-5 bg-ivory rounded-xl border border-burgundy/10 text-xs space-y-3">
                  <label htmlFor="checkout-bankName" className="block font-semibold text-espresso">
                    Select Your Indian Bank
                  </label>
                  <select
                    id="checkout-bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className="w-full bg-white px-3.5 py-2.5 rounded border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy cursor-pointer"
                  >
                    <option value="HDFC Bank">HDFC Bank (Recommended)</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="State Bank of India">State Bank of India (SBI)</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    <option value="Punjab National Bank">Punjab National Bank (PNB)</option>
                    <option value="Bank of Baroda">Bank of Baroda</option>
                  </select>
                </div>
              )}

              {/* Cash on Delivery */}
              {formData.paymentMethod === "cod" && (
                <div className="p-5 bg-ivory rounded-xl border border-burgundy/10 text-xs space-y-2">
                  <span className="font-bold text-burgundy block">Doorstep Cash on Delivery (COD)</span>
                  <p className="text-espresso/70 leading-relaxed">
                    Pay securely in cash or scan the dynamic UPI QR code on the courier partner terminal upon delivery at your doorstep.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-green-800 font-semibold text-[11px]">
                    <Check className="w-3.5 h-3.5" />
                    <span>Available across all serviceable Indian PIN codes up to ₹10,000.</span>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-espresso hover:text-burgundy"
                >
                  ← Back to Delivery
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="py-4 px-10 bg-burgundy hover:bg-crimson text-ivory text-xs font-bold uppercase tracking-[0.2em] rounded-lg transition-all flex items-center gap-2 shadow-xl disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Securing Atelier Allocation...</span>
                  ) : (
                    <>
                      <span>Complete Order — {formatPrice(cartTotal)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Order Summary Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-burgundy/15 shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-espresso pb-2 border-b border-burgundy/10">
              Your Selection ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h3>

            <div className="divide-y divide-ivory-dark max-h-72 overflow-y-auto pr-1 space-y-3">
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
                  <span>VIP Privilege Discount ({promoCode})</span>
                  <span>-{formatPrice(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Courier Logistics</span>
                <span>{cartShipping === 0 ? "Complimentary" : formatPrice(cartShipping)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (12% Included)</span>
                <span>{formatPrice(cartTax)}</span>
              </div>
              <div className="pt-2 border-t border-ivory-dark flex justify-between text-base font-bold text-burgundy">
                <span>Total Amount</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-burgundy/10 space-y-2 text-[11px] text-espresso/60">
              <div className="flex items-center gap-1.5 text-green-800 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>256-Bit SSL Secured Atelier Gateway</span>
              </div>
              <p>
                All prices are inclusive of 12% statutory Indian Goods & Services Tax (GST) and express door-to-door courier dispatch.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
