"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

export const FlyingWearScrollStrip: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Dual-speed horizontal and vertical floating parallax
  const xLeft = useTransform(scrollYProgress, [0, 1], [-80, 80]);
  const xRight = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const rotateLeft = useTransform(scrollYProgress, [0, 1], [-8, 8]);
  const rotateRight = useTransform(scrollYProgress, [0, 1], [6, -6]);

  return (
    <section
      ref={containerRef}
      className="relative py-16 sm:py-24 overflow-hidden bg-espresso text-ivory border-y border-burgundy/40 select-none"
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(107,29,36,0.3),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(197,168,128,0.15),transparent_60%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-10 sm:mb-16">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-burgundy/50 border border-gold/30 text-gold text-xs font-bold uppercase tracking-[0.25em]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Weightless Architecture</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-ivory">
          Flying Sartorial Silhouettes
        </h2>
        <p className="text-xs sm:text-sm text-ivory/70 max-w-xl mx-auto font-light leading-relaxed">
          Crafted with zero-tension shoulders and unlined Italian wools that float with your body in motion. Scroll to experience the new dimension of luxury menswear.
        </p>
      </div>

      {/* Floating Garments Showcase in Parallax Motion */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* Item 1: Floating Suede Flight Jacket */}
        <motion.div
          style={{ x: xLeft, rotate: rotateLeft }}
          className="relative group p-6 rounded-3xl bg-ivory/5 backdrop-blur-md border border-ivory/10 hover:border-gold/40 transition-all flex flex-col items-center text-center"
        >
          <div className="relative w-48 h-48 sm:w-56 sm:h-56">
            <motion.img
              src="/flying-wear-jacket.png"
              alt="Flying Tuscan Suede Flight Jacket"
              animate={{
                y: [0, -12, 0],
                rotate: [0, 2, -1, 0],
              }}
              transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
              className="w-full h-full object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="mt-4 space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-gold block font-semibold">
              Structural Outerwear
            </span>
            <h4 className="font-serif text-base font-bold text-ivory">
              Tuscan Suede Flight Jacket
            </h4>
            <span className="text-xs font-semibold text-ivory/80 block">₹11,999</span>
          </div>
          <Link
            href="/shop?category=Jackets"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold hover:text-ivory transition-colors"
          >
            <span>Explore Jackets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        {/* Item 2: Floating Oversized Hoodie */}
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 1], [30, -30]) }}
          className="relative group p-6 rounded-3xl bg-burgundy/40 backdrop-blur-md border border-burgundy/50 hover:border-gold/40 transition-all flex flex-col items-center text-center shadow-2xl scale-105 z-20"
        >
          <div className="absolute -top-3 px-3 py-1 bg-gold text-espresso text-[10px] font-bold uppercase tracking-widest rounded-full">
            Flagship Drape
          </div>
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 mt-2">
            <motion.img
              src="/flying-wear-coat.png"
              alt="Flying Tokyo Drop-Shoulder Oversized Hoodie"
              animate={{
                y: [0, -16, 0],
                rotate: [0, -2, 2, 0],
              }}
              transition={{ repeat: Infinity, duration: 6.2, ease: "easeInOut" }}
              className="w-full h-full object-contain filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="mt-4 space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-gold block font-semibold">
              520gsm Loopback Terry
            </span>
            <h4 className="font-serif text-lg font-bold text-ivory">
              Tokyo Oversized Hoodie
            </h4>
            <span className="text-sm font-semibold text-gold block">₹4,999</span>
          </div>
          <Link
            href="/shop?category=Oversized"
            className="mt-4 py-2 px-6 bg-gold hover:bg-gold-light text-espresso text-xs font-bold uppercase tracking-widest rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-md"
          >
            <span>Acquire Piece</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        {/* Item 3: Floating Shibuya Carpenter Jeans */}
        <motion.div
          style={{ x: xRight, rotate: rotateRight }}
          className="relative group p-6 rounded-3xl bg-ivory/5 backdrop-blur-md border border-ivory/10 hover:border-gold/40 transition-all flex flex-col items-center text-center"
        >
          <div className="relative w-48 h-48 sm:w-56 sm:h-56">
            <motion.img
              src="/flying-wear-jeans.png"
              alt="Flying Shibuya Relaxed Carpenter Jeans"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 3, -1, 0],
              }}
              transition={{ repeat: Infinity, duration: 4.9, ease: "easeInOut" }}
              className="w-full h-full object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="mt-4 space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-gold block font-semibold">
              Okayama Redline Selvedge
            </span>
            <h4 className="font-serif text-base font-bold text-ivory">
              Relaxed Carpenter Denim
            </h4>
            <span className="text-xs font-semibold text-ivory/80 block">₹5,499</span>
          </div>
          <Link
            href="/shop?category=Jeans"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold hover:text-ivory transition-colors"
          >
            <span>Explore Denim</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
