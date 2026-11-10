"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ShoppingBag,
  Eye,
  Check,
  Zap,
  ChevronRight,
  Ruler,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";

interface SilhouetteHeroLook {
  id: string;
  silhouette: "Oversized" | "Jeans" | "Boxy Fit" | "Jackets";
  name: string;
  tagline: string;
  badge: string;
  price: number;
  originalPrice: number;
  productId: string;
  modelImage: string;
  garmentImage: string;
  specs: {
    weight: string;
    origin: string;
    drape: string;
  };
  sizes: string[];
}

const HERO_LOOKS: SilhouetteHeroLook[] = [
  {
    id: "hero-oversized",
    silhouette: "Oversized",
    name: "The Tokyo Drop-Shoulder Hoodie",
    tagline: "Unstructured 520gsm volume with architectural standing double hood.",
    badge: "Drop 04 · Flagship Silhouette",
    price: 4999,
    originalPrice: 5799,
    productId: "ts-002",
    modelImage: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
    garmentImage: "/flying-wear-coat.png",
    specs: {
      weight: "520 GSM French Terry",
      origin: "Milled in Hamamatsu, Japan",
      drape: "Wide Boxy Stance",
    },
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "hero-jeans",
    silhouette: "Jeans",
    name: "The Shibuya Relaxed Carpenter Denim",
    tagline: "Vintage Toyoda shuttle-loom selvedge engineered with skater puddle stacking.",
    badge: "14.5oz Okayama Selvedge",
    price: 5499,
    originalPrice: 6299,
    productId: "ts-004",
    modelImage: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1200&auto=format&fit=crop",
    garmentImage: "/flying-wear-jeans.png",
    specs: {
      weight: "14.5oz Redline Selvedge",
      origin: "Kuroki Mills, Okayama",
      drape: "Relaxed Ankle Puddle",
    },
    sizes: ["30", "32", "34", "36"],
  },
  {
    id: "hero-boxy",
    silhouette: "Boxy Fit",
    name: "The Mayfair Heavyweight Tee",
    tagline: "Cropped architectural hem with 3cm seamless high-density collar.",
    badge: "320 GSM Combed Cotton",
    price: 2499,
    originalPrice: 2999,
    productId: "ts-001",
    modelImage: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop",
    garmentImage: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop",
    specs: {
      weight: "320 GSM Pure Cotton",
      origin: "Long-Staple Ring Spun",
      drape: "Structured Boxy Hang",
    },
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "hero-jackets",
    silhouette: "Jackets",
    name: "The Tuscan Suede Flight Bomber",
    tagline: "Hand-buffed Italian split suede with dropped shoulders and antique brass RiRi zips.",
    badge: "700 GSM Outerwear Cut",
    price: 9999,
    originalPrice: 11499,
    productId: "ts-010",
    modelImage: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
    garmentImage: "/flying-wear-jacket.png",
    specs: {
      weight: "700 GSM Buffed Suede",
      origin: "Santa Croce, Tuscany",
      drape: "Cropped Moto Silhouette",
    },
    sizes: ["S", "M", "L", "XL"],
  },
];

