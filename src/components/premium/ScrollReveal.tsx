"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Site-wide card entrance: any element with `data-reveal` slides in as it scrolls into view —
 * from the left if it sits in the left half of the screen, from the right if in the right half.
 * Full-width rows alternate sides. Cards entering together are staggered.
 *
 * Content is never hidden unless this script runs and the visitor allows motion.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const seen = new WeakSet<Element>();
    let batch: HTMLElement[] = [];
    let flushQueued = false;

    const flush = () => {
      flushQueued = false;
      // Stagger in reading order: top-to-bottom, then left-to-right.
      batch
        .sort((a, b) => {
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          return Math.abs(ra.top - rb.top) > 40 ? ra.top - rb.top : ra.left - rb.left;
        })
        .forEach((el, i) => {
          const delay = Math.min(i, 6) * 80;
          el.style.setProperty("--reveal-delay", `${delay}ms`);
          el.classList.add("reveal-in");
          // Hand transitions back to the card's own hover styles once the entrance is done.
          window.setTimeout(() => el.classList.remove("reveal-pending", "reveal-in"), delay + 950);
        });
      batch = [];
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          batch.push(e.target as HTMLElement);
        }
        if (batch.length && !flushQueued) {
          flushQueued = true;
          requestAnimationFrame(flush);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    const prime = (el: HTMLElement, index: number) => {
      if (seen.has(el)) return;
      seen.add(el);
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const fullWidth = r.width > vw * 0.6;
      const fromLeft = fullWidth ? index % 2 === 0 : r.left + r.width / 2 < vw / 2;
      el.style.setProperty("--reveal-x", fromLeft ? "-64px" : "64px");
      el.style.setProperty("--reveal-r", fromLeft ? "-2.5deg" : "2.5deg");
      el.classList.add("reveal-pending");
      io.observe(el);
    };

    const scan = () => document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el, i) => prime(el, i));
    scan();

    // Cards rendered later (filters, live catalog load, tab switches) join automatically.
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
