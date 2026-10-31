"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useAnimationControls,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  MotionValue,
} from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";
import type { Product } from "@/types/store";

/** Architectural tailored brass coat hanger with contoured shoulder curve and brass swivel collar. */
function Hanger() {
  return (
    <svg
      viewBox="0 0 100 36"
      className="mx-auto block h-auto w-[56%] sm:w-[52%] max-w-[120px]"
      aria-hidden
    >
      <defs>
        <linearGradient id="brassHangerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F9F6F4" />
          <stop offset="45%" stopColor="#E3A33B" />
          <stop offset="100%" stopColor="#8C6D3F" />
        </linearGradient>
        <filter id="hangerShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.25" />
        </filter>
      </defs>
      {/* Hook: loops cleanly over the brass rod */}
      <path
        d="M50 13 V11 C50 6 45 2.5 40 4.5 C36 6.5 36 10.5 38 12"
        fill="none"
        stroke="url(#brassHangerGrad)"
        strokeWidth="2.0"
        strokeLinecap="round"
        filter="url(#hangerShadow)"
      />
      {/* Brass swivel ring */}
      <circle cx="50" cy="13.5" r="1.8" fill="#E3A33B" stroke="#8C6D3F" strokeWidth="0.6" />
      {/* Contoured tailored shoulder frame */}
      <path
        d="M50 15 Q28 19 8 30 C5 31.5 5.5 34 8.5 34 L91.5 34 C94.5 34 95 31.5 92 30 Q72 19 50 15 Z"
        fill="none"
        stroke="url(#brassHangerGrad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#hangerShadow)"
      />
      {/* Subtle crossbar highlight */}
      <line x1="16" y1="32" x2="84" y2="32" stroke="#E3A33B" strokeWidth="1" strokeOpacity="0.5" />
    </svg>
  );
}

function Garment({
  p,
  index,
  inView,
  sway,
  reduce,
}: {
  p: Product;
  index: number;
  inView: boolean;
  sway: MotionValue<number>;
  reduce: boolean | null;
}) {
  const swing = useAnimationControls();
  // Neighbouring garments sway slightly out of phase with gentle damping for natural inertia
  const phase = useTransform(sway, (v) => v * (0.6 + (index % 3) * 0.2));
  const low = p.inStock && p.stockCount < 10;

  const pendulum = () => {
    if (reduce) return;
    swing.start({
      rotate: [0, 3.5, -2.2, 1.2, -0.5, 0],
      transition: { duration: 1.4, ease: [0.25, 1, 0.5, 1] },
    });
  };

  return (
    <motion.li
      className="relative w-[160px] xs:w-[175px] sm:w-[210px] md:w-[225px] lg:w-[240px] flex-shrink-0 snap-start select-none"
      initial={reduce ? false : { y: -36, opacity: 0, rotate: index % 2 ? 3 : -3 }}
      animate={inView ? { y: 0, opacity: 1, rotate: 0 } : undefined}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 16,
        mass: 0.7,
        delay: Math.min(index * 0.05, 0.35),
      }}
      style={{ transformOrigin: "50% 0%" }}
    >
      <motion.div style={{ rotate: reduce ? 0 : phase, transformOrigin: "50% 0%" }}>
        <motion.div
          animate={swing}
          style={{ transformOrigin: "50% 0%" }}
          onHoverStart={pendulum}
          onFocus={pendulum}
        >
          <Hanger />
          <Link
            href={`/product/${p.id}`}
            className="group relative -mt-[8px] sm:-mt-[10px] block rounded-t-[2.2rem] rounded-b-2xl bg-white p-2 sm:p-2.5 shadow-[0_12px_28px_-10px_rgba(26,23,18,0.22)] ring-1 ring-burgundy/10 transition-all duration-300 hover:shadow-[0_20px_40px_-10px_rgba(26,23,18,0.32)] hover:-translate-y-0.5"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[1.9rem] rounded-b-xl bg-ivory-dark">
              <Image
                src={p.images[0]}
                alt={p.name}
                fill
                sizes="(max-width: 640px) 175px, (max-width: 1024px) 225px, 240px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {p.images[1] && (
                <Image
                  src={p.images[1]}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(max-width: 640px) 175px, (max-width: 1024px) 225px, 240px"
                  className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              )}
              {low && (
                <span className="absolute left-2 top-2.5 rounded-full bg-crimson px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
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
      </motion.div>
    </motion.li>
  );
}

/** "The Rail": garments gently settle onto an architectural brass rail, sway with scroll inertia, and swing on hover. */
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

  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  // High damping prevents jerky oscillations on mobile touch bursts
  const sway = useSpring(
    useTransform(velocity, [-2000, 0, 2000], [3, 0, -3], { clamp: true }),
    {
      stiffness: 70,
      damping: 18,
      mass: 0.8,
    }
  );

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const distance = scrollRef.current.clientWidth * 0.75;
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
      <div className="mx-auto mb-6 sm:mb-8 flex max-w-[1600px] items-end justify-between gap-4 px-4 sm:px-8 lg:px-12">
        <div>
          <div className="flex items-center gap-1.5 text-gold text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Atelier Rail Selection</span>
          </div>
          <h2
            id="rail-heading"
            className="font-display text-3xl font-black uppercase leading-[0.85] text-espresso sm:text-6xl lg:text-7xl"
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
            className="ml-1 min-h-[40px] content-center text-xs font-bold uppercase tracking-[0.2em] text-burgundy hover:text-crimson transition-colors"
          >
            Shop the rail →
          </Link>
        </div>
      </div>

      {/* Brass rod rail track */}
      <div className="relative">
        {/* Polished brass rod running across */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-[8px] sm:top-[9px] z-0 h-[6px] sm:h-[7px] rounded-full bg-gradient-to-r from-amber-900/60 via-amber-400 to-amber-900/60 shadow-[0_2px_6px_rgba(0,0,0,0.3)] border-b border-amber-950/20"
        />

        {/* Scrollable track with momentum snap */}
        <ul
          ref={scrollRef}
          className="no-scrollbar relative z-10 flex snap-x snap-mandatory gap-3 sm:gap-5 overflow-x-auto px-4 pb-8 pt-0 sm:px-8 lg:px-12 scroll-smooth overscroll-x-contain"
        >
          {items.map((p, i) => (
            <Garment
              key={p.id}
              p={p}
              index={i}
              inView={inView}
              sway={sway}
              reduce={reduce}
            />
          ))}
        </ul>

        {/* Mobile Swipe Cue */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 text-[11px] font-medium text-espresso/50 pt-1">
          <span>← Swipe to explore the rail →</span>
        </div>
      </div>
    </section>
  );
}
