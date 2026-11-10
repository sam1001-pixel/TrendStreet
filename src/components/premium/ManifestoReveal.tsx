"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, MotionValue } from "framer-motion";

const TEXT =
  "We make four things and we make them heavy. Loopback that holds its shape, selvedge that fades to you, boxy cuts that stand off the body, jackets built for a decade. No seasons of filler. Just the pieces you reach for first.";

function Word({ word, range, progress }: { word: string; range: [number, number]; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span style={{ opacity }} className="mr-[0.25em] inline-block">
      {word}
    </motion.span>
  );
}

/** Brand story that lights up word by word as you scroll through it. */
export function ManifestoReveal() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = TEXT.split(" ");

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 sm:px-8">
      <p className="mb-6 font-mono text-xs text-burgundy">Why Trend Street</p>
      <p className="font-serif text-3xl leading-[1.2] text-stone-950 sm:text-5xl lg:text-6xl">
        {reduce
          ? TEXT
          : words.map((w, i) => (
              <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
            ))}
      </p>
    </section>
  );
}
