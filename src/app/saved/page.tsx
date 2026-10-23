"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Heart, Share2, ShoppingBag, X, ArrowRight, Check, TrendingDown } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { BagSuggestions } from "@/components/BagSuggestions";
import { formatPrice } from "@/lib/pricing";
import type { Product } from "@/types/store";

/** One saved piece: pick a size inline, then move it to the bag. */
function SavedItem({ product, shared, onRemove }: { product: Product; shared: boolean; onRemove: () => void }) {
  const { addToCart, toggleWishlist } = useStore();
  const [size, setSize] = useState("");
  const [moved, setMoved] = useState(false);
  const drop = product.originalPrice ? product.originalPrice - product.price : 0;

  const move = () => {
    if (!size) return;
    addToCart(product, size, product.colors[0]?.name || "Default", 1);
    setMoved(true);
    if (!shared) setTimeout(() => toggleWishlist(product.id), 600);
  };

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-burgundy/10">
      <div className="relative aspect-[4/5] bg-ivory-dark">
        <Link href={`/product/${product.id}`} aria-label={product.name}>
          <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
        </Link>
        {!shared && (
          <button
            onClick={onRemove}
            aria-label={`Remove ${product.name} from saved`}
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-espresso backdrop-blur hover:text-crimson"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {drop > 0 && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-green-700 px-2 py-0.5 text-[10px] font-bold text-white">
            <TrendingDown className="h-3 w-3" /> {formatPrice(drop)} off
          </span>
        )}
        {!product.inStock && <span className="absolute inset-x-0 bottom-0 bg-espresso/80 py-1.5 text-center text-[10px] font-bold uppercase text-ivory">Sold out</span>}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-crimson">{product.category}</span>
        <Link href={`/product/${product.id}`} className="line-clamp-2 font-serif text-[13px] font-bold leading-snug text-espresso hover:text-crimson sm:text-sm">
          {product.name}
        </Link>
        <span className="mt-1 flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-burgundy">{formatPrice(product.price)}</span>
          {product.originalPrice && <span className="text-[11px] text-espresso/40 line-through">{formatPrice(product.originalPrice)}</span>}
        </span>

        {product.inStock && (
          <div className="mt-auto pt-3">
            <div className="no-scrollbar flex gap-1 overflow-x-auto" role="radiogroup" aria-label={`Size for ${product.name}`}>
              {product.sizes.map((s) => (
                <button
                  key={s}
                  role="radio"
                  aria-checked={size === s}
                  onClick={() => setSize(s)}
                  className={`h-8 min-w-[34px] flex-shrink-0 rounded-lg px-1.5 font-mono text-[11px] font-bold transition-colors ${
                    size === s ? "bg-burgundy text-gold" : "bg-ivory text-espresso ring-1 ring-burgundy/15"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={move}
              disabled={!size || moved}
              className={`mt-2 flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed ${
                moved ? "bg-green-700 text-white" : "bg-espresso text-ivory hover:bg-burgundy disabled:opacity-40"
              }`}
            >
              {moved ? <Check className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
              {moved ? "In your bag" : size ? "Move to bag" : "Pick a size"}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function SavedContent() {
  const { wishlist, products, toggleWishlist } = useStore();
  const params = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [cat, setCat] = useState("All");

  // A shared link carries the product ids: /saved?items=ts-013,ts-022
  const sharedIds = (params.get("items") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((id) => /^ts-[a-z0-9-]{1,40}$/i.test(id))
    .slice(0, 50);
  const isShared = sharedIds.length > 0;
  const ids = isShared ? sharedIds : wishlist;
  const items = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);

  const cats = useMemo(() => ["All", ...Array.from(new Set(items.map((p) => p.category)))], [items]);
  const shown = cat === "All" ? items : items.filter((p) => p.category === cat);
  const value = items.reduce((s, p) => s + p.price, 0);
  const savings = items.reduce((s, p) => s + (p.originalPrice ? p.originalPrice - p.price : 0), 0);

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
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:space-y-8 sm:px-6 sm:pt-12 lg:px-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">{isShared ? "Shared with you" : "Your wishlist"}</p>
          <h1 className="mt-1 font-display text-5xl font-black uppercase leading-[0.85] text-espresso sm:text-6xl">
            {isShared ? "Their picks" : "Saved"}
          </h1>
        </div>
        {isShared ? (
          <div className="flex gap-2">
            <button onClick={saveAll} className="min-h-[44px] flex-1 rounded-full bg-burgundy px-5 text-xs font-bold text-ivory hover:bg-crimson sm:flex-none">
              Save all to mine
            </button>
            <Link href="/saved" className="flex min-h-[44px] items-center rounded-full px-5 text-xs font-bold text-burgundy ring-1 ring-burgundy/30">
              My wishlist
            </Link>
          </div>
        ) : (
          items.length > 0 && (
            <button onClick={share} aria-live="polite" className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-full px-5 text-xs font-bold text-burgundy ring-1 ring-burgundy/30 hover:ring-burgundy sm:self-auto">
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {copied ? "Link copied" : "Share wishlist"}
            </button>
          )
        )}
      </header>

      {items.length > 0 && (
        <dl className="grid grid-cols-3 gap-2 sm:max-w-xl">
          {[
            ["Pieces", String(items.length)],
            ["Total value", formatPrice(value)],
            ["Markdowns", savings ? formatPrice(savings) : "—"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-white p-3 ring-1 ring-burgundy/10">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-espresso/50">{k}</dt>
              <dd className="mt-0.5 truncate font-serif text-base font-bold text-espresso sm:text-lg">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {items.length === 0 ? (
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 text-center ring-1 ring-burgundy/10 sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-crimson/10 text-crimson">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-serif text-2xl font-bold text-espresso">Nothing saved yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-espresso/60">Tap the heart on any piece to keep it here. Your wishlist stays on this device.</p>
          <Link href="/shop" className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-burgundy px-7 text-xs font-bold uppercase tracking-[0.18em] text-ivory hover:bg-crimson">
            Start browsing <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mx-auto mt-8 max-w-md">
            <BagSuggestions title="Popular right now" />
          </div>
        </div>
      ) : (
        <>
          {cats.length > 2 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  aria-pressed={cat === c}
                  className={`min-h-[36px] whitespace-nowrap rounded-full px-4 text-xs font-bold transition-colors ${cat === c ? "bg-espresso text-ivory" : "bg-white text-espresso/70 ring-1 ring-burgundy/15"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {shown.map((p) => (
              <SavedItem key={p.id} product={p} shared={isShared} onRemove={() => toggleWishlist(p.id)} />
            ))}
          </ul>
        </>
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
