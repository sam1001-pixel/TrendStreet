import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { TrackOrder } from "@/components/TrackOrder";

export const metadata: Metadata = {
  title: "Track Your Order | Trend Street",
  description: "Track a Trend Street order with your order number. See dispatch, courier and delivery status for Blue Dart and Delhivery shipments.",
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-6 sm:space-y-10 sm:px-6 sm:pb-24 sm:pt-12 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-espresso/60">
        <Link href="/" className="hover:text-burgundy">Home</Link> <span aria-hidden>/</span>{" "}
        <span className="font-semibold text-espresso">Track order</span>
      </nav>
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">Delivery status</p>
        <h1 className="mt-1 font-display text-5xl font-black uppercase leading-[0.85] text-espresso sm:text-7xl">Track order</h1>
        <p className="mt-3 max-w-md text-sm text-espresso/70">Orders leave our Mumbai atelier within 24 hours and arrive in 2–5 days across India.</p>
      </header>
      <Suspense fallback={<div className="h-80 animate-pulse rounded-3xl bg-ivory-dark" />}>
        <TrackOrder />
      </Suspense>
    </div>
  );
}
