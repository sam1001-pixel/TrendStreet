"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";
import type { Product } from "@/types/store";

const LOW_STOCK = 10;

function RunwayCard({
  p,
  i,
  total,
  hasDragged,
}: {
  p: Product;
  i: number;
  total: number;
  hasDragged: React.MutableRefObject<boolean>;
}) {
  const { addToCart } = useStore();
  const [picking, setPicking] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const low = p.inStock && p.stockCount < LOW_STOCK;
  const off =
    p.originalPrice && p.originalPrice > p.price
      ? Math.round((1 - p.price / p.originalPrice) * 100)
      : 0;

  const add = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(p, size, p.colors[0]?.name || "Default", 1);
    setAdded(size);
    setPicking(false);
    setTimeout(() => setAdded(null), 1800);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="group relative w-[210px] xs:w-[230px] sm:w-[250px] md:w-[270px] lg:w-[285px] flex-shrink-0 snap-start select-none flex flex-col">
      {/* Product Image Frame */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-stone-900 border border-white/10 shadow-lg">
        <Link
          href={`/product/${p.id}`}
          onClick={handleCardClick}
          aria-label={p.name}
          className="absolute inset-0 block"
        >
          <Image
            src={p.images[0]}
            alt={p.name}
            fill
            sizes="(max-width: 640px) 230px, (max-width: 1024px) 270px, 285px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {p.images[1] && (
            <Image
              src={p.images[1]}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 640px) 230px, (max-width: 1024px) 270px, 285px"
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Top Badges: Sequence Number & Sale / Stock Tags */}
        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 z-10 flex items-start justify-between gap-1.5">
          <span className="rounded bg-black/65 backdrop-blur-md px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-semibold text-white/90 border border-white/10">
            {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>

          <div className="flex flex-col items-end gap-1">
            {off > 0 && (
              <span className="rounded bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-950 shadow-sm">
                −{off}%
              </span>
            )}
            {low && (
              <span className="flex items-center gap-1 rounded bg-crimson/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                Only {p.stockCount}
              </span>
            )}
          </div>
        </div>

        {/* Quick Add Overlay */}
        <div className="absolute inset-x-2.5 bottom-2.5 z-20">
          <AnimatePresence mode="wait" initial={false}>
            {picking ? (
              <motion.div
                key="sizes"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.16 }}
                className="flex flex-wrap items-center gap-1 rounded-xl bg-stone-950/95 p-1.5 backdrop-blur border border-white/15 shadow-xl"
              >
                {p.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={(e) => add(e, s)}
                    className="min-h-[32px] min-w-[32px] flex-1 rounded-lg border border-white/20 text-[11px] font-bold text-white transition-all hover:bg-gold hover:text-stone-950 hover:border-gold"
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPicking(false);
                  }}
                  className="px-2 py-1 text-[11px] text-white/50 hover:text-white"
                  title="Close sizes"
                >
                  ✕
                </button>
              </motion.div>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (p.inStock) setPicking(true);
                }}
                disabled={!p.inStock}
                className={`flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.14em] backdrop-blur-md transition-all duration-200 shadow-md ${
                  added
                    ? "bg-emerald-600 text-white"
                    : "bg-white/95 text-stone-950 hover:bg-gold hover:shadow-lg active:scale-95"
                }`}
              >
                {added ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {added ? `Size ${added} Added` : p.inStock ? "Quick add" : "Sold out"}
              </button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Card Details: Category, Title, Price */}
      <div className="mt-3 flex flex-col gap-0.5 px-0.5 text-white">
        <div className="flex items-center justify-between">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-gold truncate">
            {p.category}
          </p>
        </div>

        <Link
          href={`/product/${p.id}`}
          onClick={handleCardClick}
          className="group/link"
        >
          <h3 className="truncate font-serif text-sm sm:text-base font-medium text-white transition-colors group-hover/link:text-gold">
            {p.name}
          </h3>
        </Link>

        <div className="mt-0.5 flex items-baseline gap-2 font-mono">
          <span className="text-sm sm:text-[15px] font-bold text-white">
            {formatPrice(p.price)}
          </span>
          {off > 0 && (
            <span className="text-[11px] text-white/40 line-through">
              {formatPrice(p.originalPrice!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Luxury Interactive Slider for The Runway (free of scroll-jacking) */
export function ScrollProductReel() {
  const { products } = useStore();
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const hasDragged = useRef(false);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const items = products.slice(0, 10);

  const updateScrollButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons, items.length]);

  const slide = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.min(el.clientWidth * 0.75, 600);
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only primary left button starts drag
    if (e.button !== 0 || !trackRef.current) return;
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.pageX - trackRef.current.offsetLeft;
    scrollStart.current = trackRef.current.scrollLeft;

    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current || !trackRef.current) return;
      const x = moveEvent.pageX - trackRef.current.offsetLeft;
      const walk = (x - startX.current) * 1.3;
      if (Math.abs(walk) > 5) {
        hasDragged.current = true;
      }
      trackRef.current.scrollLeft = scrollStart.current - walk;
    };

    const handleWindowMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      setTimeout(() => {
        hasDragged.current = false;
      }, 60);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  };

  if (items.length === 0) return null;

  return (
    <section className="bg-ink py-10 sm:py-16 md:py-20 text-white relative overflow-hidden" aria-label="The runway">
      {/* Header with Navigation Controls */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-4 sm:px-8 lg:px-12">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold/90">
              Most-Bagged This Week
            </span>
          </div>
          <h2 className="font-display text-3xl font-black uppercase leading-[0.9] text-white sm:text-5xl lg:text-6xl tracking-tight">
            The <span className="text-gold">Runway</span>
          </h2>
        </div>

        {/* Right Controls: Shop All + Prev/Next slider buttons */}
        <div className="flex items-center gap-4 sm:gap-6 self-between sm:self-auto">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/70 hover:text-gold transition-colors"
          >
            <span>Shop All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => slide("left")}
              disabled={!canScrollLeft}
              aria-label="Previous cards"
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/20 bg-stone-900/80 text-white transition-all hover:bg-gold hover:text-stone-950 hover:border-gold disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-stone-900/80 disabled:hover:text-white disabled:hover:border-white/20"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={() => slide("right")}
              disabled={!canScrollRight}
              aria-label="Next cards"
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/20 bg-stone-900/80 text-white transition-all hover:bg-gold hover:text-stone-950 hover:border-gold disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-stone-900/80 disabled:hover:text-white disabled:hover:border-white/20"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Interactive Slider Track */}
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 sm:px-8 lg:px-12 py-2 cursor-grab active:cursor-grabbing select-none touch-pan-y"
        style={{ scrollBehavior: isDragging.current ? "auto" : "smooth" }}
      >
        {items.map((p, i) => (
          <RunwayCard
            key={p.id}
            p={p}
            i={i}
            total={items.length}
            hasDragged={hasDragged}
          />
        ))}
      </div>
    </section>
  );
}
