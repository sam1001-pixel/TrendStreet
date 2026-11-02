"use client";

import React, { useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { formatPrice } from "@/lib/pricing";
import type { Product } from "@/types/store";

/** Architectural tailored brass coat hanger with curved hook and collar ring (ultra-lightweight vector). */
function Hanger() {
  return (
    <svg
      viewBox="0 0 100 34"
      className="mx-auto block h-auto w-[52%] sm:w-[48%] max-w-[110px]"
      aria-hidden
    >
      <defs>
        <linearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F6EFE3" />
          <stop offset="45%" stopColor="#E3A33B" />
          <stop offset="100%" stopColor="#96723B" />
        </linearGradient>
      </defs>
      {/* Swivel hook wrapping over the brass rail */}
      <path
        d="M50 12 V10 C50 5.5 45 2 40 4 C36.5 5.8 36.5 9.5 38.5 11"
        fill="none"
        stroke="url(#brassGrad)"
        strokeWidth="2.0"
        strokeLinecap="round"
      />
      {/* Turned brass collar bead */}
      <circle cx="50" cy="12.5" r="1.6" fill="#E3A33B" stroke="#96723B" strokeWidth="0.5" />
      {/* Contoured coat frame */}
      <path
        d="M50 14 Q28 18 8 28 C5.5 29.2 6 31.5 8.5 31.5 L91.5 31.5 C94 31.5 94.5 29.2 92 28 Q72 18 50 14 Z"
        fill="none"
        stroke="url(#brassGrad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crossbar */}
      <line x1="16" y1="30" x2="84" y2="30" stroke="#E3A33B" strokeWidth="1" strokeOpacity="0.45" />
    </svg>
  );
}

function Garment({
  p,
  index,
  inView,
  reduce,
  onCardClick,
}: {
  p: Product;
  index: number;
  inView: boolean;
  reduce: boolean | null;
  onCardClick: (e: React.MouseEvent) => void;
}) {
  const low = p.inStock && p.stockCount < 10;

  return (
    <motion.li
      className="relative w-[44vw] max-w-[190px] snap-start sm:w-[200px] sm:max-w-none md:w-[215px] lg:w-[230px] flex-shrink-0 select-none transform-gpu"
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: 0.55,
        delay: Math.min(index * 0.05, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ transformOrigin: "50% 0%" }}
    >
      {/* Ambient atelier breathing sway (pure compositor GPU animation, 0% CPU impact) */}
      <motion.div
        className="transform-gpu"
        style={{ transformOrigin: "50% 0%" }}
        animate={
          reduce
            ? undefined
            : {
                rotate: [0, 1.2, 0, -1.2, 0],
              }
        }
        transition={{
          duration: 4.8 + (index % 3) * 0.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: (index % 4) * 0.4,
        }}
        whileHover={
          reduce
            ? undefined
            : {
                rotate: [0, 2.6, -1.6, 0.8, 0],
                transition: { duration: 1.1, ease: "easeOut" },
              }
        }
      >
        <Hanger />
        <Link
          href={`/product/${p.id}`}
          onClick={onCardClick}
          draggable={false}
          className="group relative -mt-[8px] sm:-mt-[10px] block rounded-t-[2.1rem] rounded-b-2xl bg-white p-2 sm:p-2.5 shadow-[0_10px_24px_-8px_rgba(26,23,18,0.18)] ring-1 ring-burgundy/10 transition-all duration-300 hover:shadow-[0_16px_36px_-8px_rgba(26,23,18,0.28)] hover:-translate-y-0.5"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-[1.8rem] rounded-b-xl bg-ivory-dark">
            <Image
              src={p.images[0]}
              alt={p.name}
              fill
              draggable={false}
              sizes="(max-width: 640px) 170px, (max-width: 1024px) 215px, 230px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
            />
            {p.images[1] && (
              <Image
                src={p.images[1]}
                alt=""
                aria-hidden
                fill
                draggable={false}
                sizes="(max-width: 640px) 170px, (max-width: 1024px) 215px, 230px"
                className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"
              />
            )}
            {low && (
              <span className="absolute left-2 top-2 rounded-full bg-crimson px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                Only {p.stockCount} left
              </span>
            )}
          </div>

          {/* Luxury Brass-Eyelet Hanging Price Tag */}
          <span className="absolute -right-1.5 sm:-right-2 top-[24%] origin-top-left rotate-6 transition-transform duration-300 ease-out group-hover:rotate-12 pointer-events-none">
            <span className="mx-auto block h-3.5 w-px bg-espresso/40" aria-hidden />
            <span className="flex items-center gap-1 rounded bg-espresso px-2 py-0.5 text-center font-mono text-[10px] sm:text-[11px] font-bold text-gold shadow-md border border-gold/30">
              {formatPrice(p.price)}
            </span>
          </span>

          {/* Garment Details */}
          <span className="block px-1 pb-1 pt-2">
            <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-crimson">
              {p.category}
            </span>
            <span className="mt-0.5 block truncate font-serif text-xs sm:text-sm font-bold text-espresso group-hover:text-burgundy transition-colors">
              {p.name}
            </span>
            {p.fabric && (
              <span className="mt-0.5 block truncate text-[10px] text-espresso/60 font-light">
                {p.fabric}
              </span>
            )}
          </span>
        </Link>
      </motion.div>
    </motion.li>
  );
}

