"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Heart, Share2, ShoppingBag, Trash2, ArrowRight, Check } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";
import { BagSuggestions } from "@/components/BagSuggestions";
import type { Product } from "@/types/store";

/** Move-to-bag that makes the shopper choose a size instead of guessing one. */
function MoveToBag({ product, onMoved }: { product: Product; onMoved: () => void }) {
  const { addToCart } = useStore();
  const [size, setSize] = useState("");

  if (!product.inStock) {
    return <p className="mt-3 rounded-lg bg-ivory-dark py-2.5 text-center text-xs font-semibold text-espresso/60">Sold out</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      <label htmlFor={`size-${product.id}`} className="sr-only">
        Size for {product.name}
      </label>
      <select
        id={`size-${product.id}`}
        value={size}
        onChange={(e) => setSize(e.target.value)}
        className="w-full rounded-lg border border-burgundy/20 bg-white px-3 py-2.5 text-xs text-espresso focus:border-burgundy focus:outline-none"
      >
        <option value="">Choose size</option>
        {product.sizes.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        disabled={!size}
        onClick={() => {
          addToCart(product, size, product.colors[0]?.name || "Default", 1);
          onMoved();
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-burgundy px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-gold transition-colors hover:bg-crimson disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        Move to bag
      </button>
    </div>
  );
}

function SavedContent() {
  const { wishlist, products, toggleWishlist } = useStore();
  const params = useSearchParams();
  const [copied, setCopied] = useState(false);

  // A shared link carries the product ids: /saved?items=ts-013,ts-022
  const sharedIds = (params.get("items") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((id) => /^ts-[a-z0-9-]{1,40}$/i.test(id))
    .slice(0, 50);
  const isShared = sharedIds.length > 0;
  const ids = isShared ? sharedIds : wishlist;
  const items = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);

  const share = async () => {
    const url = `${window.location.origin}/saved?items=${wishlist.join(",")}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Trend Street wishlist", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* share sheet dismissed */
    }
  };

  const saveAll = () => items.forEach((p) => !wishlist.includes(p.id) && toggleWishlist(p.id));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 py-4 sm:space-y-10 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex flex-col justify-between gap-3 border-b border-burgundy/15 pb-4 sm:flex-row sm:items-end sm:gap-4 sm:pb-6">
        <div>
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-crimson sm:text-xs">
            {isShared ? "Shared with you" : "Your wishlist"}
          </span>
          <h1 className="font-serif text-2xl font-bold text-espresso sm:text-4xl">
            {isShared ? "A wishlist from a friend" : "Saved pieces"} ({items.length})
          </h1>
        </div>

        {isShared ? (
          <div className="flex gap-2">
            <button onClick={saveAll} className="rounded-lg bg-burgundy px-4 py-2.5 text-xs font-semibold text-ivory hover:bg-crimson">
              Save all to my wishlist
            </button>
            <Link href="/saved" className="rounded-lg border border-burgundy/30 px-4 py-2.5 text-xs font-semibold text-burgundy hover:border-burgundy">
              My wishlist
            </Link>
          </div>
        ) : (
          items.length > 0 && (
            <button
              onClick={share}
              aria-live="polite"
              className="flex items-center gap-2 rounded-lg border border-burgundy/30 px-4 py-2.5 text-xs font-semibold text-burgundy transition-colors hover:border-burgundy"
            >
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {copied ? "Link copied" : "Share wishlist"}
            </button>
          )
        )}
      </div>

      {items.length === 0 ? (
        <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-burgundy/15 bg-white p-8 py-16 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-ivory-dark text-burgundy/40">
            <Heart className="h-10 w-10" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-espresso">Nothing saved yet</h2>
          <p className="mx-auto max-w-md text-xs leading-relaxed text-espresso/70">
            Tap the heart on any piece to keep it here. Your wishlist is saved on this device.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-lg bg-burgundy px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-ivory shadow-lg transition-colors hover:bg-crimson"
          >
            Shop the collection <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mx-auto max-w-md pt-4">
            <BagSuggestions title="Popular right now" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((product) => (
            <div key={product.id} className="relative">
              <ProductCard product={product} />
              <MoveToBag product={product} onMoved={() => !isShared && toggleWishlist(product.id)} />
              {!isShared && (
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs text-espresso/60 transition-colors hover:text-crimson"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SavedPage() {
  return (
    <Suspense fallback={null}>
      <SavedContent />
    </Suspense>
  );
}
