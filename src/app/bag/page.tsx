"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag, Truck, Heart, X, RotateCcw, Wallet } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { BagSuggestions } from "@/components/BagSuggestions";
import { formatPrice } from "@/lib/pricing";

const FREE_SHIPPING = 1999;

export default function BagPage() {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    toggleWishlist,
    isInWishlist,
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
  const count = cart.reduce((s, i) => s + i.quantity, 0);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const res = applyPromoCode(inputCode);
    setPromoMessage({ success: res.success, text: res.message });
    if (res.success) setInputCode("");
  };

  const qualifying = Math.max(0, cartSubtotal - cartDiscount);
  const remaining = Math.max(0, FREE_SHIPPING - qualifying);
  const progress = Math.min(100, (qualifying / FREE_SHIPPING) * 100);

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 text-center sm:pt-16">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-burgundy/10 text-burgundy">
          <ShoppingBag className="h-9 w-9" />
        </div>
        <h1 className="mt-5 font-display text-5xl font-black uppercase leading-none text-espresso">Your bag is empty</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-espresso/60">Oversized tees, selvedge denim, boxy shirts and jackets. Free delivery over ₹1,999.</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/shop" className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-burgundy px-7 text-xs font-bold uppercase tracking-[0.18em] text-ivory hover:bg-crimson">
            Shop the collection <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/complete-the-fit" className="inline-flex min-h-[48px] items-center justify-center rounded-full px-7 text-xs font-bold uppercase tracking-[0.18em] text-burgundy ring-1 ring-burgundy/30">
            Shop a full look
          </Link>
        </div>
        <div className="mx-auto mt-10 max-w-md text-left">
          <BagSuggestions />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-36 pt-6 sm:px-6 sm:pt-12 lg:px-8 lg:pb-20">
      <header className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">Shopping bag</p>
          <h1 className="mt-1 font-display text-5xl font-black uppercase leading-[0.85] text-espresso sm:text-6xl">
            Bag <span className="text-burgundy">({count})</span>
          </h1>
        </div>
        <button onClick={clearCart} className="min-h-[40px] text-xs font-semibold text-crimson hover:underline">
          Clear bag
        </button>
      </header>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-4 lg:col-span-8">
          {/* Free delivery progress */}
          <div className="rounded-2xl bg-white p-4 ring-1 ring-burgundy/10">
            <p className="mb-2 flex items-center gap-2 text-xs text-espresso/80">
              <Truck className="h-4 w-4 flex-shrink-0 text-burgundy" />
              {remaining > 0 ? (
                <span>
                  Add <strong className="text-burgundy">{formatPrice(remaining)}</strong> more for free delivery
                </span>
              ) : (
                <span className="font-semibold text-green-800">Free delivery unlocked</span>
              )}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-ivory-dark" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to free delivery">
              <div className={`h-full rounded-full transition-all duration-500 ${remaining > 0 ? "bg-burgundy" : "bg-green-700"}`} style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Items */}
          <ul className="divide-y divide-burgundy/10 overflow-hidden rounded-2xl bg-white ring-1 ring-burgundy/10">
            {cart.map((item) => {
              const saved = isInWishlist(item.product.id);
              return (
                <li key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-3 p-3 sm:gap-5 sm:p-5">
                  <Link href={`/product/${item.product.id}`} className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-ivory-dark sm:h-40 sm:w-32">
                    <Image src={item.product.images[0]} alt={item.product.name} fill sizes="128px" className="object-cover" />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-crimson">{item.product.category}</span>
                        <Link href={`/product/${item.product.id}`} className="line-clamp-2 font-serif text-sm font-bold leading-snug text-espresso hover:text-crimson sm:text-base">
                          {item.product.name}
                        </Link>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor)}
                        className="-mr-1 -mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-espresso/40 hover:bg-ivory hover:text-crimson"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="mt-1 text-xs text-espresso/60">
                      Size <strong className="text-espresso">{item.selectedSize}</strong> · {item.selectedColor}
                    </p>

                    <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                      <div className="flex items-center rounded-full bg-ivory ring-1 ring-burgundy/15">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                          className="flex h-9 w-9 items-center justify-center text-espresso/70 hover:text-burgundy"
                          aria-label="Decrease quantity"
                        >
                          {item.quantity === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-espresso" aria-live="polite">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                          className="flex h-9 w-9 items-center justify-center text-espresso/70 hover:text-burgundy"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-bold text-burgundy sm:text-base">{formatPrice(item.product.price * item.quantity)}</span>
                        {item.quantity > 1 && <span className="text-[11px] text-espresso/50">{formatPrice(item.product.price)} each</span>}
                      </div>
                    </div>

                    {!saved && (
                      <button
                        onClick={() => {
                          toggleWishlist(item.product.id);
                          removeFromCart(item.product.id, item.selectedSize, item.selectedColor);
                        }}
                        className="mt-2 inline-flex items-center gap-1 self-start text-[11px] font-semibold text-espresso/60 hover:text-crimson"
                      >
                        <Heart className="h-3.5 w-3.5" /> Save for later
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <ul className="grid grid-cols-3 gap-2 text-center text-[11px] text-espresso/70">
            {[
              [RotateCcw, "30-day exchange"],
              [Wallet, "Cash on delivery"],
              [ShieldCheck, "Secure Razorpay"],
            ].map(([Icon, t]) => {
              const I = Icon as typeof RotateCcw;
              return (
                <li key={t as string} className="flex flex-col items-center gap-1 rounded-2xl bg-white p-3 ring-1 ring-burgundy/10">
                  <I className="h-4 w-4 text-burgundy" /> {t as string}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-4">
          <div className="space-y-5 rounded-2xl bg-white p-5 ring-1 ring-burgundy/10 sm:p-6 lg:sticky lg:top-24">
            <h2 className="font-serif text-lg font-bold text-espresso">Order summary</h2>

            <div>
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <label htmlFor="promo" className="sr-only">Promo code</label>
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/40" />
                  <input
                    id="promo"
                    type="text"
                    placeholder="Promo code"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="h-11 w-full rounded-xl border border-burgundy/20 bg-ivory pl-9 pr-2 text-sm uppercase text-espresso placeholder:normal-case placeholder:text-espresso/40 focus:border-burgundy focus:outline-none"
                  />
                </div>
                <button type="submit" className="h-11 rounded-xl bg-espresso px-4 text-xs font-bold uppercase text-ivory hover:bg-black">
                  Apply
                </button>
              </form>
              {!promoCode && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["TREND10", "STREET20"].map((c) => (
                    <button key={c} type="button" onClick={() => { const r = applyPromoCode(c); setPromoMessage({ success: r.success, text: r.message }); }} className="rounded-full border border-dashed border-burgundy/40 px-2.5 py-1 font-mono text-[10px] font-bold text-burgundy hover:bg-burgundy/5">
                      {c}
                    </button>
                  ))}
                </div>
              )}
              {promoMessage && (
                <p className={`mt-2 text-[11px] ${promoMessage.success ? "font-semibold text-green-800" : "text-crimson"}`}>{promoMessage.text}</p>
              )}
              {promoCode && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-burgundy/10 px-3 py-1 text-xs font-bold text-burgundy">
                  {promoCode} applied
                  <button onClick={removePromoCode} aria-label="Remove promo code" className="text-crimson hover:text-black">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <dl className="space-y-2 border-t border-ivory-dark pt-4 text-sm text-espresso/80">
              <div className="flex justify-between">
                <dt>Subtotal ({count} items)</dt>
                <dd className="font-semibold text-espresso">{formatPrice(cartSubtotal)}</dd>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-green-800">
                  <dt>Discount</dt>
                  <dd>−{formatPrice(cartDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd className={cartShipping === 0 ? "font-semibold text-green-800" : ""}>{cartShipping === 0 ? "Free" : formatPrice(cartShipping)}</dd>
              </div>
              <div className="flex justify-between text-xs text-espresso/60">
                <dt>Includes GST (12%)</dt>
                <dd>{formatPrice(cartTax)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-burgundy/15 pt-3">
                <dt className="font-semibold text-espresso">Total</dt>
                <dd className="font-serif text-2xl font-bold text-burgundy">{formatPrice(cartTotal)}</dd>
              </div>
            </dl>

            <Link href="/checkout" className="hidden min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-burgundy text-xs font-bold uppercase tracking-[0.18em] text-ivory shadow-lg hover:bg-crimson lg:flex">
              Checkout securely <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-espresso/50">
              <ShieldCheck className="h-3.5 w-3.5 text-green-700" /> UPI · Cards · Net banking · COD
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-12">
        <BagSuggestions title="Complete your fit" limit={4} />
      </div>

      {/* Sticky checkout bar (mobile & tablet) — sits above the bottom nav */}
      <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-30 border-t border-burgundy/15 bg-ivory/95 px-4 py-3 backdrop-blur-md md:bottom-0 lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-espresso/60">Total · {count} items</p>
            <p className="font-serif text-lg font-bold leading-tight text-burgundy">{formatPrice(cartTotal)}</p>
          </div>
          <Link href="/checkout" className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-burgundy text-xs font-bold uppercase tracking-[0.16em] text-ivory hover:bg-crimson">
            Checkout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