export const StreetwearEditorialHero: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart, products } = useStore();

  const currentLook = HERO_LOOKS[activeTab];
  const linkedProduct = products.find((p) => p.id === currentLook.productId) || products[0];

  const handleSizeClick = (size: string) => {
    setSelectedSize(size);
    if (linkedProduct) {
      addToCart(linkedProduct, size, linkedProduct.colors[0]?.name || "Default", 1);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2200);
    }
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6">
      {/* 4-Silhouette Fast Switcher Header Bar */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 overflow-x-auto no-scrollbar pb-1 gap-2 border-b border-stone-200">
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {HERO_LOOKS.map((look, idx) => {
            const isActive = activeTab === idx;
            return (
              <button
                key={look.id}
                type="button"
                onClick={() => {
                  setActiveTab(idx);
                  setSelectedSize(null);
                }}
                className={`group py-2 sm:py-3 px-3 sm:px-5 rounded-t-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all relative flex items-center gap-1.5 ${
                  isActive
                    ? "text-burgundy bg-white border-t-2 border-burgundy shadow-xs"
                    : "text-stone-500 hover:text-stone-900 bg-transparent"
                }`}
              >
                <span>{look.silhouette}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Live Drop Pill */}
        <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-600 animate-ping" />
          <span className="font-bold text-stone-900">DROP 04 LIVE</span>
          <span>· Mumbai Atelier Dispatch</span>
        </div>
      </div>

      {/* Main Full-Width Editorial Hero Canvas */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-stone-200 shadow-sm min-h-[500px] sm:min-h-[560px] lg:min-h-[620px] flex flex-col lg:flex-row items-stretch">
        {/* Left Column: High-Fashion Streetwear Model Photography */}
        <div className="w-full lg:w-7/12 relative min-h-[380px] sm:min-h-[440px] lg:min-h-full bg-stone-100 overflow-hidden group">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLook.id}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative w-full h-full min-h-[380px] sm:min-h-[440px] lg:min-h-[620px]"
            >
              <img
                src={currentLook.modelImage}
                alt={currentLook.name}
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
                loading="eager"
              />

              {/* Subtle Gradient Scrim for Editorial Tone */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/30" />

              {/* Model In-Scene Badges */}
              <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] sm:text-xs font-mono font-bold tracking-wider text-stone-900 shadow-sm border border-stone-200">
                  {currentLook.badge}
                </span>
                <span className="px-3 py-1 rounded-full bg-burgundy text-white text-[10px] sm:text-xs font-bold tracking-wider uppercase shadow-sm">
                  {currentLook.specs.weight}
                </span>
              </div>

              {/* Mobile In-Image Caption */}
              <div className="absolute bottom-4 left-4 right-4 z-10 lg:hidden text-white space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold block">
                  {currentLook.silhouette} Silhouette
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold leading-tight drop-shadow-md">
                  {currentLook.name}
                </h2>
                <div className="flex items-baseline space-x-2 pt-0.5">
                  <span className="text-lg font-serif font-bold text-white drop-shadow">
                    {formatPrice(currentLook.price)}
                  </span>
                  <span className="text-xs text-white/70 line-through">
                    {formatPrice(currentLook.originalPrice)}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Column: Clean Luxury Commerce & 1-Tap Sizing */}
        <div className="w-full lg:w-5/12 p-5 sm:p-8 lg:p-10 flex flex-col justify-between bg-white text-stone-900">
          <div className="space-y-4 sm:space-y-6">
            {/* Desktop Silhouette Heading */}
            <div className="hidden lg:block space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-burgundy/10 text-burgundy text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-crimson" />
                <span>{currentLook.silhouette} Silhouette</span>
              </div>

              <h2 className="font-serif text-3xl xl:text-4xl font-bold text-stone-950 leading-tight">
                {currentLook.name}
              </h2>

              <p className="text-sm text-stone-600 leading-relaxed font-light">
                {currentLook.tagline}
              </p>

              {/* Pricing */}
              <div className="flex items-baseline space-x-3 pt-1">
                <span className="font-serif text-2xl xl:text-3xl font-bold text-burgundy">
                  {formatPrice(currentLook.price)}
                </span>
                <span className="text-sm text-stone-400 line-through">
                  {formatPrice(currentLook.originalPrice)}
                </span>
                <span className="text-xs font-bold text-green-700 uppercase bg-green-50 px-2 py-0.5 rounded">
                  Save {Math.round(((currentLook.originalPrice - currentLook.price) / currentLook.originalPrice) * 100)}%
                </span>
              </div>
            </div>

            {/* Spec Highlights Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 py-3 border-y border-stone-200 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-stone-500 block">Density</span>
                <span className="font-bold text-stone-900 text-xs sm:text-sm block">{currentLook.specs.weight}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-stone-500 block">Milled In</span>
                <span className="font-bold text-stone-900 text-xs sm:text-sm block">{currentLook.specs.origin}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-stone-500 block">Drape</span>
                <span className="font-bold text-stone-900 text-xs sm:text-sm block">{currentLook.specs.drape}</span>
              </div>
            </div>

            {/* 1-Tap Quick Size Selector (Instant Buy / Add on Both Desktop & Mobile) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-stone-900 text-[11px]">
                  {isAdded ? `✓ Added Size ${selectedSize} to Bag!` : "1-Tap Size Select & Add:"}
                </span>
                <Link
                  href={`/product/${currentLook.productId}`}
                  className="text-stone-500 hover:text-burgundy flex items-center gap-1 text-[11px] underline"
                >
                  <Ruler className="w-3 h-3" />
                  <span>Size Guide</span>
                </Link>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
                {currentLook.sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSizeClick(sz)}
                    className={`py-2.5 sm:py-3 text-xs sm:text-sm font-mono font-bold rounded-lg border transition-all active:scale-95 ${
                      selectedSize === sz && isAdded
                        ? "bg-green-700 text-white border-green-700 shadow-md"
                        : "bg-stone-50 hover:bg-burgundy text-stone-900 hover:text-white border-stone-200 hover:border-burgundy"
                    }`}
                  >
                    {selectedSize === sz && isAdded ? "✓" : sz}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-5 mt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center gap-2.5">
            <Link
              href={`/product/${currentLook.productId}`}
              className="w-full sm:flex-1 py-3.5 px-6 bg-burgundy hover:bg-burgundy-light text-white text-xs font-bold uppercase tracking-[0.16em] rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-center"
            >
              <Eye className="w-4 h-4 text-gold" />
              <span>Inspect Garment Details</span>
            </Link>

            <Link
              href={`/${currentLook.silhouette.toLowerCase().replace(" ", "-")}`}
              className="w-full sm:w-auto py-3.5 px-6 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors text-center"
            >
              <span>Explore {currentLook.silhouette}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
