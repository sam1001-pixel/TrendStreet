"use client";

import React, { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useStore, useStoreConfig } from "@/context/StoreContext";
import { rupees } from "@/lib/store-config";
import { BagSuggestions } from "@/components/BagSuggestions";
import { formatPrice } from "@/lib/pricing";
import { lockScroll } from "@/lib/scroll-lock";
import { useSwipeToClose } from "@/hooks/useSwipeToClose";

export const CartDrawer: React.FC = () => {
  const {
    cart,
    products,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    addToCart,
    cartSubtotal,
    cartTotal,
    cartShipping,
    cartDiscount,
  } = useStore();
  const config = useStoreConfig();

  const panelRef = useRef<HTMLDivElement>(null);
  const closeBag = useCallback(() => setIsCartOpen(false), [setIsCartOpen]);
  useSwipeToClose(panelRef, { direction: "right", onClose: closeBag, enabled: isCartOpen });

  // Escape key listener for cart dismissal & body scroll lock
  useEffect(() => {
    if (!isCartOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsCartOpen(false);
      }
    };
    const unlock = lockScroll();
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      unlock();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  // Same rule as the server: free delivery once the bag (after discount) reaches the admin's amount.
  const freeShippingThreshold = config.shipping.freeOver;
  const qualifyingTotal = Math.max(0, cartSubtotal - cartDiscount);
  const progressToFreeShipping = freeShippingThreshold > 0 ? Math.min(100, (qualifyingTotal / freeShippingThreshold) * 100) : 100;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - qualifyingTotal);

  // Recommended coordinating cross-sell item not yet in cart (OFFCULT / Off Duty style)
  const crossSellProduct =
    products.find((p) => !cart.some((c) => c.product.id === p.id)) || products[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping Cart">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-espresso/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div ref={panelRef} className="w-screen max-w-md bg-ivory shadow-2xl flex flex-col border-l border-burgundy/20 animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 border-b border-burgundy/15 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-burgundy" />
              <h2 className="text-base font-serif font-bold uppercase tracking-wider text-espresso">
                Shopping Bag ({cart.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-espresso/60 transition-colors hover:bg-burgundy/5 hover:text-burgundy"
              aria-label="Close bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free shipping progress (hidden while the bag is empty) */}
          {cart.length > 0 && (
          <div className="p-4 bg-ivory-dark border-b border-burgundy/10 text-xs">
            {remainingForFreeShipping > 0 ? (
              <p className="text-espresso/80 font-medium mb-1.5 flex items-center gap-1.5 flex-wrap">
                <Truck className="w-3.5 h-3.5 text-burgundy" />
                <span>
                  Add <span className="font-bold text-burgundy">{formatPrice(remainingForFreeShipping)}</span> more for free delivery.
                </span>
              </p>
            ) : (
              <p className="text-green-800 font-bold flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-4 h-4 text-gold" />
                <span>You&apos;ve unlocked free delivery across India.</span>
              </p>
            )}
            <div
              role="progressbar"
              aria-valuenow={qualifyingTotal}
              aria-valuemin={0}
              aria-valuemax={freeShippingThreshold}
              aria-label="Free shipping progress"
              className="w-full bg-burgundy/15 h-2 rounded-full overflow-hidden"
            >
              <div
                className="bg-burgundy h-full rounded-full transition-all duration-500"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>
          )}

          {/* Cart Items List */}
          <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center text-center px-2 py-8 text-espresso/60">
                <div className="w-16 h-16 rounded-full bg-ivory-dark flex items-center justify-center text-burgundy/40 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-bold text-espresso mb-1">
                  Your bag is empty
                </h3>
                <p className="text-xs text-espresso/60 max-w-xs mb-6">
                  Oversized tees, denim, boxy shirts and jackets — free delivery over {rupees(config.shipping.freeOver)}.
                </p>
                <Link
                  href="/shop"
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-3 bg-burgundy hover:bg-crimson text-ivory text-xs font-semibold uppercase tracking-wider rounded transition-colors"
                >
                  Shop the collection
                </Link>
                <div className="mt-8 w-full">
                  <BagSuggestions onNavigate={() => setIsCartOpen(false)} />
                </div>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                    className="flex space-x-3.5 p-3 bg-white rounded-lg border border-burgundy/10 shadow-sm"
                  >
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      width={72}
                      height={88}
                      className="w-18 h-22 object-cover object-center rounded bg-ivory-dark flex-shrink-0 border border-burgundy/10"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <h4 className="font-serif text-sm font-bold text-espresso line-clamp-2">
                            {item.product.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(item.product.id, item.selectedSize, item.selectedColor)
                            }
                            className="-mr-2 -mt-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-espresso/60 hover:text-crimson"
                            aria-label={`Remove ${item.product.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-espresso/60 mt-0.5 font-mono">
                          Size: <span className="font-bold text-burgundy">{item.selectedSize}</span> | {item.selectedColor}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-ivory-dark">
                        <div className="flex items-center rounded-lg border border-burgundy/20 bg-ivory">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                item.product.id,
                                item.selectedSize,
                                item.selectedColor,
                                item.quantity - 1
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center text-espresso/70 hover:text-burgundy"
                            aria-label={item.quantity === 1 ? `Remove ${item.product.name}` : "Decrease quantity"}
                          >
                            {item.quantity === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                          </button>
                          <span className="w-6 text-center text-sm font-bold tabular-nums text-espresso">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                item.product.id,
                                item.selectedSize,
                                item.selectedColor,
                                item.quantity + 1
                              )
                            }
                            disabled={item.quantity >= 10}
                            className="flex h-9 w-9 items-center justify-center text-espresso/70 hover:text-burgundy disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <span className="text-sm font-bold text-burgundy">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Coordinating Cross-Sell Piece ("Complete Your Fit") */}
                {crossSellProduct && (
                  <div className="p-3.5 rounded-xl bg-white border border-burgundy/15 space-y-2 mt-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-burgundy uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-crimson" />
                        <span>Complete Your Fit</span>
                      </span>

                    </div>
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center space-x-2.5">
                        <Image
                          src={crossSellProduct.images[0]}
                          alt={crossSellProduct.name}
                          width={48}
                          height={56}
                          className="w-12 h-14 object-cover rounded bg-ivory-dark border border-burgundy/10 flex-shrink-0"
                        />
                        <div>
                          <h5 className="font-serif text-xs font-bold text-espresso line-clamp-1">
                            {crossSellProduct.name}
                          </h5>
                          <span className="text-xs font-bold text-burgundy block">
                            {formatPrice(crossSellProduct.price)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          addToCart(
                            crossSellProduct,
                            crossSellProduct.sizes[0] || "M",
                            crossSellProduct.colors[0]?.name || "Default",
                            1
                          )
                        }
                        className="min-h-[40px] rounded-lg bg-burgundy px-3 text-[11px] font-bold uppercase tracking-wider text-gold shadow-sm transition-colors hover:bg-crimson whitespace-nowrap flex-shrink-0"
                      >
                        + Add ({crossSellProduct.sizes[0] || "M"})
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Drawer Footer Checkout Actions */}
          {cart.length > 0 && (
            <div className="space-y-3.5 border-t border-burgundy/15 bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
              <div className="space-y-1.5 text-xs text-espresso/70">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-espresso">{formatPrice(cartSubtotal)}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-crimson font-medium">
                    <span>Discount</span>
                    <span>-{formatPrice(cartDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className={cartShipping === 0 ? "text-green-800 font-bold" : ""}>
                    {cartShipping === 0 ? "Complimentary" : formatPrice(cartShipping)}
                  </span>
                </div>
                <div className="pt-2 border-t border-ivory-dark flex justify-between text-base font-bold text-burgundy">
                  <span>Total <span className="text-xs font-normal text-espresso/60">incl. GST</span></span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link
                  href="/bag"
                  onClick={() => setIsCartOpen(false)}
                  className="flex min-h-[48px] items-center justify-center rounded-xl border border-burgundy px-4 text-xs font-bold uppercase tracking-wider text-burgundy transition-colors hover:bg-burgundy/5"
                >
                  View Bag
                </Link>

                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl bg-burgundy px-4 text-xs font-bold uppercase tracking-wider text-ivory shadow-md transition-colors hover:bg-crimson"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-espresso/55">
                <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
                <span>Secure checkout · UPI, cards, net banking, COD</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
