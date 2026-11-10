"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Sun, Sparkles, Moon, ArrowUpRight } from "lucide-react";

const CRAFTS = [
  {
    name: "Neel — Indigo",
    line: "The colour of Jodhpur's old-city walls, hand-dipped onto heavyweight cotton.",
    href: "/product/ts-013",
    swatch: "repeating-linear-gradient(135deg,#1F3A6B 0 10px,#2A4B85 10px 20px)",
  },
  {
    name: "Bandhani",
    line: "Marwar's tie-and-dye dots, scaled up for oversized streetwear.",
    href: "/product/ts-014",
    swatch: "radial-gradient(circle at 6px 6px,#FFF6E0 2px,transparent 2.5px) 0 0/12px 12px,#C2185B",
  },
  {
    name: "Bagru Block Print",
    line: "Carved wooden blocks, pressed by hand, cut into a cropped boxy shirt.",
    href: "/product/ts-020",
    swatch: "radial-gradient(circle,#F6EFE3 3px,transparent 3.5px) 0 0/16px 16px,radial-gradient(circle,#F6EFE3 2px,transparent 2.5px) 8px 8px/16px 16px,#A8432F",
  },
  {
    name: "Bandhgala",
    line: "The Jodhpuri stand collar, reworked as a bomber for sangeet and street.",
    href: "/product/ts-022",
    swatch: "linear-gradient(90deg,#162A4E 0 46%,#E3A33B 46% 54%,#162A4E 54%)",
  },
];

const SEASONS = [
  { icon: Sun, when: "Summer, 40°+", wear: "220–260gsm cotton, indigo & leheriya tees", href: "/oversized" },
  { icon: Sparkles, when: "Wedding & festive season", wear: "Block-print boxy shirts, bandhgala bombers", href: "/boxy-fit" },
  { icon: Moon, when: "Desert winter nights", wear: "400gsm hoodies, chore & field jackets", href: "/jackets" },
];

/** Typographic banner over a jaali lattice — the Blue City in colour, not illustration. */
function Banner() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-burgundy px-6 py-12 text-ivory sm:px-12 sm:py-16">
      <span aria-hidden className="jaali absolute inset-0 text-ivory opacity-[0.12]" />
      <span aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/25 blur-3xl" />
      <div className="relative max-w-2xl">
        <p className="font-serif text-lg italic text-gold">Padharo mhare des</p>
        <h2 className="mt-2 font-display text-5xl font-black uppercase leading-[0.85] sm:text-7xl lg:text-8xl">The Blue City Edit</h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-ivory/80">
          Indigo dips, bandhani dots, hand-carved block prints and the Jodhpuri stand collar — Rajasthani craft, cut as streetwear.
        </p>
        <Link href="/shop?tag=jodhpur" className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-gold px-6 text-xs font-bold uppercase tracking-[0.2em] text-espresso transition-colors hover:bg-gold-light">
          Shop the edit <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function JodhpurEdit() {
  const reduce = useReducedMotion();

  return (
    <section className="mx-auto max-w-[1600px] space-y-8 px-3 sm:px-6 lg:px-8" aria-label="The Blue City Edit">
      <Banner />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CRAFTS.map((c, i) => (
          <motion.div
            key={c.name}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={c.href}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-burgundy/10 bg-ivory-light transition-shadow duration-200 hover:shadow-lg"
            >
              <span aria-hidden className="block h-24 transition-transform duration-500 ease-out group-hover:scale-105" style={{ background: c.swatch }} />
              <span className="flex flex-1 flex-col gap-1.5 p-5">
                <span className="flex items-center justify-between font-serif text-xl text-espresso">
                  {c.name}
                  <ArrowUpRight className="h-4 w-4 text-crimson transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
                <span className="text-sm leading-relaxed text-espresso/70">{c.line}</span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl bg-burgundy p-5 text-ivory sm:p-8">
        <h3 className="font-display text-3xl font-black uppercase sm:text-4xl">What to wear, when</h3>
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {SEASONS.map(({ icon: Icon, when, wear, href }) => (
            <li key={when}>
              <Link href={href} className="flex h-full items-start gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10 transition-colors duration-200 hover:bg-white/10">
                <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" />
                <span>
                  <span className="block text-sm font-semibold">{when}</span>
                  <span className="mt-0.5 block text-xs text-ivory/70">{wear}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
