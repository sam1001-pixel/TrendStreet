/**
 * Shared page scroll lock for drawers, sheets and modals.
 *
 * Every overlay used to set `document.body.style.overflow` itself and clear it on close.
 * When two overlays overlapped (Quick view → "Add to bag" opens the bag drawer, then quick view
 * closes), the first one to close unlocked the page while the bag was still open, so the page
 * scrolled behind it. This counts open overlays and only unlocks when the last one closes.
 * It also pauses Lenis smooth scrolling (desktop), which ignores `overflow: hidden`.
 */
type LenisLike = { stop?: () => void; start?: () => void };

let openCount = 0;

function lenis(): LenisLike | undefined {
  return (window as unknown as { lenis?: LenisLike | null }).lenis ?? undefined;
}

/** Locks page scroll and returns a release function (safe to call more than once). */
export function lockScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  openCount += 1;
  if (openCount === 1) {
    const html = document.documentElement;
    // Keep the layout from shifting when a desktop scrollbar disappears.
    const gap = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    lenis()?.stop?.();
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    openCount = Math.max(0, openCount - 1);
    if (openCount === 0) {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      lenis()?.start?.();
    }
  };
}
