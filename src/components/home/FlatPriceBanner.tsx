"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck, Wallet } from "lucide-react";
import { useStore, useStoreConfig } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";
import { fillText } from "@/lib/store-config";

/**
 * The price is the hook: one bold "Everything ₹499" block that sends people into the full catalogue.
 * Reads the live catalogue, so if prices ever stop being flat it says "From ₹X" instead.
 * Scaled and streamlined for mobile screens.
 */
export function FlatPriceBanner() {
  const { products } = useStore();
  const config = useStoreConfig();
  const banner = config.priceBanner;
  const live = products.filter((p) => p.inStock);
  if (!live.length) return null;

  const prices = live.map((p) => p.price);
  const min = Math.min(...prices);
  const flat = prices.every((p) => p === min);
  const mrps = live.map((p) => p.originalPrice ?? 0).filter((m) => m > min);
  const mrp = config.pricing.showMrp && flat && mrps.length === live.length && mrps.every((m) => m === mrps[0]) ? mrps[0] : 0;
  const collage = live.filter((p) => p.images[0]).slice(0, 3);

  return (
    <section className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8" aria-labelledby="flat-price-heading">
      <Link
        href="/shop"
        className="group relative block overflow-hidden rounded-2xl sm:rounded-3xl bg-espresso text-ivory ring-1 ring-black/10 transition-transform duration-300 active:scale-[0.99]"
      >
        {/* Product collage on the right (faded smoothly on phones, rich on desktop) */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-[40%] sm:w-1/2 gap-1.5 sm:gap-2 p-1.5 sm:p-2 opacity-25 sm:opacity-90 overflow-hidden" aria-hidden>
          {collage.map((p, i) => (
            <div
              key={p.id}
              className={`relative flex-1 overflow-hidden rounded-xl sm:rounded-2xl ${
                i === 1 ? "translate-y-3 sm:translate-y-6" : "-translate-y-2 sm:-translate-y-3"
              } ${i > 1 ? "hidden sm:block" : ""}`}
            >
              <Image
                src={p.images[0]}
                alt=""
                fill
                sizes="(max-width: 640px) 25vw, 16vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-espresso via-espresso/70 to-transparent" />
        </div>

        {/* Content container - compact, premium sizing for mobile */}
        <div className="relative z-10 max-w-[85%] sm:max-w-[55%] p-4 sm:p-8 lg:p-12">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-crimson">
            {flat ? banner.eyebrow : "Prices that make sense"}
          </p>

          <div className="mt-1.5 sm:mt-3 flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <h2 id="flat-price-heading" className="font-display font-black uppercase text-xl sm:text-3xl text-ivory tracking-tight">
              {flat ? banner.headline : "Starting at"}
            </h2>
            <span className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-crimson leading-none">
              {formatPrice(min)}
            </span>
          </div>

          {mrp > 0 && (
            <p className="mt-1 text-xs text-ivory/70">
              MRP <span className="line-through">{formatPrice(mrp)}</span>{" "}
              <span className="font-bold text-ivory">· save {Math.round(((mrp - min) / mrp) * 100)}%</span>
            </p>
          )}

          {/* Compact Delivery / Service Notes */}
          {(banner.note1 || banner.note2) && (
            <div className="mt-2.5 sm:mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-ivory/75">
              {banner.note1 && (
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 flex-shrink-0 text-crimson" />
                  <span>{fillText(banner.note1, config)}</span>
                </span>
              )}
              {banner.note1 && banner.note2 && (
                <span className="hidden sm:inline text-ivory/30">•</span>
              )}
              {banner.note2 && (
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 flex-shrink-0 text-crimson" />
                  <span>{fillText(banner.note2, config)}</span>
                </span>
              )}
            </div>
          )}

          {/* Compact CTA Pill Button */}
          <div className="mt-3.5 sm:mt-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 sm:px-6 sm:py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-espresso transition-all group-hover:bg-crimson group-hover:text-white shadow-xs">
              <span>{fillText(banner.cta, config, { count: live.length })}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
