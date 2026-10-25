"use client";

import React, { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { CinematicHero } from "@/components/premium/CinematicHero";
import { SilhouetteAccordion } from "@/components/premium/SilhouetteAccordion";
import { ScrollProductReel } from "@/components/premium/ScrollProductReel";
import { VelocityMarquee } from "@/components/premium/VelocityMarquee";
import { TrustStrip } from "@/components/premium/TrustStrip";
import { HangingRail } from "@/components/premium/HangingRail";
import { ScrollProgress } from "@/components/premium/ScrollProgress";
import { ProductShowcase } from "@/components/ProductShowcase";
import { CustomerReviewGallery } from "@/components/CustomerReviewGallery";
import { OffcultAssistDrawer } from "@/components/OffcultAssistDrawer";
import { LiveCourierTrackerModal } from "@/components/LiveCourierTrackerModal";

export default function HomePage() {
  const { siteSettings } = useStore();
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  return (
    <div className="space-y-14 bg-bone pb-16 text-stone-900 sm:space-y-24 sm:pb-24 md:space-y-28">
      <CinematicHero />

      <div className="!mt-0">
        <VelocityMarquee phrases={siteSettings.marqueePhrases} />
      </div>

      <TrustStrip />

      {/* Products first: what's new and what sells */}
      <ProductShowcase />

      <SilhouetteAccordion />

      <HangingRail />

      <ScrollProductReel />

      <CustomerReviewGallery />

      <OffcultAssistDrawer onOpenTracker={() => setIsTrackerOpen(true)} />
      <LiveCourierTrackerModal isOpen={isTrackerOpen} onClose={() => setIsTrackerOpen(false)} />
      <ScrollProgress />
    </div>
  );
}
