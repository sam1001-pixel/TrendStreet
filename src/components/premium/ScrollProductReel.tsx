"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion, useMotionValue, useSpring } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";
import type { Product } from "@/types/store";

const LOW_STOCK = 10;

function RunwayCard({ p, i, total }: { p: Product; i: number; total: number }) {
  const { addToCart } = useStore();
  const [picking, setPicking] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const low = p.inStock && p.stockCount < LOW_STOCK;
  const off = p.originalPrice && p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

  const add = (size: string) => {
    addToCart(p, size, p.colors[0]?.name || "Default", 1);
    setAdded(size);
    setPicking(false);
    setTimeout(() => setAdded(null), 1800);
  };

  return (
    <div className="group relative w-[60vw] flex-shrink-0 sm:w-[42vw] lg:w-[28vw]" data-cursor="view">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-stone-800">
        <Link href={`/product/${p.id}`} aria-label={p.name} className="absolute inset-0">
          <Image
            src={p.images[0]}
            alt={p.name}
            fill
            sizes="(max-width: 640px) 60vw, (max-width: 1024px) 42vw, 28vw"
            className="object-cover transition-opacity duration-500 group-hover:opacity-0"
          />
          {p.images[1] && (
            <Image
              src={p.images[1]}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 1024px) 42vw, 28vw"
              className="scale-105 object-cover opacity-0 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between">
          <span className="font-mono text-xs text-white mix-blend-difference">
            {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <div className="flex flex-col items-end gap-1.5">
            {low && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-crimson">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crimson" />
                Only {p.stockCount} left
              </span>
            )}
            {off > 0 && (
              <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-950">
                −{off}%
              </span>
            )}
          </div>
        </div>

        {/* Quick add: one tap to pick a size, one tap to bag it */}
        <div className="absolute inset-x-3 bottom-3">
          <AnimatePresence mode="wait" initial={false}>
            {picking ? (
              <motion.div
                key="sizes"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-wrap gap-1.5 rounded-xl bg-white/95 p-2 backdrop-blur"
              >
                {p.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => add(s)}
                    className="min-h-[40px] min-w-[44px] flex-1 rounded-lg border border-stone-200 text-xs font-bold text-stone-900 transition-colors hover:border-stone-950 hover:bg-stone-950 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.button
                key="cta"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                onClick={() => setPicking(true)}
                disabled={!p.inStock}
                className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-[0.18em] backdrop-blur transition-all duration-200 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-visible:translate-y-0 lg:focus-visible:opacity-100 ${
                  added ? "bg-emerald-600 text-white lg:translate-y-0 lg:opacity-100" : "bg-white/95 text-stone-950 hover:bg-gold"
                }`}
              >
                {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {added ? `Size ${added} in your bag` : p.inStock ? "Quick add" : "Sold out"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Link href={`/product/${p.id}`} className="mt-4 flex items-start justify-between gap-4 text-white">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">{p.category}</p>
          <h3 className="mt-1 truncate font-serif text-lg">{p.name}</h3>
        </div>
        <div className="text-right font-mono text-sm">
          <p>{formatPrice(p.price)}</p>
          {off > 0 && <p className="text-xs text-white/40 line-through">{formatPrice(p.originalPrice!)}</p>}
        </div>
      </Link>
    </div>
  );
}

/** A floating "View" disc that trails the cursor over product imagery (desktop pointers only). */
function ViewCursor({ scope }: { scope: React.RefObject<HTMLElement> }) {
  const x = useSpring(useMotionValue(-100), { stiffness: 400, damping: 35 });
  const y = useSpring(useMotionValue(-100), { stiffness: 400, damping: 35 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = scope.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement;
      setShow(!!t.closest("[data-cursor='view'] a[aria-label]"));
    };
    const leave = () => setShow(false);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [scope, x, y]);

  return (
    <motion.div
      aria-hidden
      style={{ x, y }}
      className="pointer-events-none fixed left-0 top-0 z-50 -ml-11 -mt-11 hidden lg:block"
    >
      <motion.div
        animate={{ scale: show ? 1 : 0, opacity: show ? 1 : 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gold text-[11px] font-bold uppercase tracking-[0.2em] text-stone-950"
      >
        View
      </motion.div>
    </motion.div>
  );
}

/** The one pinned scroll scene: vertical scroll drives a horizontal runway of pieces. */
export function ScrollProductReel() {
  const { products } = useStore();
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const items = products.slice(0, 8);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (el) setDistance(Math.max(0, el.scrollWidth - window.innerWidth + 32));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [items.length]);

  const { scrollYProgress } = useScroll({ target: ref });
  const x = useTransform(scrollYProgress, [0.05, 0.95], [0, -distance]);

  if (items.length === 0) return null;

  const header = (
    <div className="mb-8 flex items-end justify-between gap-4 px-4 sm:px-8 lg:px-12">
      <div>
        <p className="mb-2 text-sm text-white/60">Most-bagged this week</p>
        <h2 className="font-display text-4xl font-black uppercase leading-[0.85] text-white sm:text-7xl">
          The <span className="text-gold">Runway</span>
        </h2>
      </div>
      <Link
        href="/shop"
        className="min-h-[44px] content-center text-xs font-bold uppercase tracking-[0.2em] text-white/70 underline-offset-4 hover:text-white hover:underline"
      >
        Shop all
      </Link>
    </div>
  );

  if (reduce) {
    return (
      <section className="bg-ink py-16">
        {header}
        <div className="no-scrollbar flex gap-5 overflow-x-auto px-4 sm:px-8">
          {items.map((p, i) => (
            <RunwayCard key={p.id} p={p} i={i} total={items.length} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[240vh] bg-ink sm:h-[300vh]" aria-label="The runway">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        {header}
        <motion.div ref={trackRef} style={{ x }} className="flex w-max gap-5 pl-4 sm:gap-8 sm:pl-8 lg:pl-12">
          {items.map((p, i) => (
            <RunwayCard key={p.id} p={p} i={i} total={items.length} />
          ))}
        </motion.div>
      </div>
      <ViewCursor scope={ref} />
    </section>
  );
}
