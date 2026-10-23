"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";
import { CinematicHero } from "@/components/premium/CinematicHero";
import { SilhouetteAccordion } from "@/components/premium/SilhouetteAccordion";
import { ScrollProductReel } from "@/components/premium/ScrollProductReel";
import { VelocityMarquee } from "@/components/premium/VelocityMarquee";
import { TrustStrip } from "@/components/premium/TrustStrip";
import { HangingRail } from "@/components/premium/HangingRail";
import { JodhpurEdit } from "@/components/premium/JodhpurEdit";
import { ManifestoReveal } from "@/components/premium/ManifestoReveal";
import { ShopByPriceOccasion } from "@/components/premium/ShopByPriceOccasion";
import { ScrollProgress } from "@/components/premium/ScrollProgress";
import { NewArrivalsDropRadar } from "@/components/NewArrivalsDropRadar";
import { ShopTheFitSection } from "@/components/ShopTheFitSection";
import { CustomerReviewGallery } from "@/components/CustomerReviewGallery";
import { OffcultAssistDrawer } from "@/components/OffcultAssistDrawer";
import { LiveCourierTrackerModal } from "@/components/LiveCourierTrackerModal";

export default function HomePage() {
  const { products, siteSettings } = useStore();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  const featuredProducts =
    activeCategory === "All"
      ? products.filter((p) => p.featured || p.isBestSeller).slice(0, 8)
      : products.filter((p) => p.category === activeCategory).slice(0, 8);

  return (
    <div className="bg-bone text-stone-900 space-y-16 sm:space-y-24 md:space-y-32 pb-16 sm:pb-24">
      <CinematicHero />

      <VelocityMarquee phrases={siteSettings.marqueePhrases} />

      <TrustStrip />

      <SilhouetteAccordion />

      <HangingRail />

      <ManifestoReveal />

      <JodhpurEdit />

      {/* 4. NEW ARRIVALS DROP RADAR (Interactive Grid with 1-Tap Sizing) */}
      <NewArrivalsDropRadar />

      <ScrollProductReel />

      {/* 5. SHOP THE COMPLETE FIT - CURATED OUTFIT BUNDLER (Off Duty Signature) */}
      <div id="shop-the-fit">
        <ShopTheFitSection />
      </div>

      <ShopByPriceOccasion />

      {/* 8. SEASONAL HIGHLIGHTS WITH QUICK SIZE PILL SELECTION */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-8 pb-3 border-b border-stone-200 gap-2">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-burgundy block mb-0.5">
              Seasonal Releases
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-950">
              Trending In Tokyo & Milan
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-burgundy hover:text-crimson flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Explore All Drops</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Silhouette Category Filter Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-5 sm:mb-7 overflow-x-auto no-scrollbar pb-1">
          {["All", "Oversized", "Jeans", "Boxy Fit", "Jackets"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-burgundy text-white shadow-sm scale-102"
                  : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400 hover:text-stone-900"
              }`}
            >
              {cat === "All" ? "All Silhouettes" : cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {featuredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* 10. AUTHENTIC PHOTO-BACKED CUSTOMER REVIEW GALLERY */}
      <CustomerReviewGallery />

      {/* 11. FLOATING FIT CONCIERGE & LIVE COURIER TRACKER */}
      <OffcultAssistDrawer onOpenTracker={() => setIsTrackerOpen(true)} />

      <LiveCourierTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
      />
      <ScrollProgress />
    </div>
  );
}
