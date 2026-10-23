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
    const t = searchParams.get("tag");
    setTag(t ? t.toLowerCase().slice(0, 40) : "");
  }, [searchParams]);

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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-10 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="pb-4 sm:pb-6 border-b border-burgundy/15 flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
        <div>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-crimson block mb-1">
            Complete Streetwear Catalog
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-espresso">
            {selectedCategory === "All" ? "The Core Collection" : selectedCategory}
          </h1>
          <p className="text-[11px] sm:text-xs text-espresso/70 mt-1">
            Showing {filteredProducts.length} pieces of oversized drops, selvedge denim, boxy cuts & outerwear.
          </p>
        </div>

        {/* Sort & Mobile Filter Trigger */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center space-x-2 px-4 py-2.5 bg-white border border-burgundy/20 rounded-md text-xs font-semibold uppercase tracking-wider text-burgundy shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <div className="relative flex items-center bg-white border border-burgundy/20 rounded-md px-3 py-1.5 shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-burgundy/60 mr-2" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-semibold text-espresso focus:outline-none cursor-pointer py-1"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">New Arrivals</option>
            </select>
          </div>
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
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-espresso/40" />
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
                <span className="text-[10px] opacity-70">({products.length})</span>
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
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Slider */}
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
            <div className="flex justify-between text-[10px] text-espresso/50">
              <span>₹500</span>
              <span>₹{Math.round(PRICE_CEILING / 2).toLocaleString("en-IN")}</span>
              <span>₹{PRICE_CEILING.toLocaleString("en-IN")}</span>
            </div>
          </div>

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
            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Modal Drawer */}
      {isMobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-espresso/70 backdrop-blur-xs flex justify-end">
          <div className="bg-ivory w-full max-w-xs h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-burgundy/20">
                <span className="font-serif font-bold text-lg text-espresso">Filters</span>
                <button onClick={() => setIsMobileFilterOpen(false)} aria-label="Close filters">
                  <X className="w-5 h-5 text-burgundy" />
                </button>
              </div>

              {/* Category options */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-burgundy uppercase">Categories</label>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategory("All");
                      setIsMobileFilterOpen(false);
                    }}
                    className={`block w-full text-left py-1 text-xs ${
                      selectedCategory === "All" ? "font-bold text-crimson" : "text-espresso"
                    }`}
                  >
                    All Menswear
                  </button>
                  {ALL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsMobileFilterOpen(false);
                      }}
                      className={`block w-full text-left py-1 text-xs ${
                        selectedCategory === cat ? "font-bold text-crimson" : "text-espresso"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-burgundy">
                  <span>Max Price:</span>
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
                  className="w-full accent-burgundy"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-burgundy/15 space-y-2">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 bg-burgundy text-ivory text-xs font-bold uppercase rounded"
              >
                Apply Filters ({filteredProducts.length})
              </button>
              <button
                onClick={resetFilters}
                className="w-full py-2 text-center text-xs text-crimson underline"
              >
                Reset All Filters
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

