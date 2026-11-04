"use client";

import { RefObject, useEffect } from "react";

/**
 * Gently advances a horizontal scroller one card at a time, looping back to the start.
 *
 * - Runs only while the row is on screen and the tab is visible.
 * - Pauses as soon as someone touches, drags, hovers or tabs into it, and resumes a few
 *   seconds after they let go, so it never fights the shopper.
 * - Off entirely for visitors who ask their device to reduce motion.
 */
export function useAutoScroll(
  ref: RefObject<HTMLElement | null>,
  { interval = 3500, resumeAfter = 5000, enabled = true }: { interval?: number; resumeAfter?: number; enabled?: boolean } = {}
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let visible = false;
    let pausedUntil = 0;
    let holding = false;

    const pause = () => {
      holding = true;
    };
    const release = () => {
      holding = false;
      pausedUntil = Date.now() + resumeAfter;
    };
    // A wheel or trackpad swipe also counts as the shopper taking over.
    const nudge = () => {
      pausedUntil = Date.now() + resumeAfter;
    };

    const step = () => {
      const first = el.firstElementChild as HTMLElement | null;
      if (!first) return;
      const gap = parseFloat(getComputedStyle(el).columnGap || "0") || 0;
      const card = first.getBoundingClientRect().width + gap;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: card, behavior: "smooth" });
    };

    const timer = window.setInterval(() => {
      if (!visible || holding || document.hidden || Date.now() < pausedUntil) return;
      step();
    }, interval);

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0.4 });
    io.observe(el);

    el.addEventListener("pointerdown", pause, { passive: true });
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("mouseenter", pause);
    el.addEventListener("focusin", pause);
    el.addEventListener("pointerup", release, { passive: true });
    el.addEventListener("touchend", release, { passive: true });
    el.addEventListener("mouseleave", release);
    el.addEventListener("focusout", release);
    el.addEventListener("wheel", nudge, { passive: true });

    return () => {
      window.clearInterval(timer);
      io.disconnect();
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("focusin", pause);
      el.removeEventListener("pointerup", release);
      el.removeEventListener("touchend", release);
      el.removeEventListener("mouseleave", release);
      el.removeEventListener("focusout", release);
      el.removeEventListener("wheel", nudge);
    };
  }, [ref, interval, resumeAfter, enabled]);
}
