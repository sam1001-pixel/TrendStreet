"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Wallet, CalendarHeart } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { BUDGETS, OCCASIONS, type Occasion } from "@/data/looks";
import type { Product } from "@/types/store";

export const matchesOccasion = (p: Product, o: Occasion) => p.tags.some((t) => o.tags.includes(t.toLowerCase()));

/** Home teaser for /shop-your-way: two ways in — by budget or by occasion. Counts come from the live catalog. */
export function ShopByPriceOccasion() {
  const { products } = useStore();
  const [mode, setMode] = useState<"budget" | "occasion">("budget");

  return (
    <section className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8" aria-labelledby="shop-by-heading">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">Find it faster</p>
          <h2 id="shop-by-heading" className="mt-1 font-display text-4xl font-black uppercase leading-[0.85] text-espresso sm:text-6xl lg:text-7xl">
            Shop your way
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div role="tablist" aria-label="Shop by" className="inline-flex rounded-full bg-white p-1 ring-1 ring-burgundy/15">
            {([
              ["budget", "Budget", Wallet],
              ["occasion", "Occasion", CalendarHeart],
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-4 text-xs font-bold uppercase tracking-wider transition-colors ${
                  mode === id ? "bg-burgundy text-ivory" : "text-espresso/70 hover:text-espresso"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
          <Link href="/shop-your-way" className="hidden min-h-[40px] items-center gap-1 text-xs font-bold uppercase tracking-wider text-burgundy hover:text-crimson sm:inline-flex">
            See all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {mode === "budget" ? (
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {BUDGETS.map((b, i) => {
            const inBand = products.filter((p) => p.price >= b.min && p.price <= b.max);
            const thumbs = inBand.slice(0, 3);
            return (
              <li key={b.id}>
                <Link
                  href={`/shop-your-way?budget=${b.id}`}
                  className={`group flex h-full flex-col justify-between gap-6 rounded-3xl p-4 transition-transform duration-300 hover:-translate-y-1 sm:p-6 ${
                    i === 3 ? "bg-espresso text-ivory" : i % 2 ? "bg-burgundy text-ivory" : "bg-white text-espresso ring-1 ring-burgundy/10"
                  }`}
                >
                  <span className="flex -space-x-3">
                    {thumbs.map((p) => (
                      <span key={p.id} className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-current sm:h-14 sm:w-14">
                        <Image src={p.images[0]} alt="" fill sizes="56px" className="object-cover" />
                      </span>
                    ))}
                  </span>
                  <span>
                    <span className="block font-display text-3xl font-black uppercase leading-none sm:text-5xl">{b.short}</span>
                    <span className="mt-2 flex items-center justify-between text-xs opacity-75">
                      {inBand.length} {inBand.length === 1 ? "piece" : "pieces"}
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="no-scrollbar -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
          {OCCASIONS.map((o) => {
            const count = products.filter((p) => matchesOccasion(p, o)).length;
            return (
              <li key={o.id} className="w-[46%] flex-shrink-0 snap-start sm:w-auto">
                <Link href={`/shop-your-way?occasion=${o.id}`} className="group relative block aspect-[3/4] overflow-hidden rounded-3xl bg-espresso">
                  <Image src={o.image} alt="" fill sizes="(max-width:640px) 46vw, 16vw" className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/30 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-3 text-ivory sm:p-4">
                    <span className="block font-serif text-lg font-bold leading-tight sm:text-xl">{o.title}</span>
                    <span className="mt-0.5 block text-[11px] text-ivory/75">{o.line}</span>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase text-espresso">
                      {count} pieces <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/shop-your-way" className="mt-4 flex min-h-[44px] items-center justify-center gap-1 rounded-full border border-burgundy/20 text-xs font-bold uppercase tracking-wider text-burgundy sm:hidden">
        Open the finder <ArrowUpRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
