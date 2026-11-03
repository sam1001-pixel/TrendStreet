"use client";

import React from "react";
import { useStore } from "@/context/StoreContext";
import { CinematicHero } from "@/components/premium/CinematicHero";
import { SilhouetteAccordion } from "@/components/premium/SilhouetteAccordion";
import { ScrollProductReel } from "@/components/premium/ScrollProductReel";
import { VelocityMarquee } from "@/components/premium/VelocityMarquee";
import { TrustStrip } from "@/components/premium/TrustStrip";
import { HangingRail } from "@/components/premium/HangingRail";
import { ProductShowcase } from "@/components/ProductShowcase";
import { VideoReviewsReel } from "@/components/VideoReviews";

export default function HomePage() {
  const { siteSettings, videoReviews } = useStore();

  return (
    <div className="space-y-14 bg-bone pb-16 text-stone-900 sm:space-y-24 sm:pb-24 md:space-y-28">
      {siteSettings?.storefrontSections?.hero !== false && <CinematicHero />}

      <div className="!mt-0">
        <VelocityMarquee phrases={siteSettings.marqueePhrases} />
      </div>

      {siteSettings?.storefrontSections?.trustStrip !== false && <TrustStrip />}

      {/* Products first: what's new and what sells */}
      {siteSettings?.storefrontSections?.dropList !== false && <ProductShowcase />}

      {/* Customer video reviews (Admin → Reviews, marked Homepage). Renders nothing until there are some. */}
      {siteSettings?.storefrontSections?.videoReviews !== false && <VideoReviewsReel reviews={videoReviews} />}

      {siteSettings?.storefrontSections?.silhouetteAccordion !== false && <SilhouetteAccordion />}

      {siteSettings?.storefrontSections?.hangingRail !== false && <HangingRail />}

      {siteSettings?.storefrontSections?.runwayReel !== false && <ScrollProductReel />}
    </div>
  );
}
