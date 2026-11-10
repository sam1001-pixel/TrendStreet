"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ShoppingBag,
  Check,
  Flame,
  Lock,
  Layers,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";

export const LimitedEditionVault: React.FC = () => {
  const { addToCart, products } = useStore();
  const [selectedSize, setSelectedSize] = useState<string>("L");
  const [isAdded, setIsAdded] = useState(false);

  // Spotlight product: The Tuscan Suede Flight Jacket or Tokyo Hoodie
  const vaultProduct =
    products.find((p) => p.id === "ts-010") ||
    products.find((p) => p.category === "Jackets") ||
    products[0];

  const handleClaim = () => {
    if (vaultProduct) {
      addToCart(vaultProduct, selectedSize, vaultProduct.colors[0]?.name || "Deep Burgundy", 1);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2400);
    }
  };

  const totalPieces = 120;
  const claimedPieces = 101;
  const remainingPieces = totalPieces - claimedPieces;
  const percentClaimed = Math.round((claimedPieces / totalPieces) * 100);

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-espresso text-ivory border border-gold/25 p-5 sm:p-10 lg:p-12 shadow-2xl">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-burgundy/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
          {/* Left Column: Scarcity Narrative & Action */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-gold/20">
              <Lock className="w-3 h-3 text-gold" />
              <span>Limited Batch Capsule // Drop 04</span>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold text-ivory leading-tight">
                The Obsidian & Suede <br />
                <span className="italic font-normal text-gold">Numbered Release</span>
              </h2>
              <p className="text-xs sm:text-sm text-ivory/80 leading-relaxed font-light max-w-lg">
                Individually numbered woven label hand-stitched into the internal chest lining. Woven from 700gsm buffed Italian suede and lined with Japanese cupro. Strictly limited to {totalPieces} units worldwide with zero restocks.
              </p>
            </div>

            {/* Live Batch Progress Meter */}
            <div className="p-4 rounded-xl bg-black/40 border border-gold/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-gold font-bold">
                  <Flame className="w-3.5 h-3.5 text-crimson animate-pulse" />
                  <span>Batch Allocation Status</span>
                </span>
                <span className="text-ivory font-bold">{remainingPieces} Units Remaining</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-crimson via-burgundy to-gold rounded-full transition-all duration-1000"
                  style={{ width: `${percentClaimed}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-ivory/50 font-mono">
                <span>{claimedPieces} Allocated to Collectors</span>
                <span>{percentClaimed}% Claimed</span>
              </div>
            </div>

            {/* Size Selector & Claim CTA */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] uppercase font-bold text-ivory/80">
                  Select Silhouette Size:
                </span>
                <span className="text-[11px] text-gold font-mono">
                  {vaultProduct?.name} · {formatPrice(vaultProduct?.price || 9999)}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {["S", "M", "L", "XL"].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`py-2 px-4 rounded-lg font-mono text-xs font-bold transition-all ${
                      selectedSize === sz
                        ? "bg-gold text-espresso font-bold shadow-md scale-105"
                        : "bg-white/10 hover:bg-white/20 text-ivory border border-white/10"
                    }`}
                  >
                    Size {sz}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClaim}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-bold uppercase tracking-[0.16em] text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98 ${
                    isAdded
                      ? "bg-green-700 text-white"
                      : "bg-gold hover:bg-gold-light text-espresso"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Unit Reserved in Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Claim Numbered Garment</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/product/${vaultProduct.id}`}
                  className="py-3.5 px-5 rounded-xl border border-gold/30 hover:border-gold text-gold hover:bg-gold/10 font-bold uppercase tracking-wider text-xs transition-colors text-center"
                >
                  Inspect Piece
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Showcase */}
          <div className="lg:col-span-6 relative aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden border border-gold/20 shadow-xl group">
            <img
              src={vaultProduct?.images[0] || "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop"}
              alt="Limited Edition Vault Garment"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-transparent to-black/30" />

            {/* Serialized Number Plate Tag Overlay */}
            <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-espresso/90 backdrop-blur-md border border-gold/30 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-gold block">
                  Atelier Registration Certificate
                </span>
                <span className="font-mono text-sm font-bold text-ivory">
                  SERIAL NO: TS-2026-042 / 120
                </span>
              </div>

              <span className="px-2.5 py-1 rounded bg-gold/20 text-gold text-[10px] font-mono font-bold uppercase">
                AUTHENTIC
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
