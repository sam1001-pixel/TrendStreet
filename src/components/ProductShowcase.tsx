"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/types/store";

type Tab = { id: string; label: string; href: string; pick: (all: Product[]) => Product[] };

const TABS: Tab[] = [
  { id: "new", label: "New in", href: "/shop?sort=newest", pick: (a) => a.filter((p) => p.isNew) },
  { id: "best", label: "Best sellers", href: "/shop", pick: (a) => a.filter((p) => p.isBestSeller) },
  { id: "trending", label: "Trending", href: "/shop", pick: (a) => a.filter((p) => p.featured) },
  { id: "Oversized", label: "Oversized", href: "/oversized", pick: (a) => a.filter((p) => p.category === "Oversized") },
  { id: "Jeans", label: "Jeans", href: "/shop?category=Jeans", pick: (a) => a.filter((p) => p.category === "Jeans") },
  { id: "Boxy Fit", label: "Boxy Fit", href: "/boxy-fit", pick: (a) => a.filter((p) => p.category === "Boxy Fit") },
  { id: "Jackets", label: "Jackets", href: "/jackets", pick: (a) => a.filter((p) => p.category === "Jackets") },
];

/**
 * One product module for the homepage: tabs across the top, a 2 × 3 grid on phones
 * (with a full-width "view all" button) and a 3–4 column grid on larger screens.
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
          <h2 id="showcase-heading" className="mt-1 font-display text-[2.5rem] font-black uppercase leading-[0.85] text-espresso sm:text-6xl">
            The drop list
          </h2>
        </div>
        <Link href={tab.href} className="hidden min-h-[44px] items-center gap-1 text-xs font-bold uppercase tracking-wider text-burgundy hover:text-crimson sm:inline-flex">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div
        role="tablist"
        aria-label="Product groups"
        className="no-scrollbar -mx-3 mb-4 flex snap-x gap-2 overflow-x-auto scroll-px-3 px-3 sm:mx-0 sm:mb-5 sm:px-0"
      >
        {TABS.map((t) => {
          const count = t.pick(products).filter((p) => p.inStock).length;
          if (!count) return null;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === tabId}
              onClick={() => setTabId(t.id)}
              className={`inline-flex min-h-[44px] flex-shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-bold transition-colors sm:px-4 ${
                t.id === tabId ? "bg-espresso text-ivory" : "bg-white text-espresso/70 ring-1 ring-burgundy/15 hover:text-espresso"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 text-[11px] ${t.id === tabId ? "bg-white/15" : "bg-ivory-dark"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Phones: a tidy 2 × 3 grid (no half-cut cards). Tablet/desktop: 3–4 columns, up to 8 pieces. */}
      <ul key={tab.id} className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14">
        {items.map((p, i) => (
          <li key={p.id} className={i >= 6 ? "hidden sm:block" : undefined}>
            <ProductCard product={p} priority={false} compact />
          </li>
        ))}
      </ul>

      <Link
        href={tab.href}
        className="mt-6 flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-burgundy/25 bg-white text-xs font-bold uppercase tracking-[0.15em] text-burgundy active:bg-ivory sm:hidden"
      >
        View all {tab.label.toLowerCase()} <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
