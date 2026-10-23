"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Gift,
  Tag,
  Check,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { BagSuggestions } from "@/components/BagSuggestions";
import { formatPrice } from "@/lib/pricing";

export default function BagPage() {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTax,
    cartTotal,
    promoCode,
    applyPromoCode,
    removePromoCode,
  } = useStore();

  const [inputCode, setInputCode] = useState("");
  const [promoMessage, setPromoMessage] = useState<{ success: boolean; text: string } | null>(null);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const res = applyPromoCode(inputCode);
    setPromoMessage({ success: res.success, text: res.message });
    if (res.success) setInputCode("");
  };

  const freeShippingThreshold = 1999;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-10">
      <div className="pb-6 border-b border-burgundy/15 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-crimson block mb-1">
            Review Your Wardrobe
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
            Shopping Bag ({cart.reduce((s, i) => s + i.quantity, 0)})
          </h1>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-crimson hover:underline self-start sm:self-auto"
          >
            Clear Entire Bag
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-burgundy/15 max-w-2xl mx-auto p-8 space-y-6">
          <div className="w-20 h-20 rounded-full bg-ivory-dark flex items-center justify-center text-burgundy/40 mx-auto">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-espresso">
            Your bag is empty
          </h2>
          <p className="text-xs text-espresso/70 max-w-md mx-auto leading-relaxed">
            Oversized tees, selvedge denim, boxy shirts and jackets. Free delivery on bags over ₹1,999.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 py-3.5 px-8 bg-burgundy hover:bg-crimson text-ivory text-xs font-bold uppercase tracking-[0.2em] rounded-lg transition-colors shadow-lg"
          >
            <span>Shop the collection</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="mx-auto max-w-md pt-4">
            <BagSuggestions />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {/* Free Courier Notice */}
            <div className="p-4 bg-white rounded-xl border border-burgundy/15 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
                <span>
                  {remainingForFreeShipping > 0
                    ? `Add ${formatPrice(remainingForFreeShipping)} more for complimentary express courier dispatch.`
                    : "You have unlocked free delivery across India."}
                </span>
              </div>
              <span className="font-bold text-burgundy">
                {cartShipping === 0 ? "FREE" : formatPrice(cartShipping)}
              </span>
            </div>

            {/* Items */}
            <div className="divide-y divide-burgundy/15 bg-white rounded-2xl border border-burgundy/15 overflow-hidden shadow-xs">
              {cart.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                  className="p-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 items-start justify-between"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-24 h-32 object-cover object-center rounded-lg bg-ivory-dark flex-shrink-0"
                  />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy">
                          {item.product.category}
                        </span>
                        <h3 className="font-serif text-base font-bold text-espresso">
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-espresso/60 italic">{item.product.subtitle}</p>
                      </div>

                      <span className="text-base font-bold text-burgundy">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>

                    <div className="text-xs text-espresso/70 space-x-3 pt-1">
                      <span>Size: <strong className="text-espresso">{item.selectedSize}</strong></span>
                      <span>•</span>
                      <span>Color: <strong className="text-espresso">{item.selectedColor}</strong></span>
                      <span>•</span>
                      <span>Unit Price: {formatPrice(item.product.price)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-burgundy/25 rounded-md bg-ivory">
                        <button
                          onClick={() =>
                            updateCartQuantity(
                              item.product.id,
                              item.selectedSize,
                              item.selectedColor,
                              item.quantity - 1
                            )
                          }
                          className="p-1.5 hover:text-burgundy text-espresso/70"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-espresso">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartQuantity(
                              item.product.id,
                              item.selectedSize,
                              item.selectedColor,
                              item.quantity + 1
                            )
                          }
                          className="p-1.5 hover:text-burgundy text-espresso/70"
                          aria-label="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          removeFromCart(item.product.id, item.selectedSize, item.selectedColor)
                        }
                        className="text-xs text-crimson hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Order Summary Breakdown */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-burgundy/15 p-6 shadow-sm space-y-5">
              <h3 className="font-serif text-lg font-bold text-espresso pb-3 border-b border-burgundy/10">
                Order Summary
              </h3>

              {/* Promo Code Input */}
              <div>
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-espresso/40" />
                    <input
                      type="text"
                      placeholder="Try 'TREND10' or 'STREET20'"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      className="w-full bg-ivory pl-8 pr-2 py-2 text-xs rounded border border-burgundy/20 text-espresso uppercase placeholder-espresso/40 focus:outline-none focus:border-burgundy"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-espresso hover:bg-black text-ivory text-xs font-semibold uppercase rounded transition-colors"
                  >
                    Apply
                  </button>
                </form>

                {promoMessage && (
                  <p
                    className={`text-[11px] mt-1.5 ${
                      promoMessage.success ? "text-green-800 font-semibold" : "text-crimson"
                    }`}
                  >
                    {promoMessage.text}
                  </p>
                )}

                {promoCode && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-burgundy/10 border border-burgundy/30 rounded text-xs text-burgundy font-bold">
                    <span>Code active: {promoCode}</span>
                    <button onClick={removePromoCode} className="text-crimson hover:text-black">
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Cost Lines */}
              <div className="space-y-2 text-xs text-espresso/80 pt-2 border-t border-ivory-dark">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-espresso">{formatPrice(cartSubtotal)}</span>
                </div>

                {cartDiscount > 0 && (
                  <div className="flex justify-between text-crimson font-medium">
                    <span>Privilege Discount</span>
                    <span>-{formatPrice(cartDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>{cartShipping === 0 ? "Complimentary" : formatPrice(cartShipping)}</span>
                </div>

                <div className="flex justify-between">
                  <span>GST (12% Included)</span>
                  <span>{formatPrice(cartTax)}</span>
                </div>

                <div className="pt-3 border-t border-burgundy/15 flex justify-between text-lg font-bold text-burgundy">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full py-4 bg-burgundy hover:bg-crimson text-ivory text-xs font-bold uppercase tracking-[0.2em] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xl"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="space-y-2 text-[11px] text-espresso/60 pt-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-700" />
                  <span>256-Bit SSL Encrypted Checkout</span>
                </div>
                <p>
                  Prices shown include 12% GST. Delivery is free on bags over ₹1,999.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
