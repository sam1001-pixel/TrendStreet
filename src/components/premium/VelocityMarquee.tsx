"use client";

import React, { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";

const wrap = (min: number, max: number, v: number) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

/** Ticker that speeds up, reverses and skews with scroll velocity. */
export function VelocityMarquee({ phrases }: { phrases: string[] }) {
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  // Stop the per-frame loop while the strip is off screen.
  const inView = useInView(boxRef, { margin: "100px 0px" });
  const base = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const factor = useTransform(velocity, [-1500, 0, 1500], [-4, 0, 4], { clamp: false });
  const skew = useTransform(velocity, [-1500, 1500], [8, -8]);
  const dir = useRef(1);
  const x = useTransform(base, (v) => `${wrap(-50, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (reduce || !inView) return;
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    base.set(base.get() - dir.current * 2 * (delta / 1000) * (1 + Math.abs(f)));
  });

  const row = phrases.map((p, i) => (
    <span key={i} className="flex items-center gap-8 pr-8">
      <span>{p}</span>
      <span className="text-gold" aria-hidden>
        ✦
      </span>
    </span>
  ));

  return (
    <div ref={boxRef} className="overflow-hidden bg-burgundy py-3 text-bone sm:py-4">
      <p className="sr-only">{phrases.join(". ")}</p>
      <motion.div
        style={{ x, skewX: reduce ? 0 : skew }}
        className="flex w-max whitespace-nowrap font-display text-xl font-extrabold uppercase sm:text-4xl"
        aria-hidden
      >
        {row}
        {row}
      </motion.div>
    </div>
  );
}
