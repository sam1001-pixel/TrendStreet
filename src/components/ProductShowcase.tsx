"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/types/store";

type Tab = { id: string; label: string; href: string; pick: (all: Product[]) => Product[] };

const TABS: Tab[] = [
  { id: "new", label: "New in", href: "/shop?sort=newest", pick: (a) => a.filter((p) => p.isNew) },
  { id: "best", label: "Best sellers", href: "/shop", pick: (a) => a.filter((p) => p.isBestSeller) },
  { id: "value", label: "Under ₹2,999", href: "/shop-your-way?budget=u2k", pick: (a) => a.filter((p) => p.price < 3000).sort((x, y) => x.price - y.price) },
  { id: "Oversized", label: "Oversized", href: "/oversized", pick: (a) => a.filter((p) => p.category === "Oversized") },
  { id: "Jeans", label: "Jeans", href: "/jeans", pick: (a) => a.filter((p) => p.category === "Jeans") },
  { id: "Boxy Fit", label: "Boxy Fit", href: "/boxy-fit", pick: (a) => a.filter((p) => p.category === "Boxy Fit") },
  { id: "Jackets", label: "Jackets", href: "/jackets", pick: (a) => a.filter((p) => p.category === "Jackets") },
];

/**
 * One product module for the homepage: tabs across the top, a swipeable rail on phones
 * and a 4-up grid on desktop, ending in a "view all" tile.
 */
export function ProductShowcase() {
  const { products } = useStore();
  const [tabId, setTabId] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === tabId) ?? TABS[0];
  const items = useMemo(() => tab.pick(products).filter((p) => p.inStock).slice(0, 8), [tab, products]);

  return (
    <section className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8" aria-labelledby="showcase-heading">
      <div className="mb-4 flex items-end justify-between gap-4 sm:mb-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">This week</p>
          <h2 id="showcase-heading" className="mt-1 font-display text-4xl font-black uppercase leading-[0.85] text-espresso sm:text-6xl">
            The drop list
          </h2>
        </div>
        <Link href={tab.href} className="hidden min-h-[44px] items-center gap-1 text-xs font-bold uppercase tracking-wider text-burgundy hover:text-crimson sm:inline-flex">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div role="tablist" aria-label="Product groups" className="no-scrollbar -mx-3 mb-5 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        {TABS.map((t) => {
          const count = t.pick(products).filter((p) => p.inStock).length;
          if (!count) return null;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === tabId}
              onClick={() => setTabId(t.id)}
              className={`inline-flex min-h-[40px] flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs font-bold transition-colors ${
                t.id === tabId ? "bg-espresso text-ivory" : "bg-white text-espresso/70 ring-1 ring-burgundy/15 hover:text-espresso"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 text-[10px] ${t.id === tabId ? "bg-white/15" : "bg-ivory-dark"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <ul
        key={tab.id}
        className="no-scrollbar -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4"
      >
        {items.map((p, i) => (
          <li key={p.id} className="w-[46%] flex-shrink-0 snap-start sm:w-auto">
            <ProductCard product={p} priority={i < 2} compact />
          </li>
        ))}
        <li className="w-[46%] flex-shrink-0 snap-start sm:hidden">
          <Link href={tab.href} className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-2xl bg-burgundy p-4 text-center text-ivory">
            <ArrowUpRight className="h-8 w-8 text-gold" />
            <span className="font-display text-2xl font-black uppercase leading-none">View all</span>
            <span className="text-[11px] text-ivory/70">{tab.label}</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
