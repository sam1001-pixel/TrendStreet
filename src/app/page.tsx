"use client";

import React, { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { CinematicHero } from "@/components/premium/CinematicHero";
import { SilhouetteAccordion } from "@/components/premium/SilhouetteAccordion";
import { ScrollProductReel } from "@/components/premium/ScrollProductReel";
import { VelocityMarquee } from "@/components/premium/VelocityMarquee";
import { TrustStrip } from "@/components/premium/TrustStrip";
import { HangingRail } from "@/components/premium/HangingRail";
import { WeightTest } from "@/components/premium/WeightTest";
import { ShopByPriceOccasion } from "@/components/premium/ShopByPriceOccasion";
import { ProductShowcase } from "@/components/ProductShowcase";
import { CustomerReviewGallery } from "@/components/CustomerReviewGallery";
import { OffcultAssistDrawer } from "@/components/OffcultAssistDrawer";
import { LiveCourierTrackerModal } from "@/components/LiveCourierTrackerModal";

export default function HomePage() {
  const { siteSettings } = useStore();
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  return (
    <div className="space-y-14 bg-bone pb-16 text-stone-900 sm:space-y-24 sm:pb-24 md:space-y-28">
      {siteSettings?.storefrontSections?.hero !== false && <CinematicHero />}

      <div className="!mt-0">
        <VelocityMarquee phrases={siteSettings.marqueePhrases} />
      </div>

      {siteSettings?.storefrontSections?.trustStrip !== false && <TrustStrip />}

      {/* Products first: what's new and what sells */}
      {siteSettings?.storefrontSections?.dropList !== false && <ProductShowcase />}

      {siteSettings?.storefrontSections?.silhouetteAccordion !== false && <SilhouetteAccordion />}

      {siteSettings?.storefrontSections?.hangingRail !== false && <HangingRail />}

      {/* Fabric weight comparison */}
      {siteSettings?.storefrontSections?.weightTest !== false && <WeightTest />}

      {siteSettings?.storefrontSections?.runwayReel !== false && <ScrollProductReel />}

      {/* Curated shopping shortcuts */}
      {siteSettings?.storefrontSections?.shopByPriceOccasion !== false && <ShopByPriceOccasion />}

      {siteSettings?.storefrontSections?.reviewGallery !== false && <CustomerReviewGallery />}

      <OffcultAssistDrawer onOpenTracker={() => setIsTrackerOpen(true)} />
      <LiveCourierTrackerModal isOpen={isTrackerOpen} onClose={() => setIsTrackerOpen(false)} />
    </div>
  );
}
