"use client";

import { useStore } from "@/context/StoreContext";
import { CATEGORY_LINKS } from "@/lib/categories";
import { ProductRail } from "./ProductRail";

/** One swipeable row per silhouette, so the homepage shows the whole range, not just a handful. */
export function CategoryRails() {
  const { products } = useStore();

  const rails = CATEGORY_LINKS.map(({ category, href, blurb }) => ({
    category,
    href,
    blurb,
    // In-stock first, then new, then best sellers.
    items: products
      .filter((p) => p.category === category)
      .sort((a, b) => Number(b.inStock) - Number(a.inStock) || Number(!!b.isNew) - Number(!!a.isNew) || Number(!!b.isBestSeller) - Number(!!a.isBestSeller))
      .slice(0, 10),
  })).filter((r) => r.items.length > 0);

  if (!rails.length) return null;

  return (
    <section className="mx-auto max-w-[1600px] space-y-9 px-3 sm:space-y-14 sm:px-6 lg:px-8" aria-labelledby="shop-by-fit-heading">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-crimson">Swipe the range</p>
        <h2 id="shop-by-fit-heading" className="mt-1 font-display text-[2.5rem] font-black uppercase leading-[0.85] text-espresso sm:text-6xl">
          Shop by fit
        </h2>
      </div>
      {rails.map((r) => (
        <ProductRail
          key={r.category}
          id={`rail-${r.category.toLowerCase().replace(/\s+/g, "-")}`}
          eyebrow={`${r.blurb} · ${r.items.length} styles`}
          title={r.category}
          products={r.items}
          href={r.href}
          hrefLabel="See all"
        />
      ))}
    </section>
  );
}
