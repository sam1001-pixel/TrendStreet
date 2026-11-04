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
        className="group relative block overflow-hidden rounded-3xl bg-burgundy text-ivory ring-1 ring-black/5 transition-transform duration-300 active:scale-[0.99]"
      >
        {/* Product collage on the right (desktop) / faded behind the text (phones) */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-[58%] gap-2 p-2 opacity-35 sm:w-1/2 sm:opacity-100" aria-hidden>
          {collage.map((p, i) => (
            <div key={p.id} className={`relative flex-1 overflow-hidden rounded-2xl ${i === 1 ? "translate-y-6" : "-translate-y-3"}`}>
              <Image src={p.images[0]} alt="" fill sizes="(max-width: 640px) 20vw, 16vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-burgundy via-burgundy/40 to-transparent" />
        </div>

        <div className="relative z-10 max-w-[78%] p-5 sm:max-w-[52%] sm:p-10 lg:p-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold-light">{flat ? banner.eyebrow : "Prices that make sense"}</p>
          <h2 id="flat-price-heading" className="mt-2 font-display font-black uppercase leading-[0.82]">
            <span className="block text-[2rem] sm:text-5xl">{flat ? banner.headline : "Starting at"}</span>
            <span className="block text-[4.75rem] text-gold sm:text-[8rem] lg:text-[10rem]">{formatPrice(min)}</span>
          </h2>
          {mrp > 0 && (
            <p className="mt-1 text-sm text-ivory/70">
              MRP <span className="line-through">{formatPrice(mrp)}</span>{" "}
              <span className="font-bold text-ivory">· save {Math.round(((mrp - min) / mrp) * 100)}%</span>
            </p>
          )}
          <ul className="mt-4 space-y-1.5 text-xs text-ivory/80 sm:text-sm">
            {banner.note1 && (
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 flex-shrink-0 text-gold" /> {fillText(banner.note1, config)}
              </li>
            )}
            {banner.note2 && (
              <li className="flex items-center gap-2">
                <Wallet className="h-4 w-4 flex-shrink-0 text-gold" /> {fillText(banner.note2, config)}
              </li>
            )}
          </ul>
          <span className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-white px-5 text-xs font-bold uppercase tracking-[0.14em] text-espresso transition-colors group-hover:bg-gold group-hover:text-white sm:px-7">
            {fillText(banner.cta, config, { count: live.length })} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </section>
  );
}
