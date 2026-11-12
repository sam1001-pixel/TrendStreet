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
import { CategoryStories } from "@/components/home/CategoryStories";
import { FlatPriceBanner } from "@/components/home/FlatPriceBanner";
import { CategoryRails } from "@/components/home/CategoryRails";
import { RecentlyViewed } from "@/components/home/RecentlyViewed";
import { NextDropCountdown } from "@/components/home/NextDropCountdown";

/**
 * Homepage, ordered for phones: get to products fast (category shortcuts → product grid),
 * then the price hook, then the full range by fit, then brand story and social proof.
 * Every section can be switched off in Admin → Settings → Storefront sections.
 */
export default function HomePage() {
  const { siteSettings, videoReviews } = useStore();
  const on = (key: keyof NonNullable<typeof siteSettings.storefrontSections>) => siteSettings?.storefrontSections?.[key] !== false;

  return (
    <div className="space-y-12 bg-bone pb-16 text-stone-900 sm:space-y-24 sm:pb-24 md:space-y-28">
      {on("hero") && <CinematicHero />}

      <div className="!mt-0">
        <VelocityMarquee phrases={siteSettings.marqueePhrases} />
      </div>

      {on("categoryStories") && (
        <div className="!mt-5 sm:!mt-10">
          <CategoryStories />
        </div>
      )}

      {/* Countdown to the next drop — only when a date is set in Admin → Settings → Next drop */}
      {on("nextDrop") && <NextDropCountdown />}

      {/* Products first: what's new and what sells */}
      {on("dropList") && <ProductShowcase />}

      {on("trustStrip") && <TrustStrip />}

      {on("priceBanner") && <FlatPriceBanner />}

      {on("categoryRails") && <CategoryRails />}

      {on("recentlyViewed") && <RecentlyViewed />}

      {/* Customer video reviews (Admin → Reviews, marked Homepage). Renders nothing until there are some. */}
      {on("videoReviews") && <VideoReviewsReel reviews={videoReviews} />}

      {on("silhouetteAccordion") && <SilhouetteAccordion />}

      {on("hangingRail") && <HangingRail />}

      {on("runwayReel") && <ScrollProductReel />}
    </div>
  );
}
