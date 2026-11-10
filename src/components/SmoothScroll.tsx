"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Lenis inertial wheel scrolling for mouse / trackpad users.
 *
 * - Admin dashboards (/admin/*) run pure native desktop scrolling without Lenis to avoid
 *   interfering with dense data tables, modals, sidebars, and form inputs.
 * - Phones and tablets keep the browser's own touch scrolling, which is already smooth and
 *   GPU-driven.
 * - Drawers, modals, dialogs and anything marked `data-lenis-prevent` scroll natively.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touchFirst = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const isAdmin = pathname?.startsWith("/admin");

    if (reduceMotion || touchFirst || isAdmin) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        (window as unknown as { lenis?: null }).lenis = null;
        lenisRef.current = null;
      }
      return;
    }

    if (!lenisRef.current) {
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
          !!node.closest?.('[role="dialog"], [aria-modal="true"], [data-lenis-prevent], .custom-scrollbar, [data-modal-scroll], textarea, select, input'),
      });

      lenisRef.current = lenis;
      // Exposed so overlays can pause it (see lib/scroll-lock.ts).
      (window as unknown as { lenis?: Lenis }).lenis = lenis;
    }

    return () => {
      lenisRef.current?.destroy();
      (window as unknown as { lenis?: null }).lenis = null;
      lenisRef.current = null;
    };
  }, [pathname]);

  // New page → start at the top (Lenis keeps its own scroll position otherwise).
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
