"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Global Lenis Inertial Smooth Scrolling Provider.
 * Delivers editorial, frictionless, luxury momentum scrolling across all viewports.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Respect system reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Luxury exponential decay
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.2,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Expose lenis instance globally for dialog locks & programmatic navigation
    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    return () => {
      lenis.destroy();
      (window as unknown as { lenis?: null }).lenis = null;
      lenisRef.current = null;
    };
  }, []);

  // Reset scroll position on route change
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [pathname]);

  return null;
}
