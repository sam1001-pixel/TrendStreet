"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles, Sun, Moon, Shirt } from "lucide-react";
import { useStore } from "@/context/StoreContext";

const BANDS = [
  { label: "Under ₹1,999", href: "/shop?max=1999", test: (p: number) => p <= 1999 },
  { label: "Under ₹2,999", href: "/shop?max=2999", test: (p: number) => p <= 2999 },
  { label: "Under ₹4,999", href: "/shop?max=4999", test: (p: number) => p <= 4999 },
  { label: "Premium ₹5,000+", href: "/shop?min=5000", test: (p: number) => p >= 5000 },
];

const OCCASIONS = [
  { tag: "everyday", title: "Everyday staples", line: "Tees and denim you'll wear on repeat", icon: Shirt, tone: "bg-burgundy text-ivory" },
  { tag: "festive", title: "Festive & wedding", line: "Block prints, bandhani and bandhgala", icon: Sparkles, tone: "bg-crimson text-ivory" },
  { tag: "summer", title: "Summer heat", line: "Breathable 220–280gsm cotton", icon: Sun, tone: "bg-gold text-espresso" },
  { tag: "winter", title: "Desert winters", line: "Hoodies, chore and field jackets", icon: Moon, tone: "bg-ink text-ivory" },
];

/** Two quick ways in: by budget and by occasion. Counts come from the live catalog. */
export function ShopByPriceOccasion() {
  const { products } = useStore();

  return (
    <section className="mx-auto max-w-[1600px] space-y-10 px-3 sm:px-6 lg:px-8" aria-labelledby="shop-by-heading">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <h2 id="shop-by-heading" className="font-display text-5xl font-black uppercase leading-[0.85] text-espresso sm:text-7xl">
          Shop your way
        </h2>
        <p className="max-w-sm text-sm text-espresso/70">Pick a budget or an occasion — every piece ships free over ₹1,999.</p>
      </div>

      <div>
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-espresso/60">By budget</h3>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {BANDS.map((b) => {
            const count = products.filter((p) => b.test(p.price)).length;
            return (
              <li key={b.label} data-reveal>
                <Link
                  href={b.href}
                  className="group flex h-full items-end justify-between gap-3 rounded-2xl border border-burgundy/15 bg-ivory-light p-5 transition-colors duration-200 hover:border-burgundy hover:bg-white sm:p-6"
                >
                  <span>
                    <span className="block font-display text-3xl font-black uppercase leading-none text-burgundy sm:text-4xl">{b.label}</span>
                    <span className="mt-2 block text-xs text-espresso/60">{count} {count === 1 ? "piece" : "pieces"}</span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 flex-shrink-0 text-crimson transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-espresso/60">By occasion</h3>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {OCCASIONS.map(({ tag, title, line, icon: Icon, tone }) => {
            const count = products.filter((p) => p.tags.includes(tag)).length;
            return (
              <li key={tag} data-reveal>
                <Link href={`/shop?tag=${tag}`} className={`group relative flex h-full min-h-[170px] flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6 ${tone}`}>
                  <span aria-hidden className="jaali absolute inset-0 opacity-20" />
                  <Icon className="relative h-6 w-6 transition-transform duration-300 ease-out group-hover:-rotate-12" />
                  <span className="relative">
                    <span className="block font-serif text-2xl">{title}</span>
                    <span className="mt-1 block text-xs opacity-80">{line}</span>
                    <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider">
                      Shop {count} <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
