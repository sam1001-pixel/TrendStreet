"use client";

import React, { useState } from "react";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface RazorpayCheckoutButtonProps {
  amount?: number; // In paise (e.g. 50000 for ₹500, min 100 paise)
  currency?: string;
  name?: string;
  description?: string;
  receipt?: string;
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  buttonText?: string;
  className?: string;
  onSuccess?: (data: { payment_id: string; order_id: string; signature: string }) => void;
  onError?: (error: string) => void;
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function RazorpayCheckoutButton({
  amount = 50000, // ₹500 in paise
  currency = "INR",
  name = "OFFVYBE",
  description = "Standard Web Checkout",
  receipt,
  customer = {
    name: "Customer",
    email: "customer@example.com",
    contact: "9999999999",
  },
  buttonText = "Pay with Razorpay",
  className = "inline-flex items-center justify-center px-6 py-3 bg-[#8B1E3F] hover:bg-[#721833] text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50",
  onSuccess,
  onError,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setStatusMessage(null);
      setIsError(false);

      // 1. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error("Failed to load Razorpay SDK. Please check your internet connection.");
      }

      // 2. Call backend endpoint to create order
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || "Failed to create order on server.");
      }

      const keyId =
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        orderData.key_id ||
        "rzp_test_TyzNAN2k14a8Ug";

      // 3. Configure Razorpay Standard Checkout options
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name,
        description,
        order_id: orderData.order_id,
        prefill: {
          name: customer.name || "",
          email: customer.email || "",
          contact: customer.contact || "",
        },
        theme: {
          color: "#8B1E3F",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setStatusMessage("Payment cancelled by user.");
            setIsError(true);
            if (onError) onError("Payment cancelled by user.");
          },
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            setStatusMessage("Verifying payment signature...");

            // 4. Send payment details to verify endpoint
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setLoading(false);
              setStatusMessage(`Payment successful! ID: ${response.razorpay_payment_id}`);
              setIsError(false);
              if (onSuccess) {
                onSuccess({
                  payment_id: response.razorpay_payment_id,
                  order_id: response.razorpay_order_id,
                  signature: response.razorpay_signature,
                });
              }
            } else {
              throw new Error(verifyData.error || "Payment signature verification failed.");
            }
          } catch (err: any) {
            setLoading(false);
            setIsError(true);
            const msg = err.message || "Payment verification failed.";
            setStatusMessage(msg);
            if (onError) onError(msg);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      // Handle payment failure event
      razorpayInstance.on("payment.failed", function (response: any) {
        setLoading(false);
        setIsError(true);
        const errorDesc = response?.error?.description || "Payment failed.";
        setStatusMessage(errorDesc);
        if (onError) onError(errorDesc);
      });

      razorpayInstance.open();
    } catch (err: any) {
      setLoading(false);
      setIsError(true);
      const errorMsg = err.message || "Something went wrong initiating payment.";
      setStatusMessage(errorMsg);
      if (onError) onError(errorMsg);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
        className={className}
      >
        {loading ? "Processing..." : buttonText}
      </button>

      {statusMessage && (
        <p
          className={`text-xs mt-1 ${
            isError ? "text-red-600 font-medium" : "text-emerald-700 font-medium"
          }`}
        >
          {statusMessage}
        </p>
      )}
    </div>
  );
}
