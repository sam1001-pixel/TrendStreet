"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  Search,
  ArrowUpDown,
  Filter,
  Check,
  RotateCcw,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";
import { ProductCategory } from "@/types/store";
import { lockScroll } from "@/lib/scroll-lock";

const ALL_CATEGORIES: ProductCategory[] = [
  "Oversized",
  "Jeans",
  "Boxy Fit",
  "Jackets",
];

const ALL_SIZES = ["S", "M", "L", "XL", "XXL", "30", "32", "34", "36", "38"];

function ShopContent() {
  const { products } = useStore();
  const searchParams = useSearchParams();

  // Search & Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSize, setSelectedSize] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  // With one store-wide price (₹499) a price slider has nothing to filter, so it is hidden.
  const hasPriceSpread = new Set(products.map((p) => p.price)).size > 1;
  const PRICE_CEILING = Math.max(1000, Math.ceil(Math.max(0, ...products.map((p) => p.price)) / 500) * 500);
  const [maxPrice, setMaxPrice] = useState<number>(Number.MAX_SAFE_INTEGER);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [tag, setTag] = useState<string>("");
  const effectiveMax = Math.min(maxPrice, PRICE_CEILING);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Read URL query parameters on mount
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setSelectedCategory(cat);

    const q = searchParams.get("search");
    if (q) setSearchQuery(q);

    // Links from the homepage price and occasion tiles
    const max = Number(searchParams.get("max"));
    if (max > 0) setMaxPrice(max);
    const min = Number(searchParams.get("min"));
    if (min > 0) setMinPrice(min);
    const s = searchParams.get("sort");
    if (s && ["featured", "price-low", "price-high", "rating", "newest"].includes(s)) setSortBy(s);
    const t = searchParams.get("tag");
    setTag(t ? t.toLowerCase().slice(0, 40) : "");
  }, [searchParams]);

  // Mobile filter drawer: lock page scroll and close on Escape
  useEffect(() => {
    if (!isMobileFilterOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsMobileFilterOpen(false);
    const unlock = lockScroll();
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [isMobileFilterOpen]);

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category filter
      if (selectedCategory !== "All" && prod.category !== selectedCategory) {
        return false;
      }

      // Size filter
      if (selectedSize !== "All" && !prod.sizes.includes(selectedSize)) {
        return false;
      }

      // Price filter
      if (prod.price > maxPrice || prod.price < minPrice) {
        return false;
      }

      // Occasion / tag filter
      if (tag && !prod.tags.some((t) => t.toLowerCase() === tag)) {
        return false;
      }

      // In-stock filter
      if (inStockOnly && !prod.inStock) {
        return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(query);
        const matchesSub = prod.subtitle.toLowerCase().includes(query);
        const matchesDesc = prod.description.toLowerCase().includes(query);
        const matchesFabric = prod.fabric.toLowerCase().includes(query);
        const matchesTags = prod.tags.some((t) => t.toLowerCase().includes(query));

        if (!matchesName && !matchesSub && !matchesDesc && !matchesFabric && !matchesTags) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "newest") return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [products, selectedCategory, selectedSize, maxPrice, minPrice, tag, inStockOnly, searchQuery, sortBy]);

  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedSize("All");
    setSearchQuery("");
    setMaxPrice(Number.MAX_SAFE_INTEGER);
    setMinPrice(0);
    setTag("");
    setInStockOnly(false);
    setSortBy("featured");
  };

  const hasActiveFilters =
    selectedCategory !== "All" ||
    selectedSize !== "All" ||
    searchQuery !== "" ||
    effectiveMax < PRICE_CEILING ||
    minPrice > 0 ||
    tag !== "" ||
    inStockOnly;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-10 space-y-4 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-burgundy/15 pb-4 sm:gap-4 sm:pb-6 md:flex-row md:items-end">
        <div>
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.2em] text-crimson sm:text-xs">
            Complete Streetwear Catalog
          </span>
          <h1 className="font-serif text-2xl font-bold text-espresso sm:text-3xl md:text-4xl">
            {selectedCategory === "All" ? "The Core Collection" : selectedCategory}
          </h1>
          <p className="mt-1 text-[11px] text-espresso/70 sm:text-xs">
            {filteredProducts.length} {filteredProducts.length === 1 ? "piece" : "pieces"}
            <span className="hidden sm:inline"> of oversized drops, selvedge denim, boxy cuts &amp; outerwear</span>
          </p>
        </div>

        {/* Desktop sort (phones use the sticky bar below) */}
        <div className="hidden items-center rounded-md border border-burgundy/20 bg-white px-3 py-1.5 shadow-xs lg:flex">
          <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-burgundy/60" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort products"
            className="cursor-pointer bg-transparent py-1 text-xs font-semibold text-espresso focus:outline-none"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">New Arrivals</option>
          </select>
        </div>
      </div>

      {/* Phones & tablets: sticky category chips + Filter / Sort bar under the header */}
      <div className="sticky top-16 sm:top-[76px] z-30 -mx-3 space-y-2 border-b border-burgundy/10 bg-ivory/95 px-3 pb-2.5 pt-2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 sm:-mx-6 sm:px-6" role="tablist" aria-label="Categories">
          {["All", ...ALL_CATEGORIES].map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = cat === "All" ? products.length : products.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex min-h-[44px] flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-bold transition-colors ${
                  isSelected ? "bg-espresso text-ivory" : "bg-white text-espresso/75 ring-1 ring-burgundy/15"
                }`}
              >
                {cat === "All" ? "All" : cat}
                <span className={`text-[11px] ${isSelected ? "text-ivory/70" : "text-espresso/60"}`}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-burgundy/20 bg-white text-xs font-bold uppercase tracking-wider text-burgundy"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {(() => {
              const n = (selectedSize !== "All" ? 1 : 0) + (searchQuery ? 1 : 0) + (effectiveMax < PRICE_CEILING || minPrice > 0 ? 1 : 0) + (tag ? 1 : 0) + (inStockOnly ? 1 : 0);
              return n > 0 ? <span className="rounded-full bg-burgundy px-1.5 text-[11px] text-gold">{n}</span> : null;
            })()}
          </button>
          <label className="relative flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-burgundy/20 bg-white text-xs font-bold uppercase tracking-wider text-burgundy">
            <ArrowUpDown className="h-4 w-4" />
            <span>
              {{ featured: "Featured", "price-low": "Price ↑", "price-high": "Price ↓", rating: "Top rated", newest: "Newest" }[sortBy] ?? "Sort"}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products"
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">New Arrivals</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-8 p-6 bg-white rounded-2xl border border-burgundy/10 shadow-xs h-fit sticky top-28">
          <div className="flex items-center justify-between pb-3 border-b border-burgundy/15">
            <span className="text-xs font-bold uppercase tracking-widest text-burgundy flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gold" /> Filter Collection
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-crimson hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-espresso uppercase tracking-wider">
              Search Keywords
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-espresso/60" />
              <input
                type="text"
                placeholder="Flannel, Cashmere, Loafer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-ivory pl-9 pr-3 py-2 text-xs rounded border border-burgundy/20 text-espresso placeholder-espresso/40 focus:outline-none focus:border-burgundy"
              />
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-espresso uppercase tracking-wider block">
              Categories
            </label>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`w-full text-left py-1.5 px-2 rounded transition-colors flex justify-between items-center ${
                  selectedCategory === "All"
                    ? "bg-burgundy text-gold font-bold"
                    : "text-espresso/80 hover:bg-ivory"
                }`}
              >
                <span>All Menswear</span>
                <span className="text-[11px] opacity-70">({products.length})</span>
              </button>

              {ALL_CATEGORIES.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left py-1.5 px-2 rounded transition-colors flex justify-between items-center ${
                      isSelected
                        ? "bg-burgundy text-gold font-bold"
                        : "text-espresso/80 hover:bg-ivory"
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="text-[11px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Slider */}
          {hasPriceSpread && (
          <div className="space-y-2.5 pt-4 border-t border-burgundy/10">
            <div className="flex justify-between items-center text-xs font-semibold text-espresso">
              <span>Max Price</span>
              <span className="text-burgundy font-bold">₹{effectiveMax.toLocaleString("en-IN")}</span>
            </div>
            <input
              type="range"
              min="500"
              max={PRICE_CEILING}
              step="250"
              value={effectiveMax}
              aria-label="Maximum price"
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-burgundy cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-espresso/60">
              <span>₹500</span>
              <span>₹{Math.round(PRICE_CEILING / 2).toLocaleString("en-IN")}</span>
              <span>₹{PRICE_CEILING.toLocaleString("en-IN")}</span>
            </div>
          </div>
          )}

          {/* Size Pills */}
          <div className="space-y-2.5 pt-4 border-t border-burgundy/10">
            <label className="text-xs font-semibold text-espresso uppercase tracking-wider block">
              Silhouette Size
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedSize("All")}
                className={`py-1 px-2.5 rounded text-xs font-semibold border transition-all ${
                  selectedSize === "All"
                    ? "bg-burgundy text-gold border-burgundy"
                    : "bg-ivory text-espresso/70 border-burgundy/15 hover:border-burgundy"
                }`}
              >
                All
              </button>
              {ALL_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-1 px-2.5 rounded text-xs font-semibold border transition-all ${
                    selectedSize === size
                      ? "bg-burgundy text-gold border-burgundy"
                      : "bg-ivory text-espresso/70 border-burgundy/15 hover:border-burgundy"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* In Stock Toggle */}
          <div className="pt-4 border-t border-burgundy/10">
            <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-medium text-espresso">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 text-burgundy rounded border-burgundy/30 focus:ring-burgundy"
              />
              <span>In Stock Only (Ready for Courier)</span>
            </label>
          </div>
        </aside>

        {/* Product Catalog Grid */}
        <main className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="p-16 bg-white rounded-2xl border border-burgundy/15 text-center space-y-4">
              <p className="font-serif text-xl font-bold text-espresso">
                No matching garments found
              </p>
              <p className="text-xs text-espresso/60 max-w-sm mx-auto">
                We could not find items matching your active filter criteria. Try resetting the filters or modifying your search terms.
              </p>
              <button
                onClick={resetFilters}
                className="py-2.5 px-6 bg-burgundy hover:bg-crimson text-ivory text-xs font-bold uppercase tracking-wider rounded transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((prod, idx) => (
                <ProductCard key={prod.id} product={prod} priority={idx < 4} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile filters: bottom sheet with thumb-sized chips */}
      {isMobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setIsMobileFilterOpen(false)}
            className="absolute inset-0 bg-espresso/60 animate-[fadeIn_0.2s_ease-out]"
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-3xl bg-ivory shadow-2xl animate-[sheetUp_0.3s_cubic-bezier(0.22,1,0.36,1)]">
            <div className="flex items-center justify-between border-b border-burgundy/15 px-5 py-3">
              <span className="font-serif text-lg font-bold text-espresso">Filters</span>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                aria-label="Close filters"
                className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-burgundy hover:bg-burgundy/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5">
              {/* Category */}
              <fieldset className="space-y-2.5">
                <legend className="text-xs font-bold uppercase tracking-wider text-burgundy">Category</legend>
                <div className="flex flex-wrap gap-2">
                  {(["All", ...ALL_CATEGORIES] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={selectedCategory === cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`min-h-[44px] rounded-full border px-4 text-xs font-semibold transition-colors ${
                        selectedCategory === cat
                          ? "border-burgundy bg-burgundy text-gold"
                          : "border-burgundy/20 bg-white text-espresso"
                      }`}
                    >
                      {cat === "All" ? "All" : cat}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Size */}
              <fieldset className="space-y-2.5">
                <legend className="text-xs font-bold uppercase tracking-wider text-burgundy">Size</legend>
                <div className="grid grid-cols-5 gap-2">
                  {["All", ...ALL_SIZES].map((size) => (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={selectedSize === size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-h-[44px] rounded-xl border text-xs font-bold transition-colors ${
                        selectedSize === size
                          ? "border-burgundy bg-burgundy text-gold"
                          : "border-burgundy/20 bg-white text-espresso"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Price */}
              {hasPriceSpread && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-burgundy">
                  <span className="uppercase tracking-wider">Max price</span>
                  <span>₹{effectiveMax.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max={PRICE_CEILING}
                  step="250"
                  value={effectiveMax}
                  aria-label="Maximum price"
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="h-8 w-full accent-burgundy"
                />
              </div>
              )}

              {/* In stock */}
              <label className="flex min-h-[48px] cursor-pointer items-center justify-between rounded-2xl border border-burgundy/15 bg-white px-4 text-sm font-medium text-espresso">
                <span>In stock only</span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="h-5 w-5 accent-burgundy"
                />
              </label>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-2 border-t border-burgundy/15 px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-[48px] rounded-full border border-burgundy/25 px-5 text-xs font-bold uppercase tracking-wider text-burgundy"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="min-h-[48px] rounded-full bg-burgundy text-xs font-bold uppercase tracking-wider text-ivory"
              >
                Show {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-burgundy"></div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}

