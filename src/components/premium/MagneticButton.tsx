"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

interface MagneticButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "ghost";
  className?: string;
  /** Classes for the outer wrapper (e.g. "w-full sm:w-auto"). */
  wrapperClassName?: string;
}

/** CTA that leans toward the cursor — answers the hover, settles on leave. */
export function MagneticButton({ href, children, variant = "solid", className = "", wrapperClassName = "" }: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.3);
    y.set((e.clientY - r.top - r.height / 2) * 0.4);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const styles =
    variant === "solid"
      ? "bg-white text-stone-950 hover:bg-gold hover:text-white"
      : "border border-white/40 text-white hover:bg-white/10";

  return (
    <motion.div style={{ x, y }} className={`inline-block ${wrapperClassName}`}>
      <Link
        ref={ref}
        href={href}
        onMouseMove={onMove}
        onMouseLeave={reset}
        className={`group inline-flex items-center gap-3 min-h-[48px] px-7 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-200 ${styles} ${className}`}
      >
        {children}
      </Link>
    </motion.div>
  );
}
