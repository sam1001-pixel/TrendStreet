"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { CinematicHero } from "@/components/premium/CinematicHero";
import { SilhouetteAccordion } from "@/components/premium/SilhouetteAccordion";
import { ScrollProductReel } from "@/components/premium/ScrollProductReel";
import { VelocityMarquee } from "@/components/premium/VelocityMarquee";
import { TrustStrip } from "@/components/premium/TrustStrip";
import { HangingRail } from "@/components/premium/HangingRail";
import { ProductShowcase } from "@/components/ProductShowcase";
import { CustomerReviewGallery } from "@/components/CustomerReviewGallery";
import { OffcultAssistDrawer } from "@/components/OffcultAssistDrawer";

export default function HomePage() {
  const { siteSettings } = useStore();
  const router = useRouter();

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

      {siteSettings?.storefrontSections?.runwayReel !== false && <ScrollProductReel />}

      {/* Sample testimonials: off unless switched on in Admin → Content, once they're real. */}
      {siteSettings?.storefrontSections?.reviewGallery === true && <CustomerReviewGallery />}

      {/* Order tracking goes to the real lookup on /track (the old "live" modal showed fixed sample milestones). */}
      <OffcultAssistDrawer onOpenTracker={() => router.push("/track")} />
    </div>
  );
}