/** "The Rail": garments gently settle onto an architectural brass rail with fluid momentum gliding. */
export function HangingRail({
  title = "Fresh off the rail",
  filter,
}: {
  title?: string;
  filter?: (p: Product) => boolean;
}) {
  const { products } = useStore();
  const ref = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLUListElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  useAutoScroll(scrollRef, { interval: 3200 });

  // Desktop mouse drag-to-scroll state
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasMoved = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = (e: React.MouseEvent) => {
    // Only primary left button starts drag
    if (e.button !== 0 || !scrollRef.current) return;
    isDown.current = true;
    hasMoved.current = false;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftStart.current = scrollRef.current.scrollLeft;

    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      if (!isDown.current || !scrollRef.current) return;
      const x = moveEvent.pageX - scrollRef.current.offsetLeft;
      const walk = (x - startX.current) * 1.35;
      if (Math.abs(walk) > 6) {
        setIsDragging(true);
        hasMoved.current = true;
      }
      scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
    };

    const handleWindowMouseUp = () => {
      isDown.current = false;
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      setTimeout(() => {
        setIsDragging(false);
        hasMoved.current = false;
      }, 50);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  };

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if (hasMoved.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const distance = scrollRef.current.clientWidth * 0.72;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  const items = (
    filter ? products.filter(filter) : products.filter((p) => p.isNew || p.featured)
  ).slice(0, 10);
  if (!items.length) return null;

  return (
    <section ref={ref} className="relative overflow-hidden py-6 sm:py-8" aria-labelledby="rail-heading">
      {/* Section Header with Left/Right Scroll Controls */}
      <div className="mx-auto mb-5 sm:mb-8 flex max-w-[1600px] items-end justify-between gap-3 px-4 sm:px-8 lg:px-12">
        <div>
          <div className="flex items-center gap-1.5 text-gold text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Atelier Rail Selection</span>
          </div>
          <h2
            id="rail-heading"
            className="font-display text-[2.5rem] font-black uppercase leading-[0.85] text-espresso sm:text-6xl lg:text-7xl"
          >
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll Nav Buttons (Desktop & Tablet) */}
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll rail left"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-burgundy/20 bg-white text-espresso shadow-sm transition-all hover:bg-burgundy hover:text-white active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll rail right"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-burgundy/20 bg-white text-espresso shadow-sm transition-all hover:bg-burgundy hover:text-white active:scale-95"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <Link
            href="/shop"
            className="ml-1 inline-flex min-h-[44px] flex-shrink-0 items-center whitespace-nowrap text-xs font-bold uppercase tracking-[0.15em] text-burgundy hover:text-crimson transition-colors"
          >
            Shop all →
          </Link>
        </div>
      </div>

      {/* Brass rod rail track */}
      <div className="relative">
        {/* Polished brass rod running across */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-[7px] sm:top-[8px] z-0 h-[6px] rounded-full bg-gradient-to-r from-amber-950/70 via-gold to-amber-950/70 shadow-[0_2px_4px_rgba(0,0,0,0.25)] border-b border-amber-950/20"
        />

        {/* Scrollable track with native momentum + desktop mouse drag */}
        <ul
          ref={scrollRef}
          onMouseDown={onMouseDown}
          className={`no-scrollbar relative z-10 flex gap-3 sm:gap-5 snap-x snap-proximity scroll-px-4 overflow-x-auto px-4 pb-8 pt-0 sm:scroll-px-8 sm:px-8 lg:scroll-px-12 lg:px-12 overscroll-x-contain select-none touch-manipulation ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >
          {items.map((p, i) => (
            <Garment
              key={p.id}
              p={p}
              index={i}
              inView={inView}
              reduce={reduce}
              onCardClick={handleCardClick}
            />
          ))}
        </ul>

        {/* Mobile Swipe Cue */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 text-[11px] font-medium text-espresso/50 pt-1">
          <span>Swipe to browse · it moves on its own too</span>
        </div>
      </div>
    </section>
  );
}
