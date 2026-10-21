"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Flame,
  Check,
  Eye,
  SlidersHorizontal,
  Clock,
  Zap,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";
import { Product } from "@/types/store";

export const NewArrivalsDropRadar: React.FC = () => {
  const { products, addToCart } = useStore();
  const [selectedSilhouette, setSelectedSilhouette] = useState<string>("All");
  const [addedItemSizes, setAddedItemSizes] = useState<Record<string, string>>({});

  // Filter products by isNew or featured, and category
  const filteredProducts = products
    .filter((p) => {
      if (selectedSilhouette === "All") return p.isNew || p.featured;
      return p.category === selectedSilhouette;
    })
    .slice(0, 8);

  const handleSizeAdd = (e: React.MouseEvent, product: Product, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, size, product.colors[0]?.name || "Default", 1);
    setAddedItemSizes((prev) => ({ ...prev, [product.id]: size }));
    setTimeout(() => {
      setAddedItemSizes((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    }, 2000);
  };

  const getFabricBadge = (prod: Product): string => {
    if (prod.category === "Oversized") {
      return prod.name.toLowerCase().includes("hoodie") ? "520 GSM TERRY" : "320 GSM COTTON";
    }
    if (prod.category === "Jeans") {
      return "14.5 OZ SELVEDGE";
    }
    if (prod.category === "Boxy Fit") {
      return "320 GSM BOX-CUT";
    }
    if (prod.category === "Jackets") {
      return "700 GSM SUEDE/WOOL";
    }
    return "HEAVYWEIGHT";
  };

  return (
    <section id="new-arrivals" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      {/* Editorial Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 sm:mb-8 pb-3 border-b border-burgundy/15 gap-3">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-crimson/10 text-crimson text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1.5">
            <span className="w-2 h-2 rounded-full bg-crimson animate-ping" />
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-gold" />
              <span>Drop Radar // Autumn Winter 2026</span>
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-espresso">
            New Arrivals & Limited Restocks
          </h2>
          <p className="text-xs sm:text-sm text-espresso/70 mt-1 max-w-xl font-light">
            Engineered with uncompromising density. Custom 320–520gsm textiles and vintage shuttle-loomed Japanese selvedge.
          </p>
        </div>

        {/* Action Link & Live Batch Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ivory border border-burgundy/15 text-[11px] font-mono text-espresso/70">
            <Clock className="w-3.5 h-3.5 text-burgundy" />
            <span>Batch 04 Dispatches Daily · 24h</span>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold uppercase tracking-widest text-burgundy hover:text-crimson flex items-center gap-1.5 transition-colors"
          >
            <span>All 4 Silhouettes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Silhouette Category Filter Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-5 sm:mb-7 overflow-x-auto no-scrollbar pb-1">
        {["All", "Oversized", "Jeans", "Boxy Fit", "Jackets"].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedSilhouette(cat)}
            className={`px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${
              selectedSilhouette === cat
                ? "bg-burgundy text-gold shadow-md scale-105"
                : "bg-ivory text-espresso/70 border border-burgundy/15 hover:border-burgundy hover:text-espresso"
            }`}
          >
            {cat === "All" ? "All New Arrivals" : cat}
          </button>
        ))}
      </div>

      {/* Grid of New Arrival Streetwear Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {filteredProducts.map((product) => {
          const addedSize = addedItemSizes[product.id];
          const fabricBadge = getFabricBadge(product);

          return (
            <div
              key={product.id}
              data-reveal
              className="group relative rounded-xl sm:rounded-2xl bg-white border border-burgundy/15 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Media Container */}
              <div className="relative aspect-[4/5] bg-ivory-dark/30 overflow-hidden">
                {/* Product Link wrapping the image */}
                <Link
                  href={`/product/${product.id}`}
                  className="block w-full h-full cursor-pointer"
                  tabIndex={0}
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </Link>

                {/* Badges Overlay */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                  <span className="px-2 py-0.5 rounded-full bg-espresso/80 backdrop-blur-sm text-[9px] sm:text-[10px] font-mono font-bold text-gold border border-gold/20 shadow-xs">
                    {fabricBadge}
                  </span>

                  {product.isNew && (
                    <span className="px-2 py-0.5 rounded-full bg-crimson text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
                      NEW
                    </span>
                  )}
                </div>

                {/* Desktop 1-Tap Quick Size Pill Overlay (Appears on Hover) */}
                <div className="hidden sm:flex absolute inset-x-2 bottom-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-col items-center gap-1 bg-white/95 backdrop-blur-md p-2 rounded-lg border border-burgundy/15 shadow-lg">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-espresso/70">
                    {addedSize ? `Added Size ${addedSize} to Bag ✓` : "1-Tap Quick Size Select:"}
                  </span>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap w-full">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={(e) => handleSizeAdd(e, product, s)}
                        className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-all active:scale-95 ${
                          addedSize === s
                            ? "bg-green-700 text-white scale-105"
                            : "bg-ivory hover:bg-burgundy text-espresso hover:text-gold border border-burgundy/15"
                        }`}
                      >
                        {addedSize === s ? "✓" : s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between bg-white">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-espresso/60 mb-0.5">
                    <span className="uppercase font-bold tracking-wider text-burgundy">
                      {product.category}
                    </span>
                    <span className="text-[10px] text-espresso/50 font-mono">
                      {product.stockCount ? `${product.stockCount} left` : "In Stock"}
                    </span>
                  </div>

                  <Link href={`/product/${product.id}`}>
                    <h3 className="font-serif text-xs sm:text-base font-bold text-espresso group-hover:text-burgundy transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>

                  <p className="text-[10px] sm:text-xs text-espresso/70 line-clamp-1 mt-0.5 font-light">
                    {product.subtitle}
                  </p>
                </div>

                {/* Price, Mobile Size Pills & Color Swatches */}
                <div className="mt-3 pt-2.5 border-t border-burgundy/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xs sm:text-base font-bold text-burgundy">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-[10px] sm:text-xs text-espresso/40 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Color Dots */}
                    <div className="flex items-center space-x-1">
                      {product.colors.slice(0, 3).map((col) => (
                        <span
                          key={col.name}
                          title={col.name}
                          className="w-2.5 h-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: col.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Mobile Size Strip (1-tap add directly on mobile screen) */}
                  <div className="sm:hidden flex items-center justify-between gap-1 pt-1 overflow-x-auto no-scrollbar">
                    <span className="text-[9px] text-espresso/50 uppercase font-mono font-bold flex-shrink-0">
                      {addedSize ? `Added ${addedSize}!` : "Size:"}
                    </span>
                    <div className="flex items-center gap-1">
                      {product.sizes.slice(0, 4).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={(e) => handleSizeAdd(e, product, s)}
                          className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border transition-all ${
                            addedSize === s
                              ? "bg-green-700 text-white border-green-700"
                              : "bg-ivory border-burgundy/20 text-espresso active:bg-burgundy active:text-gold"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
