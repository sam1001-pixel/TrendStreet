"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
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

/** Illustrated Blue City skyline: blue cube houses below the Mehrangarh ridge. */
function Skyline({ reduce }: { reduce: boolean | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const fortY = useTransform(scrollYProgress, [0, 1], ["18%", "-6%"]);
  const housesY = useTransform(scrollYProgress, [0, 1], ["34%", "0%"]);
  const sunY = useTransform(scrollYProgress, [0, 1], ["40%", "-10%"]);

  // Deterministic "random" house blocks so server and client render identically.
  const houses = Array.from({ length: 34 }, (_, i) => {
    const w = 46 + ((i * 37) % 40);
    const h = 40 + ((i * 53) % 70);
    const x = i * 36 - 20;
    const shade = ["#2A4B85", "#3A5F9F", "#5B7FBC", "#22406F", "#87A3D1"][i % 5];
    return { x, w, h, shade, win: i % 3 !== 0 };
  });

  return (
    <div ref={ref} className="relative h-[46vh] min-h-[320px] overflow-hidden rounded-3xl bg-gradient-to-b from-[#F7D9A8] via-[#F2B880] to-[#E3A33B]">
      <motion.div style={{ y: reduce ? 0 : sunY }} className="absolute left-[12%] top-[8%] h-28 w-28 rounded-full bg-[#FFF1D0] opacity-90 blur-[1px] sm:h-40 sm:w-40" aria-hidden />

      {/* Mehrangarh on its ridge */}
      <motion.svg style={{ y: reduce ? 0 : fortY }} viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[78%] w-full" aria-hidden>
        <path d="M0 300V210l120-30 160 10 120-40 140 6 70-30h40l20-50h20v-20h16v20h20l18 50h40l20-18h30l16 18h50l30 40 140-10 120 30 150-10 70 20v84Z" fill="#A8432F" />
        <path d="M612 82h24v40h-24zM660 92h18v30h-18zM700 100h30v26h-30z" fill="#8E3626" />
        <path d="M0 300v-40l200-14 260 8 300-20 240 10 200-6v62Z" fill="#8E3626" opacity=".55" />
      </motion.svg>

      {/* Blue City houses */}
      <motion.svg style={{ y: reduce ? 0 : housesY }} viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[52%] w-full" aria-hidden>
        {houses.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={200 - b.h} width={b.w} height={b.h} fill={b.shade} />
            {b.win && <rect x={b.x + b.w / 2 - 5} y={200 - b.h + 14} width="10" height="14" rx="5" fill="#0E1626" opacity=".55" />}
          </g>
        ))}
      </motion.svg>

      <div className="relative z-10 p-6 sm:p-10">
        <p className="font-serif text-lg italic text-espresso/80">Padharo mhare des —</p>
        <h2 className="mt-1 max-w-xl font-display text-5xl font-black uppercase leading-[0.85] text-espresso sm:text-7xl">
          The Blue City Edit
        </h2>
      </div>
    </div>
  );
}

export function JodhpurEdit() {
  const reduce = useReducedMotion();

  return (
    <section className="mx-auto max-w-[1600px] space-y-8 px-3 sm:px-6 lg:px-8" aria-label="The Blue City Edit">
      <Skyline reduce={reduce} />

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
