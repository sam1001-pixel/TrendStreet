"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Eye, Star, Plus, Check } from "lucide-react";
import { Product } from "@/types/store";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  /** Tighter typography for horizontal rails. */
  compact?: boolean;
}

/** Short fabric spec pill derived from the product copy (e.g. "520 GSM"). */
function fabricBadge(p: Product): string {
  const text = `${p.fabric} ${p.subtitle} ${p.name}`.toLowerCase();
  const gsm = text.match(/(\d{3})\s?gsm/);
  if (gsm) return `${gsm[1]} GSM`;
  const oz = text.match(/(\d{1,2}(?:\.\d)?)\s?oz/);
  if (oz) return `${oz[1]} OZ`;
  if (text.includes("selvedge")) return "SELVEDGE";
  if (text.includes("suede")) return "SUEDE";
  if (text.includes("leather")) return "LEATHER";
  if (text.includes("canvas")) return "CANVAS";
  return "HEAVYWEIGHT";
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, priority = false, compact = false }) => {
  const { addToCart, toggleWishlist, isInWishlist, setQuickViewProduct } = useStore();
  const [addedSize, setAddedSize] = useState<string | null>(null);

  const isFavorited = isInWishlist(product.id);
  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
  const lowStock = product.inStock && product.stockCount > 0 && product.stockCount <= 8;
  const secondary = product.images[1];

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const quickAdd = (e: React.MouseEvent, size: string) => {
    stop(e);
    addToCart(product, size, product.colors[0]?.name || "Default", 1);
    setAddedSize(size);
    setTimeout(() => setAddedSize(null), 1800);
  };

  return (
    <div data-reveal className="group relative flex h-full flex-col">
      {/* Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-ivory-dark">
        <Link href={`/product/${product.id}`} className="absolute inset-0" aria-label={product.name}>
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover object-center transition-all duration-700 ease-out group-hover:scale-105 ${secondary ? "sm:group-hover:opacity-0" : ""}`}
            priority={priority}
          />
          {secondary && (
            <Image
              src={secondary}
              alt=""
              fill
              sizes="(max-width: 1024px) 33vw, 25vw"
              className="hidden object-cover object-center opacity-0 transition-opacity duration-500 sm:block sm:group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Badges (max two on mobile) */}
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
          {discount > 0 ? (
            <span className="rounded-full bg-crimson px-2 py-0.5 text-[10px] font-bold text-white">−{discount}%</span>
          ) : product.isNew ? (
            <span className="rounded-full bg-espresso px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ivory">New</span>
          ) : null}
          <span className="hidden rounded-full bg-white/90 px-2 py-0.5 font-mono text-[9px] font-bold text-espresso backdrop-blur sm:inline-block">
            {fabricBadge(product)}
          </span>
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            toggleWishlist(product.id);
          }}
          aria-label={isFavorited ? "Remove from saved" : "Save for later"}
          aria-pressed={isFavorited}
          className={`absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90 ${
            isFavorited ? "bg-crimson text-white" : "bg-white/90 text-espresso backdrop-blur hover:text-crimson"
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
        </button>

        {/* Mobile quick add → opens quick view to choose size */}
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            setQuickViewProduct(product);
          }}
          aria-label={`Quick add ${product.name}`}
          className="absolute bottom-2 right-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-burgundy text-gold shadow-lg active:scale-90 sm:hidden"
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* Desktop hover: quick view + 1-tap size add */}
        <div className="absolute inset-x-2 bottom-2 z-20 hidden translate-y-2 flex-col gap-1.5 rounded-xl bg-white/95 p-2 opacity-0 shadow-lg backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-espresso/60">
              {addedSize ? `Size ${addedSize} added` : "Quick add"}
            </span>
            <button type="button" onClick={(e) => { stop(e); setQuickViewProduct(product); }} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-burgundy hover:text-crimson">
              <Eye className="h-3.5 w-3.5" /> View
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                disabled={!product.inStock}
                onClick={(e) => quickAdd(e, s)}
                className={`h-8 min-w-[34px] flex-1 rounded-lg font-mono text-[11px] font-bold transition-colors disabled:opacity-40 ${
                  addedSize === s ? "bg-green-700 text-white" : "bg-ivory text-espresso hover:bg-burgundy hover:text-gold"
                }`}
              >
                {addedSize === s ? <Check className="mx-auto h-3.5 w-3.5" /> : s}
              </button>
            ))}
          </div>
        </div>

        {!product.inStock && (
          <span className="absolute inset-x-0 bottom-0 z-10 bg-espresso/80 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-ivory">Sold out</span>
        )}
      </div>

      {/* Details */}
      <div className={`flex flex-1 flex-col pt-2.5 ${compact ? "" : "sm:pt-3"}`}>
        <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px]">
          <span className="truncate font-bold uppercase tracking-wider text-crimson">{product.category}</span>
          {product.reviewsCount > 0 ? (
            <span className="flex flex-shrink-0 items-center gap-0.5 font-semibold text-espresso/80">
              <Star className="h-3 w-3 fill-gold text-gold" /> {product.rating.toFixed(1)}
              <span className="font-normal text-espresso/50">({product.reviewsCount})</span>
            </span>
          ) : lowStock ? (
            <span className="flex-shrink-0 font-semibold text-crimson">Only {product.stockCount} left</span>
          ) : null}
        </div>
        <Link href={`/product/${product.id}`} className="mt-0.5">
          <h3 className={`line-clamp-2 font-serif font-bold leading-snug text-espresso transition-colors hover:text-crimson ${compact ? "text-[13px]" : "text-[13px] sm:text-base"}`}>
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
          <span className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-burgundy sm:text-base">{formatPrice(product.price)}</span>
            {product.originalPrice && <span className="text-[11px] text-espresso/40 line-through">{formatPrice(product.originalPrice)}</span>}
          </span>
          <span className="flex flex-shrink-0 items-center -space-x-1" aria-label={`${product.colors.length} colours`}>
            {product.colors.slice(0, 3).map((c) => (
              <span key={c.name} title={c.name} className="h-3 w-3 rounded-full border border-white ring-1 ring-black/15" style={{ backgroundColor: c.hex }} />
            ))}
            {product.colors.length > 3 && <span className="pl-1.5 text-[10px] text-espresso/50">+{product.colors.length - 3}</span>}
          </span>
        </div>
      </div>
    </div>
  );
};
