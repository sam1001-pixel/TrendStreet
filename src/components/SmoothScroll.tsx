"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Lenis inertial wheel scrolling for mouse / trackpad users.
 *
 * - Phones and tablets keep the browser's own touch scrolling, which is already smooth and
 *   GPU-driven. Running Lenis there only added a JavaScript loop on every frame (battery + jank).
 * - Drawers, modals and anything marked `data-lenis-prevent` scroll natively, so a wheel over
 *   the bag or quick view scrolls that panel instead of the page behind it.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touchFirst = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (reduceMotion || touchFirst) return;

    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      infinite: false,
      prevent: (node: HTMLElement) =>
        !!node.closest?.('[role="dialog"], [aria-modal="true"], [data-lenis-prevent], textarea, select'),
    });

    lenisRef.current = lenis;
    // Exposed so overlays can pause it (see lib/scroll-lock.ts).
    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    return () => {
      lenis.destroy();
      (window as unknown as { lenis?: null }).lenis = null;
      lenisRef.current = null;
    };
  }, []);

  // New page → start at the top (Lenis keeps its own scroll position otherwise).
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
