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
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";
import type { Product } from "@/types/store";

/** Wire hanger drawn in SVG so it inherits the brass colour token. */
function Hanger() {
  return (
    <svg viewBox="0 0 120 54" className="mx-auto block h-auto w-[78%]" aria-hidden>
      <path d="M60 4c-5 0-8 3.6-8 7.6 0 3.2 2.2 5.4 5 6.6L60 20" fill="none" stroke="var(--color-gold)" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M60 20 6 46c-3 1.5-2 6 1.4 6h105.2c3.4 0 4.4-4.5 1.4-6L60 20Z" fill="none" stroke="var(--color-gold)" strokeWidth="3.2" strokeLinejoin="round" />
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
  // Neighbouring garments sway slightly out of phase so the rail looks physical, not synchronised.
  const phase = useTransform(sway, (v) => v * (0.7 + (index % 3) * 0.2));
  const low = p.inStock && p.stockCount < 10;

  const pendulum = () => {
    if (reduce) return;
    swing.start({
      rotate: [0, 7, -5, 3, -1.5, 0],
      transition: { duration: 1.6, ease: [0.37, 0, 0.63, 1] },
    });
  };

  return (
    <motion.li
      className="relative w-[46vw] flex-shrink-0 snap-start sm:w-[30vw] lg:w-[19vw]"
      // Drops onto the rail from above, one after another.
      initial={reduce ? false : { y: -260, opacity: 0, rotate: index % 2 ? 6 : -6 }}
      animate={inView ? { y: 0, opacity: 1, rotate: 0 } : undefined}
      transition={{ type: "spring", bounce: 0.35, duration: 1.1, delay: 0.12 * index }}
      style={{ transformOrigin: "50% 0%" }}
    >
      <motion.div style={{ rotate: reduce ? 0 : phase, transformOrigin: "50% 0%" }}>
        <motion.div animate={swing} style={{ transformOrigin: "50% 0%" }} onHoverStart={pendulum} onFocus={pendulum}>
          <Hanger />
          <Link
            href={`/product/${p.id}`}
            className="group relative -mt-[6%] block rounded-t-[38%_14%] rounded-b-2xl bg-ivory-light p-1.5 shadow-[0_18px_40px_-18px_rgba(14,22,38,0.55)] ring-1 ring-burgundy/10"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-t-[36%_12%] rounded-b-xl bg-ivory-dark">
              <Image
                src={p.images[0]}
                alt={p.name}
                fill
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 19vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {p.images[1] && (
                <Image
                  src={p.images[1]}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(max-width: 1024px) 30vw, 19vw"
                  className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              )}
              {low && (
                <span className="absolute left-2 top-[18%] rounded-full bg-crimson px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Only {p.stockCount} left
                </span>
              )}
            </div>

            {/* Swing tag on a string */}
            <span className="absolute -right-2 top-[30%] origin-top rotate-6 transition-transform duration-300 ease-out group-hover:rotate-[14deg]">
              <span className="mx-auto block h-5 w-px bg-espresso/40" aria-hidden />
              <span className="block rounded-md bg-gold px-2 py-1.5 text-center font-mono text-[11px] font-bold leading-tight text-espresso shadow-md">
                {formatPrice(p.price)}
              </span>
            </span>

            <span className="block px-1.5 pb-1.5 pt-2.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-crimson">{p.category}</span>
              <span className="mt-0.5 block truncate font-serif text-sm text-espresso sm:text-base">{p.name}</span>
            </span>
          </Link>
        </motion.div>
      </motion.div>
    </motion.li>
  );
}

/** "The Rail": garments drop onto a brass rail as it scrolls in, swing on hover, and sway with scroll speed. */
export function HangingRail({ title = "Fresh off the rail", filter }: { title?: string; filter?: (p: Product) => boolean }) {
  const { products } = useStore();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const reduce = useReducedMotion();

  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const sway = useSpring(useTransform(velocity, [-2500, 0, 2500], [5, 0, -5], { clamp: true }), {
    stiffness: 60,
    damping: 8,
    mass: 0.6,
  });

  const items = (filter ? products.filter(filter) : products.filter((p) => p.isNew || p.featured)).slice(0, 10);
  if (!items.length) return null;

  return (
    <section ref={ref} className="relative overflow-hidden py-4" aria-labelledby="rail-heading">
      <div className="mx-auto mb-8 flex max-w-[1600px] items-end justify-between gap-4 px-4 sm:px-8 lg:px-12">
        <h2 id="rail-heading" className="font-display text-4xl font-black uppercase leading-[0.85] text-espresso sm:text-7xl">
          {title}
        </h2>
        <Link href="/shop" className="min-h-[44px] content-center text-xs font-bold uppercase tracking-[0.2em] text-burgundy hover:text-crimson">
          Shop the rail →
        </Link>
      </div>

      {/* Brass rod */}
      <div className="relative">
        <div aria-hidden className="absolute inset-x-0 top-[6px] z-0 h-[7px] rounded-full bg-gradient-to-b from-gold-light via-gold to-gold-dark shadow-[0_3px_6px_rgba(0,0,0,0.25)]" />
        <ul className="no-scrollbar relative z-10 flex snap-x gap-4 overflow-x-auto px-4 pb-10 pt-0 sm:gap-6 sm:px-8 lg:px-12">
          {items.map((p, i) => (
            <Garment key={p.id} p={p} index={i} inView={inView} sway={sway} reduce={reduce} />
          ))}
        </ul>
      </div>
    </section>
  );
}
