"use client";

import { RefObject, useEffect } from "react";

type Direction = "left" | "right" | "down";

/**
 * Lets a drawer or bottom sheet follow the finger and close when flicked away —
 * right for the bag, left for the menu, down for bottom sheets.
 * Vertical scrolling inside a side drawer keeps working (the gesture locks to one axis),
 * and a bottom sheet only drags down when its content is scrolled to the top.
 */
export function useSwipeToClose(
  ref: RefObject<HTMLElement | null>,
  { direction, onClose, enabled = true }: { direction: Direction; onClose: () => void; enabled?: boolean }
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let axis: "x" | "y" | null = null;
    let offset = 0;
    let tracking = false;

    const along = (dx: number, dy: number) => (direction === "right" ? dx : direction === "left" ? -dx : dy);
    const apply = (px: number, animate: boolean) => {
      // A finished entrance animation (fill-mode: both) would otherwise override the inline transform.
      el.style.animation = "none";
      el.style.transition = animate ? "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)" : "none";
      el.style.transform =
        px === 0 ? "" : direction === "down" ? `translate3d(0, ${px}px, 0)` : `translate3d(${direction === "right" ? px : -px}px, 0, 0)`;
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      // Don't hijack sliders or sideways-scrolling rows inside the panel.
      const target = e.target as HTMLElement;
      if (target.closest('input[type="range"], [data-no-swipe]')) return;
      if (direction === "down" && el.scrollTop > 0) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startT = Date.now();
      axis = null;
      offset = 0;
      tracking = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (!axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      const wanted = direction === "down" ? "y" : "x";
      if (axis !== wanted) {
        tracking = false;
        return;
      }
      offset = Math.max(0, along(dx, dy));
      apply(offset, false);
    };

    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      const speed = offset / Math.max(1, Date.now() - startT); // px per ms
      const size = direction === "down" ? el.offsetHeight : el.offsetWidth;
      if (offset > Math.min(120, size * 0.3) || (offset > 40 && speed > 0.5)) {
        apply(size, true);
        window.setTimeout(onClose, 180);
      } else {
        apply(0, true);
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
      el.style.transform = "";
      el.style.transition = "";
      el.style.animation = "";
    };
  }, [ref, direction, onClose, enabled]);
}
