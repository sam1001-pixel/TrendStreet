"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Check, SlidersHorizontal, X } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";
import { CURATED_LOOKS } from "@/data/looks";
import type { ProductCategory } from "@/types/store";

export interface CategoryConfig {
  category: ProductCategory;
  eyebrow: string;
  titleTop: string;
  titleAccent: string;
  fallbackTagline: string;
  heroImage: string;
  checks: string[];
  specs: { value: string; title: string; line: string }[];
  fitTip: string;
  clothesFirst?: boolean;
}

const ALL: { name: ProductCategory; href: string; image: string }[] = [
  { name: "Oversized", href: "/oversized", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600&auto=format&fit=crop" },
  { name: "Boxy Fit", href: "/boxy-fit", image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=600&auto=format&fit=crop" },
  { name: "Jackets", href: "/jackets", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop" },
];

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "new", label: "Newest" },
  { id: "low", label: "Price: low–high" },
  { id: "high", label: "Price: high–low" },
  { id: "rating", label: "Top rated" },
];

/** Shared layout for silhouette landing pages with clothes-first priority. */
export function CategoryLanding({ config }: { config: CategoryConfig }) {
  const { products, siteSettings } = useStore();
  const [sort, setSort] = useState("featured");
  const [size, setSize] = useState<string | null>(null);
  const [inStock, setInStock] = useState(false);

  // Default clothesFirst to true for Oversized and Boxy Fit
  const showClothesFirst = config.clothesFirst ?? (config.category === "Oversized" || config.category === "Boxy Fit");

  const inCategory = useMemo(() => products.filter((p) => p.category === config.category), [products, config.category]);
  const sizes = useMemo(() => {
    const set = new Set<string>();
    inCategory.forEach((p) => p.sizes.forEach((s) => set.add(s)));
    const order = ["XS", "S", "M", "L", "XL", "XXL"];
    return Array.from(set).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia > -1 && ib > -1) return ia - ib;
      return parseInt(a) - parseInt(b);
    });
  }, [inCategory]);

  const shown = useMemo(() => {
    const list = inCategory.filter((p) => (!size || p.sizes.includes(size)) && (!inStock || p.inStock));
    return [...list].sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "new") return Number(!!b.isNew) - Number(!!a.isNew);
      return Number(!!b.featured) - Number(!!a.featured) || Number(!!b.isBestSeller) - Number(!!a.isBestSeller);
    });
  }, [inCategory, size, inStock, sort]);

  const prices = inCategory.map((p) => p.price);
  const from = prices.length ? Math.min(...prices) : 0;
  const looks = CURATED_LOOKS.filter((l) => l.pieces.some((pc) => inCategory.some((p) => p.id === pc.productId))).slice(0, 3);
  const tagline = siteSettings?.categoryTaglines?.[config.category] || config.fallbackTagline;

  // Catalogue Component (Clothes Grid)
  const CatalogueSection = (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="cat-grid">
      <div className="sticky top-[64px] z-20 -mx-4 mb-5 space-y-3 border-b border-burgundy/10 bg-ivory/95 px-4 py-3 backdrop-blur sm:top-[76px] sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="cat-grid" className="font-serif text-lg font-bold text-espresso sm:text-xl">
            {shown.length} {config.category}
          </h2>
          <label className="flex items-center gap-1.5 text-xs">
            <SlidersHorizontal className="h-4 w-4 text-espresso/50" />
            <span className="sr-only">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="min-h-[36px] rounded-lg border border-burgundy/20 bg-white px-2 text-xs font-semibold text-espresso focus:border-burgundy focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <span className="mr-1 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-espresso/50">Size</span>
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(size === s ? null : s)}
              aria-pressed={size === s}
              className={`h-9 min-w-[40px] flex-shrink-0 rounded-full px-3 font-mono text-xs font-bold transition-colors ${
                size === s ? "bg-burgundy text-gold" : "bg-white text-espresso ring-1 ring-burgundy/15"
              }`}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => setInStock(!inStock)}
            aria-pressed={inStock}
            className={`ml-1 h-9 flex-shrink-0 whitespace-nowrap rounded-full px-3 text-xs font-bold transition-colors ${
              inStock ? "bg-espresso text-ivory" : "bg-white text-espresso/70 ring-1 ring-burgundy/15"
            }`}
          >
            In stock
          </button>
          {(size || inStock) && (
            <button
              onClick={() => { setSize(null); setInStock(false); }}
              className="ml-1 inline-flex h-9 flex-shrink-0 items-center gap-1 px-2 text-xs font-semibold text-crimson"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {shown.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-4">
          {shown.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-burgundy/10">
          <p className="font-serif text-lg font-bold text-espresso">No {config.category.toLowerCase()} in that size right now</p>
          <button onClick={() => { setSize(null); setInStock(false); }} className="mt-3 text-sm font-semibold text-burgundy underline">
            Show all sizes
          </button>
        </div>
      )}

      <p className="mt-6 rounded-2xl bg-ivory-dark/60 p-4 text-xs leading-relaxed text-espresso/80">
        <strong className="text-espresso">Fit tip:</strong> {config.fitTip}{" "}
        <Link href="/profile?tab=fit" className="font-semibold text-burgundy underline">Save your sizes</Link>
      </p>
    </section>
  );

  // Editorial Hero Component
  const HeroSection = (
    <section className="relative overflow-hidden bg-espresso text-ivory">
      <Image src={config.heroImage} alt="" fill priority sizes="100vw" className="object-cover opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-r from-espresso via-espresso/70 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-5 text-xs text-ivory/60">
          <Link href="/" className="hover:text-gold">Home</Link> / <Link href="/shop" className="hover:text-gold">Shop</Link> /{" "}
          <span className="text-ivory">{config.category}</span>
        </nav>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold">{config.eyebrow}</p>
        {showClothesFirst ? (
          <h2 className="mt-2 font-display text-5xl font-black uppercase leading-[0.85] sm:text-7xl lg:text-8xl">
            {config.titleTop}
            <br />
            <span className="text-gold">{config.titleAccent}</span>
          </h2>
        ) : (
          <h1 className="mt-2 font-display text-5xl font-black uppercase leading-[0.85] sm:text-7xl lg:text-8xl">
            {config.titleTop}
            <br />
            <span className="text-gold">{config.titleAccent}</span>
          </h1>
        )}
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ivory/80 sm:text-base">{tagline}</p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {config.checks.map((c) => (
            <li key={c} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-ivory backdrop-blur">
              <Check className="h-3.5 w-3.5 text-gold" /> {c}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center gap-4 text-xs text-ivory/70">
          <span>
            <strong className="text-base text-ivory">{inCategory.length}</strong> pieces
          </span>
          <span className="h-4 w-px bg-white/20" />
          <span>
            from <strong className="text-base text-ivory">₹{from.toLocaleString("en-IN")}</strong>
          </span>
        </div>
      </div>
    </section>
  );

  // Specs Component
  const SpecsSection = (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label={`What makes our ${config.category}`}>
      <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:px-0">
        {config.specs.map((s, i) => (
          <li
            key={s.title}
            className={`w-[78%] flex-shrink-0 snap-start rounded-3xl p-5 sm:w-auto sm:p-6 ${
              i === 1 ? "bg-burgundy text-ivory" : "bg-white text-espresso ring-1 ring-burgundy/10"
            }`}
          >
            <p className={`font-display text-3xl font-black uppercase leading-none sm:text-4xl ${i === 1 ? "text-gold" : "text-burgundy"}`}>
              {s.value}
            </p>
            <h3 className="mt-3 font-serif text-base font-bold">{s.title}</h3>
            <p className={`mt-1 text-xs leading-relaxed ${i === 1 ? "text-ivory/75" : "text-espresso/70"}`}>
              {s.line}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="space-y-10 pb-16 sm:space-y-16 sm:pb-24">
      {showClothesFirst ? (
        <>
          {/* Top Quick Breadcrumb & Title */}
          <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
            <nav aria-label="Breadcrumb" className="mb-2 text-xs text-espresso/60">
              <Link href="/" className="hover:text-burgundy">Home</Link> / <Link href="/shop" className="hover:text-burgundy">Shop</Link> /{" "}
              <span className="font-semibold text-espresso">{config.category}</span>
            </nav>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-burgundy/10">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">{config.eyebrow}</p>
                <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-tight text-espresso sm:text-5xl">
                  {config.category} Collection
                </h1>
              </div>
              <div className="flex items-center gap-3 text-xs text-espresso/70">
                <span><strong className="text-sm font-bold text-espresso">{inCategory.length}</strong> styles available</span>
                <span className="h-3 w-px bg-burgundy/20" />
                <span>from <strong className="text-sm font-bold text-burgundy">₹{from.toLocaleString("en-IN")}</strong></span>
              </div>
            </div>
          </div>

          {/* Clothes Grid First */}
          {CatalogueSection}

          {/* Editorial Architecture Narrative Follows */}
          <div className="mt-12 sm:mt-16">
            {HeroSection}
          </div>

          {/* Specs */}
          {SpecsSection}
        </>
      ) : (
        <>
          {HeroSection}
          {SpecsSection}
          {CatalogueSection}
        </>
      )}

      {/* Styled looks with this category */}
      {looks.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="looks-h">
          <div className="mb-4 flex items-end justify-between">
            <h2 id="looks-h" className="font-display text-3xl font-black uppercase leading-none text-espresso sm:text-5xl">
              Wear it with
            </h2>
            <Link
              href="/complete-the-fit"
              className="inline-flex min-h-[40px] items-center gap-1 text-xs font-bold uppercase tracking-wider text-burgundy"
            >
              All looks <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
            {looks.map((l) => (
              <li key={l.id} className="w-[70%] flex-shrink-0 snap-start sm:w-auto">
                <Link href={`/complete-the-fit?look=${l.id}`} className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-espresso">
                  <Image
                    src={l.image}
                    alt=""
                    fill
                    sizes="(max-width:640px) 70vw, 33vw"
                    className="object-cover opacity-85 transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-espresso via-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-4 text-ivory">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold">{l.occasion} · {l.pieces.length} pieces</span>
                    <span className="mt-0.5 block font-serif text-xl font-bold">{l.name}</span>
                    <span className="mt-1 block text-[11px] text-ivory/70">{l.vibe}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Other silhouettes (without Jeans) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="other-h">
        <h2 id="other-h" className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-espresso/60">
          Other silhouettes
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:gap-5">
          {ALL.filter((c) => c.name !== config.category).map((c) => (
            <li key={c.name}>
              <Link
                href={c.href}
                className="group relative block aspect-[4/3] sm:aspect-[16/9] overflow-hidden rounded-2xl bg-espresso"
              >
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="50vw"
                  className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/30 to-transparent" />
                <span className="absolute inset-x-4 bottom-4 flex items-center justify-between font-display text-xl font-black uppercase text-ivory sm:text-3xl">
                  {c.name} <ArrowUpRight className="h-5 w-5 flex-shrink-0 text-gold transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
