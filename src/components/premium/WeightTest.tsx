"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { CountUp } from "./CountUp";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";

/**
 * "The Weight Test": each silhouette's fabric weight against a typical high-street piece,
 * with meters that fill as the card scrolls in. Hero product per row comes from the live catalog.
 */
const ROWS = [
  { category: "Oversized", productId: "ts-002", unit: "gsm", ours: 520, typical: 180, max: 560, note: "Loopback terry that stands off the shoulder" },
  { category: "Boxy Fit", productId: "ts-007", unit: "gsm", ours: 320, typical: 140, max: 560, note: "Poplin heavy enough to hold a square line" },
  { category: "Jackets", productId: "ts-011", unit: "oz", ours: 14, typical: 7, max: 16, note: "Duck canvas that breaks in, not down" },
] as const;

function Meter({ label, value, max, unit, tone, delay }: { label: string; value: number; max: number; unit: string; tone: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const pct = Math.round((value / max) * 100);

  return (
    <div ref={ref}>
      <div className="mb-1 flex items-baseline justify-between text-[11px]">
        <span className="font-semibold uppercase tracking-wider opacity-70">{label}</span>
        <span className="font-mono font-bold">
          {value}
          {unit}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(127,127,127,0.18)" }}>
        <motion.div
          className={`h-full rounded-full ${tone}`}
          initial={{ width: reduce ? `${pct}%` : 0 }}
          animate={inView ? { width: `${pct}%` } : undefined}
          transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export function WeightTest() {
  const { products } = useStore();

  return (
    <section className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8" aria-labelledby="weight-test-heading">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:mb-10 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">The Weight Test</p>
          <h2 id="weight-test-heading" className="mt-1 font-display text-4xl font-black uppercase leading-[0.85] text-espresso sm:text-6xl lg:text-7xl">
            Heavier.
            <span className="text-outline text-burgundy"> On purpose.</span>
          </h2>
        </div>
        <p className="max-w-sm text-sm text-espresso/70">
          Weight is what makes a tee drape and outerwear hold its structure. Here&apos;s ours next to a typical high-street piece.
        </p>
      </div>

      {/* Mobile: swipe carousel. Desktop: 3-up grid. */}
      <ul className="no-scrollbar -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {ROWS.map((row, i) => {
          const product = products.find((p) => p.id === row.productId);
          const dark = i % 2 === 1;
          return (
            <li key={row.category} className="w-[82%] flex-shrink-0 snap-start sm:w-auto">
              <article
                className={`flex h-full flex-col overflow-hidden rounded-3xl ${
                  dark ? "bg-burgundy text-ivory" : "bg-white text-espresso ring-1 ring-burgundy/10"
                }`}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-3xl font-black uppercase">{row.category}</h3>
                    <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold ${dark ? "bg-gold text-espresso" : "bg-burgundy text-gold"}`}>
                      ×{(row.ours / row.typical).toFixed(1)}
                    </span>
                  </div>
                  <p className={`mt-1 text-xs ${dark ? "text-ivory/70" : "text-espresso/60"}`}>{row.note}</p>

                  <p className={`mt-5 font-display text-6xl font-black leading-none ${dark ? "text-gold" : "text-burgundy"}`}>
                    <CountUp to={row.ours} suffix={row.unit} />
                  </p>

                  <div className="mt-5 space-y-3">
                    <Meter label="Trend Street" value={row.ours} max={row.max} unit={row.unit} tone={dark ? "bg-gold" : "bg-burgundy"} delay={0.1} />
                    <Meter label="Typical high street" value={row.typical} max={row.max} unit={row.unit} tone={dark ? "bg-ivory/50" : "bg-espresso/30"} delay={0.25} />
                  </div>
                </div>

                {product && product.images?.[0] && (
                  <Link
                    href={`/product/${product.id}`}
                    className={`group mt-auto flex items-center gap-3 border-t p-4 transition-colors ${
                      dark ? "border-white/10 hover:bg-white/5" : "border-burgundy/10 hover:bg-ivory"
                    }`}
                  >
                    <span className="relative h-14 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-ivory-dark">
                      <Image src={product.images[0]} alt="" fill sizes="48px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">{product.name}</span>
                      <span className={`text-xs font-bold ${dark ? "text-gold" : "text-burgundy"}`}>{formatPrice(product.price)}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 flex-shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
