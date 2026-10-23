"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal, Sparkles } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";
import { BUDGETS, OCCASIONS } from "@/data/looks";
import { matchesOccasion } from "@/components/premium/ShopByPriceOccasion";
import type { ProductCategory } from "@/types/store";

const CATEGORIES: ProductCategory[] = ["Oversized", "Jeans", "Boxy Fit", "Jackets"];
const SORTS = [
  { id: "best", label: "Best match" },
  { id: "new", label: "Newest" },
  { id: "low", label: "Price: low to high" },
  { id: "high", label: "Price: high to low" },
] as const;

const chip = (on: boolean) =>
  `min-h-[40px] whitespace-nowrap rounded-full px-4 text-xs font-bold transition-colors ${
    on ? "bg-burgundy text-ivory" : "bg-white text-espresso/80 ring-1 ring-burgundy/15 hover:ring-burgundy/50"
  }`;

/** Budget × occasion × silhouette finder. Every choice lives in the URL so results can be shared. */
export function ShopYourWayFinder() {
  const { products } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const budget = params.get("budget");
  const occasion = params.get("occasion");
  const category = params.get("category");
  const sort = params.get("sort") ?? "best";

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null || next.get(key) === value) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const b = BUDGETS.find((x) => x.id === budget);
  const o = OCCASIONS.find((x) => x.id === occasion);

  const results = useMemo(() => {
    let list = products.filter(
      (p) =>
        (!b || (p.price >= b.min && p.price <= b.max)) &&
        (!o || matchesOccasion(p, o)) &&
        (!category || p.category === category)
    );
    list = [...list].sort((x, y) => {
      if (sort === "low") return x.price - y.price;
      if (sort === "high") return y.price - x.price;
      if (sort === "new") return Number(!!y.isNew) - Number(!!x.isNew);
      return Number(!!y.isBestSeller) - Number(!!x.isBestSeller) || y.rating - x.rating;
    });
    return list;
  }, [products, b, o, category, sort]);

  const active = [b && { k: "budget", l: b.label }, o && { k: "occasion", l: o.title }, category && { k: "category", l: category }].filter(Boolean) as { k: string; l: string }[];

  return (
    <div className="space-y-8">
      {/* Occasion cards */}
      <section aria-labelledby="occ-h">
        <h2 id="occ-h" className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-espresso/60">1 · What&apos;s it for?</h2>
        <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
          {OCCASIONS.map((x) => {
            const on = occasion === x.id;
            return (
              <li key={x.id} className="w-[40%] flex-shrink-0 snap-start sm:w-auto">
                <button
                  onClick={() => set("occasion", x.id)}
                  aria-pressed={on}
                  className={`group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-espresso text-left transition-all ${on ? "ring-2 ring-gold ring-offset-2 ring-offset-bone" : ""}`}
                >
                  <Image src={x.image} alt="" fill sizes="(max-width:640px) 40vw, 16vw" className={`object-cover transition-all duration-500 group-hover:scale-105 ${on ? "opacity-90" : "opacity-60"}`} />
                  <span className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-transparent" />
                  {on && <Sparkles className="absolute right-2 top-2 h-5 w-5 text-gold" />}
                  <span className="absolute inset-x-2 bottom-2 text-ivory">
                    <span className="block font-serif text-base font-bold leading-tight">{x.title}</span>
                    <span className="hidden text-[11px] text-ivory/75 sm:block">{x.line}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Budget + silhouette */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-espresso/60">2 · Your budget</h2>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {BUDGETS.map((x) => (
              <button key={x.id} onClick={() => set("budget", x.id)} aria-pressed={budget === x.id} className={chip(budget === x.id)}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-espresso/60">3 · Silhouette</h2>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => set("category", c)} aria-pressed={category === c} className={chip(category === c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section aria-live="polite" aria-labelledby="res-h">
        <div className="sticky top-[64px] z-20 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-y border-burgundy/10 bg-ivory/95 px-4 py-3 backdrop-blur sm:top-[76px] sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 id="res-h" className="text-sm font-bold text-espresso">
              {results.length} {results.length === 1 ? "piece" : "pieces"}
            </h2>
            {active.map((a) => (
              <button key={a.k} onClick={() => set(a.k, null)} className="inline-flex items-center gap-1 rounded-full bg-burgundy/10 px-2.5 py-1 text-[11px] font-semibold text-burgundy hover:bg-burgundy/20">
                {a.l} <X className="h-3 w-3" aria-label={`Remove ${a.l}`} />
              </button>
            ))}
            {active.length > 1 && (
              <button onClick={() => router.replace(pathname, { scroll: false })} className="text-[11px] font-semibold text-crimson underline">
                Clear all
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 text-xs">
            <SlidersHorizontal className="h-4 w-4 text-espresso/50" />
            <span className="sr-only">Sort</span>
            <select
              value={sort}
              onChange={(e) => set("sort", e.target.value === "best" ? null : e.target.value)}
              className="min-h-[36px] rounded-lg border border-burgundy/20 bg-white px-2 text-xs font-semibold text-espresso focus:border-burgundy focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {results.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {results.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-burgundy/10">
            <p className="font-serif text-xl font-bold text-espresso">Nothing matches all three yet</p>
            <p className="mt-1 text-sm text-espresso/60">Try a wider budget, or drop one filter.</p>
            <button onClick={() => router.replace(pathname, { scroll: false })} className="mt-4 rounded-full bg-burgundy px-6 py-3 text-xs font-bold uppercase tracking-wider text-ivory hover:bg-crimson">
              Reset filters
            </button>
          </div>
        )}
      </section>

      <Link href="/complete-the-fit" className="group flex flex-col items-start justify-between gap-3 rounded-3xl bg-burgundy p-6 text-ivory sm:flex-row sm:items-center sm:p-8">
        <span>
          <span className="block font-display text-3xl font-black uppercase leading-none sm:text-4xl">Not sure what goes together?</span>
          <span className="mt-1 block text-sm text-ivory/75">Shop a styled look and save 15% on two or more pieces.</span>
        </span>
        <span className="inline-flex min-h-[44px] items-center rounded-full bg-gold px-6 text-xs font-bold uppercase tracking-wider text-espresso">Complete the fit →</span>
      </Link>
    </div>
  );
}
