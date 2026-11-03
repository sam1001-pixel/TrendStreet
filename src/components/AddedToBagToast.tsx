"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Check, X, ShoppingBag } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice, FREE_SHIPPING_THRESHOLD_MINOR } from "@/lib/pricing";

const SHOW_FOR_MS = 4000;

/**
 * "Added to bag" confirmation that slides in under the header.
 * Replaces the full-screen bag drawer that used to open on every add, so shoppers keep browsing.
 * Also nudges towards free delivery.
 */
export function AddedToBagToast() {
  const { lastAdded, dismissLastAdded, setIsCartOpen, isCartOpen, cartSubtotal, cartDiscount, cartItemsCount } = useStore();
  const pathname = usePathname();
  const [paused, setPaused] = useState(false);

  // Each new add starts a fresh timer.
  useEffect(() => setPaused(false), [lastAdded?.at]);

  useEffect(() => {
    if (!lastAdded || paused) return;
    const t = window.setTimeout(dismissLastAdded, SHOW_FOR_MS);
    return () => window.clearTimeout(t);
  }, [lastAdded, paused, dismissLastAdded]);

  // Not needed while the bag itself is open, or on the way to checkout.
  if (!lastAdded || isCartOpen || pathname.startsWith("/checkout") || pathname.startsWith("/admin")) return null;

  const { product, size, quantity } = lastAdded;
  const freeAt = FREE_SHIPPING_THRESHOLD_MINOR / 100;
  const left = Math.max(0, freeAt - (cartSubtotal - cartDiscount));

  return (
    <div
      key={lastAdded.at}
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      className="fixed inset-x-3 top-[72px] z-[70] mx-auto max-w-md animate-in fade-in slide-in-from-top-4 duration-300 sm:inset-x-auto sm:right-6 sm:top-24 sm:w-[380px]"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-espresso p-2.5 pr-2 text-ivory shadow-2xl ring-1 ring-white/10">
        <div className="relative h-14 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-ivory/10">
          {product.images[0] && <Image src={product.images[0]} alt="" fill sizes="44px" className="object-cover" />}
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 ring-2 ring-espresso">
            <Check className="h-3 w-3 text-white" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold">Added to bag</p>
          <p className="truncate text-xs text-ivory/75">
            {product.name} · {size}
            {quantity > 1 ? ` × ${quantity}` : ""} · {formatPrice(product.price)}
          </p>
          <p className="truncate text-[11px] font-semibold text-gold-light">
            {left > 0 ? `${formatPrice(left)} away from free delivery` : "Free delivery unlocked"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            dismissLastAdded();
            setIsCartOpen(true);
          }}
          className="flex min-h-[44px] flex-shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-bold uppercase tracking-wider text-espresso active:scale-95"
        >
          <ShoppingBag className="h-4 w-4" /> Bag ({cartItemsCount})
        </button>
        <button type="button" onClick={dismissLastAdded} aria-label="Dismiss" className="-ml-1 flex h-11 w-9 flex-shrink-0 items-center justify-center text-ivory/60 hover:text-ivory">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
