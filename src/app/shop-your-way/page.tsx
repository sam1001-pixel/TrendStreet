import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ShopYourWayFinder } from "@/components/ShopYourWayFinder";

export const metadata: Metadata = {
  title: "Shop Your Way | By Budget & Occasion — Trend Street",
  description: "Find Trend Street pieces by budget, occasion and silhouette — from under ₹2,000 tees to festive bandhgala bombers.",
  alternates: { canonical: "/shop-your-way" },
};

export default function ShopYourWayPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-12 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-espresso/60">
        <Link href="/" className="hover:text-burgundy">Home</Link> <span aria-hidden>/</span>{" "}
        <span className="font-semibold text-espresso">Shop Your Way</span>
      </nav>
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">The finder</p>
        <h1 className="mt-1 font-display text-5xl font-black uppercase leading-[0.85] text-espresso sm:text-7xl">Shop your way</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-espresso/70">
          Tell us what it&apos;s for and what you want to spend. Pick any combination — results update as you tap.
        </p>
      </header>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-ivory-dark" />}>
        <ShopYourWayFinder />
      </Suspense>
    </div>
  );
}
