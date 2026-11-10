"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Maximize2,
  Sliders,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";

interface SilhouetteData {
  id: string;
  name: string;
  tagline: string;
  category: "Oversized" | "Jeans" | "Boxy Fit" | "Jackets";
  landingHref: string;
  fabricName: string;
  fabricWeight: string;
  weightValue: number; // percentage for visual meter
  weightUnit: string;
  shoulderDrop: string;
  hemCut: string;
  provenance: string;
  description: string;
  heroImage: string;
  featuredProductIds: string[];
}

const SILHOUETTES: SilhouetteData[] = [
  {
    id: "sil-oversized",
    name: "Oversized Silhouette",
    tagline: "Exaggerated Chest Volume & 520gsm Loopback Terry",
    category: "Oversized",
    landingHref: "/oversized",
    fabricName: "Japanese Loopback & Long-Staple Cotton",
    fabricWeight: "520",
    weightValue: 88,
    weightUnit: "gsm",
    shoulderDrop: "+12cm Dropped Stance",
    hemCut: "Natural Weighted Fall",
    provenance: "Milled in Hamamatsu, Japan",
    description:
      "Engineered for brutalist architectural presence. Our oversized cut eliminates side tension, creating an unyielding column of heavyweight drape that hangs away from the torso while maintaining razor-sharp cuff control.",
    heroImage:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
    featuredProductIds: ["ts-001", "ts-002"],
  },
  {
    id: "sil-jeans",
    name: "Okayama Selvedge Jeans",
    tagline: "14oz–15oz Shuttle Loom Denim with Relaxed Stacking",
    category: "Jeans",
    landingHref: "/jeans",
    fabricName: "Redline Selvedge Ring-Spun Cotton",
    fabricWeight: "14.5",
    weightValue: 82,
    weightUnit: "oz",
    shoulderDrop: "Relaxed Wide Thigh",
    hemCut: "Puddle Sneaker Stack",
    provenance: "Woven on Vintage Toyoda Looms in Okayama",
    description:
      "Cut with a generous relaxed leg and utility carpenter detailing. Woven at low tension on shuttle looms to preserve natural slub texture, producing distinctive high-contrast fade patterns that mold to your daily wear.",
    heroImage:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop",
    featuredProductIds: ["ts-004", "ts-006"],
  },
  {
    id: "sil-boxy",
    name: "Boxy Fit Architecture",
    tagline: "Square Torso Geometry with Cropped Hemline",
    category: "Boxy Fit",
    landingHref: "/boxy-fit",
    fabricName: "Mercerized Poplin & 7-Gauge Extra-Fine Merino",
    fabricWeight: "310",
    weightValue: 65,
    weightUnit: "gsm",
    shoulderDrop: "Extended Square Stance",
    hemCut: "Natural Waistline Crop",
    provenance: "Artisanal Knitting in Biella, Italy",
    description:
      "Calculated geometry engineered to rebalance contemporary streetwear proportions. Wide horizontal shoulder lines paired with a sharp waist crop maximize leg length when styled over baggy carpenter jeans.",
    heroImage:
      "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1200&auto=format&fit=crop",
    featuredProductIds: ["ts-007", "ts-008"],
  },
  {
    id: "sil-jackets",
    name: "Structural Jackets",
    tagline: "Florentine Lambskin Suede & 16oz Washed Duck Canvas",
    category: "Jackets",
    landingHref: "/jackets",
    fabricName: "Tuscan Suede & Heavy Cotton Canvas",
    fabricWeight: "16",
    weightValue: 95,
    weightUnit: "oz",
    shoulderDrop: "Ergonomic Box Cut",
    hemCut: "Action-Back Pleats",
    provenance: "Hand-Assembled in Florence, Italy",
    description:
      "Heavyweight outer armor cut with generous room for hoodie layering. Featuring solid brass dual-pull Swiss zippers, triple-needle chain stitching, and quilted flannel insulation for all-season resilience.",
    heroImage:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
    featuredProductIds: ["ts-010", "ts-011"],
  },
];

