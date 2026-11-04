"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { MagneticButton } from "./MagneticButton";
import { useStore } from "@/context/StoreContext";

const LOOKS = [
  {
    key: "Oversized",
    href: "/oversized",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2000&auto=format&fit=crop",
    line: "520gsm loopback. Built to hang, not cling.",
  },
  {
    key: "Boxy Fit",
    href: "/boxy-fit",
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=2000&auto=format&fit=crop",
    line: "Cropped hem, wide body, 3cm collar.",
  },
  {
    key: "Jackets",
    href: "/jackets",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=2000&auto=format&fit=crop",
    line: "Suede bombers and duck canvas chore cuts.",
  },
] as const;

const WORD = "OFFVYBE".split("");
const EASE = [0.22, 1, 0.36, 1] as const;

export function CinematicHero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { siteSettings } = useStore();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.3]);
  const wordY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => {
    if (paused || reduce) return;
    const t = setInterval(() => setActive((i) => (i + 1) % LOOKS.length), 5200);
    return () => clearInterval(t);
  }, [paused, reduce]);

  const look = LOOKS[active];

  return (
    <section
      ref={ref}
      className="relative h-[74svh] min-h-[500px] max-h-[760px] w-full overflow-hidden bg-stone-950 text-white sm:h-[100svh] sm:max-h-none sm:min-h-[560px] grain"
      aria-label="Featured silhouettes"
    >
      {/* Image stage */}
      <motion.div style={{ scale: reduce ? 1 : imgScale }} className="absolute inset-0">
        <AnimatePresence mode="sync">
          <motion.div
            key={look.key}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: EASE }}
            className="absolute inset-0 h-full w-full"
          >
            <Image
              src={look.image}
              alt={`${look.key} silhouette by OFFVYBE`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50" />

      {/* Content */}
      <motion.div style={{ opacity: fade }} className="relative z-10 flex h-full flex-col justify-end px-4 sm:px-8 lg:px-12 pb-8 sm:pb-16">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: EASE }}
          className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
          </span>
          {siteSettings.hero?.badgeText?.trim() || "Drop 04 — live now"}
        </motion.p>

        <AnimatePresence mode="wait">
          <motion.p
            key={look.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="mb-4 max-w-md font-serif text-lg italic text-white/85 sm:mb-6 sm:text-2xl"
          >
            {look.line}
          </motion.p>
        </AnimatePresence>

        {/* Buttons keep the same size whichever silhouette is showing, so nothing jumps when it rotates.
            Phones: stacked, full width (long labels like "Shop Oversized" never spill out of the button).
            Larger screens: side by side with fixed widths; label left, arrow right. */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          <MagneticButton
            href={look.href}
            wrapperClassName="w-full sm:w-[270px]"
            className="w-full justify-center gap-2.5 px-5 tracking-[0.16em] sm:justify-between sm:px-7 sm:tracking-[0.2em]"
          >
            <span className="min-w-0 truncate">Shop {look.key}</span>
            <ArrowRight className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
          </MagneticButton>
          <MagneticButton
            href="/shop"
            variant="ghost"
            wrapperClassName="w-full sm:w-[170px]"
            className="w-full justify-center px-5 tracking-[0.16em] sm:tracking-[0.2em]"
          >
            Shop all
          </MagneticButton>
        </div>

        {/* Silhouette switcher with progress */}
        <div
          className="mt-3 sm:mt-8 grid grid-cols-3 gap-2 sm:max-w-xl"
          role="tablist"
          aria-label="Choose silhouette"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {LOOKS.map((l, i) => (
            <button
              key={l.key}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className="group min-h-[44px] text-left"
            >
              <span
                className={`block text-[11px] font-bold uppercase tracking-[0.18em] transition-colors sm:text-xs ${
                  i === active ? "text-gold font-black" : "text-white/50 group-hover:text-white/80"
                }`}
              >
                {l.key}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Giant kinetic wordmark */}
      <motion.h1
        style={{ y: reduce ? 0 : wordY }}
        className="pointer-events-none absolute inset-x-0 top-[14%] sm:top-[10%] z-[5] select-none whitespace-nowrap px-4 text-center font-display font-black uppercase leading-[0.8] text-white/95 text-[21vw] sm:text-[19vw]"
        aria-label="OFFVYBE"
      >
        {WORD.map((ch, i) => (
          <motion.span
            key={i}
            aria-hidden
            className={`inline-block ${i === 3 ? "text-gold" : ""}`}
            initial={reduce ? false : { y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ delay: 0.05 + i * 0.045, duration: 0.8, ease: EASE }}
          >
            {ch === " " ? " " : ch}
          </motion.span>
        ))}
      </motion.h1>

      <div className="absolute bottom-6 right-4 sm:right-8 z-10 hidden sm:flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/60">
        Scroll <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
      </div>
    </section>
  );
}