export const SilhouetteStudio: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeSil = SILHOUETTES[activeIdx];
  const { products, addToCart } = useStore();

  const activeProducts = products.filter((p) =>
    activeSil.featuredProductIds.includes(p.id)
  );

  return (
    <section className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 md:py-16">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-8 pb-3 border-b border-burgundy/15 gap-2 sm:gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-burgundy/10 text-burgundy text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-1">
            <Sliders className="w-3 h-3 text-crimson" />
            <span>Interactive Silhouette Lab</span>
          </div>
          <h2 className="font-serif text-xl sm:text-3xl lg:text-4xl font-bold text-espresso">
            The Silhouette Studio
          </h2>
          <p className="text-[11px] sm:text-xs md:text-sm text-espresso/70 mt-0.5 max-w-xl font-light">
            Compare fabric weights, dropped shoulders, and proportions across our 4 pillars.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-1 sm:space-x-2 bg-ivory-dark p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-burgundy/15 overflow-x-auto max-w-full">
          {SILHOUETTES.map((sil, idx) => (
            <button
              key={sil.id}
              onClick={() => setActiveIdx(idx)}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all ${
                activeIdx === idx
                  ? "bg-burgundy text-gold shadow-xs scale-[1.02]"
                  : "text-espresso/70 hover:text-burgundy hover:bg-ivory"
              }`}
            >
              {sil.category}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Interactive Stage */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSil.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch"
        >
          {/* Left: Technical Architecture & Metrics */}
          <div className="lg:col-span-6 flex flex-col justify-between p-4 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-ivory to-white border border-burgundy/15 shadow-xs space-y-4 sm:space-y-6">
            <div className="space-y-2 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-crimson">
                  0{activeIdx + 1} / 04 • {activeSil.category} Architecture
                </span>
                <span className="text-[10px] sm:text-xs text-espresso/50 font-mono">
                  {activeSil.provenance}
                </span>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-espresso">
                {activeSil.name}
              </h3>

              <p className="text-xs sm:text-sm text-espresso/80 leading-relaxed font-light">
                {activeSil.description}
              </p>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 pt-3 sm:pt-4 border-t border-burgundy/10 text-xs">
              <div className="p-3 sm:p-4 rounded-xl bg-ivory/60 border border-burgundy/10 space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center text-espresso/60 text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold">
                  <span>Fabric Density</span>
                  <span className="text-burgundy font-bold font-mono">
                    {activeSil.fabricWeight} {activeSil.weightUnit}
                  </span>
                </div>
                {/* Visual density meter */}
                <div className="w-full bg-burgundy/10 h-1.5 sm:h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${activeSil.weightValue}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="bg-burgundy h-full rounded-full"
                  />
                </div>
                <span className="block text-[10px] sm:text-[11px] text-espresso/80 font-medium truncate">
                  {activeSil.fabricName}
                </span>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-ivory/60 border border-burgundy/10 space-y-0.5 sm:space-y-1">
                <span className="text-espresso/60 text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold block">
                  Shoulder & Stance
                </span>
                <span className="font-bold text-espresso text-xs sm:text-sm block">
                  {activeSil.shoulderDrop}
                </span>
                <span className="text-[10px] sm:text-[11px] text-espresso/70 block">
                  Hem: {activeSil.hemCut}
                </span>
              </div>
            </div>

            {/* Dedicated Landing Page CTA */}
            <div className="pt-1 sm:pt-2 flex flex-row items-center gap-2 sm:gap-3">
              <Link
                href={activeSil.landingHref}
                className="flex-1 py-2.5 sm:py-3.5 px-3 sm:px-6 bg-burgundy hover:bg-crimson text-ivory text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] rounded-lg sm:rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 group text-center"
              >
                <span>{activeSil.category} Specs</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href={`/shop?category=${encodeURIComponent(activeSil.category)}`}
                className="py-2.5 sm:py-3.5 px-3 sm:px-5 border border-burgundy/25 hover:border-burgundy text-burgundy text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg sm:rounded-xl transition-colors text-center"
              >
                Shop All
              </Link>
            </div>
          </div>

          {/* Right: Featured Silhouette Look & Quick Actions */}
          <div className="lg:col-span-6 relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[260px] sm:min-h-[380px] lg:min-h-[420px] shadow-sm group">
            <img
              src={activeSil.heroImage}
              alt={activeSil.name}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/30 to-transparent opacity-90 group-hover:opacity-85 transition-opacity" />

            {/* Overlay Details */}
            <div className="absolute inset-0 p-4 sm:p-8 lg:p-10 flex flex-col justify-between text-ivory">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-gold/90 text-espresso text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                  Featured {activeSil.category}
                </span>
                <span className="text-[10px] sm:text-xs text-ivory/80 font-mono">
                  AW/2026 Direct Atelier
                </span>
              </div>

              <div className="space-y-1.5 sm:space-y-3">
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-gold font-bold block">
                  {activeSil.tagline}
                </span>
                <h4 className="font-serif text-lg sm:text-2xl lg:text-3xl font-bold text-white">
                  {activeSil.name}
                </h4>

                {/* Featured Products Quick Add */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                  {activeProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p, p.sizes[0], p.colors[0]?.name || "Default", 1)}
                      className="py-1.5 px-2.5 sm:py-2 sm:px-3.5 rounded-lg bg-ivory/20 backdrop-blur-md hover:bg-gold hover:text-espresso border border-ivory/30 text-[10px] sm:text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1"
                    >
                      <span>Claim {p.name.split(" ")[1] || p.name}</span>
                      <span className="text-[10px] opacity-80">${p.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
};
